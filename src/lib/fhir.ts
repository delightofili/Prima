import { isSensitiveCode } from "./icd10";
import type { Guardian, ImmunizationRecord, Patient, Visit } from "../types";

export interface FhirResource {
  resourceType: string;
  id: string;
  [key: string]: unknown;
}

export interface FhirFacility {
  id: string;
  name: string;
  code: string;
  lga: string;
  state: string;
}

export interface FhirInput {
  facility: FhirFacility;
  patients: Patient[];
  visits: Visit[];
  shots: ImmunizationRecord[];
  guardians: Guardian[];
  includeSensitive: boolean;
}

export interface FhirResult {
  resources: FhirResource[];
  counts: Record<string, number>;
  withheld: number; // visits whose diagnosis, complaint and treatment were left out as sensitive
  dangling: string[]; // references that point to something not in the file
}

// Prima's own identifiers use urn: names until the project has a web address of its own.
const SYS = {
  card: "urn:prima:card-number",
  nhis: "urn:prima:nhis-number",
  facility: "urn:prima:facility-code",
  treatment: "urn:prima:ext:treatment-note",
  icd10: "http://hl7.org/fhir/sid/icd-10",
  cvx: "http://hl7.org/fhir/sid/cvx",
  loinc: "http://loinc.org",
  snomed: "http://snomed.info/sct",
  ucum: "http://unitsofmeasure.org",
  actCode: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
  roleCode: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
  contactRel: "http://terminology.hl7.org/CodeSystem/v2-0131",
  orgType: "http://terminology.hl7.org/CodeSystem/organization-type",
  obsCat: "http://terminology.hl7.org/CodeSystem/observation-category",
  condCat: "http://terminology.hl7.org/CodeSystem/condition-category",
  condClin: "http://terminology.hl7.org/CodeSystem/condition-clinical",
  allergyClin:
    "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
  dobEstimated: "urn:prima:ext:birth-date-estimated",
} as const;

// Prima records the vaccine by name only, so "unspecified formulation" codes are used where they exist.
const CVX: Record<string, { code: string; display: string }> = {
  BCG: { code: "19", display: "BCG" },
  HepB: { code: "08", display: "Hep B, adolescent or pediatric" },
  OPV: { code: "182", display: "Oral Polio Vaccine, Unspecified formulation" },
  Penta: { code: "102", display: "DTP-Hib-Hep B" },
  PCV: {
    code: "152",
    display: "Pneumococcal Conjugate, unspecified formulation",
  },
  Rota: { code: "122", display: "rotavirus, unspecified formulation" },
  IPV: { code: "10", display: "IPV" },
  Measles: { code: "05", display: "measles" },
  "Yellow fever": { code: "37", display: "yellow fever" },
};

const ROLE: Record<string, { code: string; display: string }> = {
  MOTHER: { code: "MTH", display: "mother" },
  FATHER: { code: "FTH", display: "father" },
  GRANDPARENT: { code: "GRPRN", display: "grandparent" },
  SIBLING: { code: "SIB", display: "sibling" },
  AUNT_UNCLE: { code: "EXT", display: "extended family member" },
};
const GUARDIAN_ROLE = { code: "GUARD", display: "guardian" };

const NO_ALLERGY =
  /^(none|nil|no|n\/a|nka|nkda|no known allergy|no known allergies|no known drug allergies)\.?$/i;

const enc = new TextEncoder();

// A stable id for things Prima does not store as separate records (a blood pressure reading, a diagnosis).
// The same visit always gives the same id, so importing the file twice updates instead of duplicating.
async function uuidFrom(seed: string): Promise<string> {
  const d = new Uint8Array(
    await crypto.subtle.digest("SHA-1", enc.encode(seed)),
  );
  d[6] = (d[6] & 0x0f) | 0x50;
  d[8] = (d[8] & 0x3f) | 0x80;
  const h = [...d.subarray(0, 16)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const instant = (ms: number) => new Date(ms).toISOString();
const ref = (type: string, id: string) => ({ reference: `${type}/${id}` });
const coding = (system: string, code: string, display?: string) => ({
  system,
  code,
  ...(display ? { display } : {}),
});
const quantity = (value: number, unit: string, code: string) => ({
  value,
  unit,
  system: SYS.ucum,
  code,
});
const phone = (value: string) => ({ system: "phone", value, use: "mobile" });
const isNum = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

export async function buildFhir(input: FhirInput): Promise<FhirResult> {
  const { facility, includeSensitive } = input;
  const out: FhirResource[] = [];
  const counts: Record<string, number> = {};
  let withheld = 0;

  const add = (r: FhirResource) => {
    out.push(r);
    counts[r.resourceType] = (counts[r.resourceType] ?? 0) + 1;
  };

  add({
    resourceType: "Organization",
    id: facility.id,
    identifier: [{ system: SYS.facility, value: facility.code }],
    active: true,
    type: [{ coding: [coding(SYS.orgType, "prov", "Healthcare Provider")] }],
    name: facility.name,
    address: [{ district: facility.lga, state: facility.state, country: "NG" }],
  });

  // Deleted, merged and erased patients are not exported
  const patients = input.patients.filter((p) => !p.deletedAt && !p.erasedAt);
  const patientIds = new Set(patients.map((p) => p.id));
  const patientResources = new Map<string, FhirResource>();

  for (const p of patients) {
    const identifier: unknown[] = [
      {
        use: "usual",
        type: { text: "Prima card number" },
        system: SYS.card,
        value: p.cardNumber,
      },
    ];
    if (p.nhisNumber)
      identifier.push({
        type: { text: "NHIS number" },
        system: SYS.nhis,
        value: p.nhisNumber,
      });

    const r: FhirResource = {
      resourceType: "Patient",
      id: p.id,
      meta: { lastUpdated: instant(p.updatedAt) },
      identifier,
      active: true,
      name: [{ use: "official", text: p.fullName }],
      gender: p.gender === "FEMALE" ? "female" : "male",
      birthDate: p.dob,
      address: [
        {
          use: "home",
          city: p.village,
          district: p.lga,
          state: p.state,
          country: "NG",
        },
      ],
      managingOrganization: ref("Organization", facility.id),
    };
    if (p.dobEstimated)
      r.extension = [{ url: SYS.dobEstimated, valueBoolean: true }]; // the birth date is a guess from the age
    if (p.phone) r.telecom = [phone(p.phone)];
    if (p.nextOfKinName || p.nextOfKinPhone) {
      r.contact = [
        {
          relationship: [
            { coding: [coding(SYS.contactRel, "N", "Next-of-Kin")] },
          ],
          ...(p.nextOfKinName ? { name: { text: p.nextOfKinName } } : {}),
          ...(p.nextOfKinPhone ? { telecom: [phone(p.nextOfKinPhone)] } : {}),
        },
      ];
    }
    patientResources.set(p.id, r);
  }

  // Guardians become RelatedPerson, one per guardian and child
  const guardians = new Map(
    input.guardians.filter((g) => !g.deletedAt).map((g) => [g.id, g] as const),
  );
  const related: FhirResource[] = [];
  for (const p of patients) {
    const g = p.guardianId ? guardians.get(p.guardianId) : undefined;
    if (!g) continue;
    const role = ROLE[g.relationship] ?? GUARDIAN_ROLE;
    const id = await uuidFrom(`relatedperson:${g.id}:${p.id}`);
    related.push({
      resourceType: "RelatedPerson",
      id,
      meta: { lastUpdated: instant(g.updatedAt) },
      active: true,
      patient: ref("Patient", p.id),
      relationship: [
        { coding: [coding(SYS.roleCode, role.code, role.display)] },
      ],
      name: [{ text: g.fullName }],
      ...(g.phone ? { telecom: [phone(g.phone)] } : {}),
    });
    // When the guardian is also a patient here (a mother in antenatal care), link her record to this role
    const mother = g.patientId ? patientResources.get(g.patientId) : undefined;
    if (mother) {
      const link = (mother.link as unknown[] | undefined) ?? [];
      link.push({ other: ref("RelatedPerson", id), type: "seealso" });
      mother.link = link;
    }
  }

  patientResources.forEach(add);
  related.forEach(add);

  // Patient-level facts
  for (const p of patients) {
    const subject = ref("Patient", p.id);
    const stamp = instant(p.updatedAt);

    const allergy = p.allergies?.trim();
    if (allergy && !NO_ALLERGY.test(allergy)) {
      add({
        resourceType: "AllergyIntolerance",
        id: await uuidFrom(`allergy:${p.id}`),
        clinicalStatus: { coding: [coding(SYS.allergyClin, "active")] },
        patient: subject,
        code: { text: allergy },
      });
    }

    const blood = p.bloodGroup ? String(p.bloodGroup) : "";
    if (blood && blood.toUpperCase() !== "UNKNOWN") {
      add({
        resourceType: "Observation",
        id: await uuidFrom(`bloodgroup:${p.id}`),
        status: "final",
        code: { text: "Blood group" },
        subject,
        effectiveDateTime: stamp,
        valueString: blood.replace("_POS", "+").replace("_NEG", "-"),
      });
    }

    if (p.isPregnant) {
      add({
        resourceType: "Observation",
        id: await uuidFrom(`pregnant:${p.id}`),
        status: "final",
        code: { coding: [coding(SYS.loinc, "82810-3", "Pregnancy status")] },
        subject,
        effectiveDateTime: stamp,
        valueCodeableConcept: {
          coding: [coding(SYS.snomed, "77386006", "Pregnant")],
        },
      });
    }
    for (const [key, loinc, display, value] of [
      ["gravida", "11996-6", "[#] Pregnancies", p.gravida],
      ["para", "11977-6", "[#] Parity", p.para],
    ] as const) {
      if (!isNum(value)) continue;
      add({
        resourceType: "Observation",
        id: await uuidFrom(`${key}:${p.id}`),
        status: "final",
        code: { coding: [coding(SYS.loinc, loinc, display)] },
        subject,
        effectiveDateTime: stamp,
        valueInteger: value,
      });
    }
  }

  // Visits
  const vitals = [
    { coding: [coding(SYS.obsCat, "vital-signs", "Vital Signs")] },
  ];
  for (const v of input.visits) {
    if (v.deletedAt || v.erasedAt || !patientIds.has(v.patientId)) continue;

    const subject = ref("Patient", v.patientId);
    const encounter = ref("Encounter", v.id);
    const withhold = !includeSensitive && isSensitiveCode(v.diagnosisCode);
    if (withhold) withheld++;

    const e: FhirResource = {
      resourceType: "Encounter",
      id: v.id,
      meta: { lastUpdated: instant(v.updatedAt) },
      status: "finished",
      class: coding(SYS.actCode, "AMB", "ambulatory"),
      subject,
      period: { start: v.visitDate },
      serviceProvider: ref("Organization", facility.id),
    };
    if (!withhold) {
      if (v.complaints?.trim()) e.reasonCode = [{ text: v.complaints.trim() }];
      if (v.treatment?.trim())
        e.extension = [{ url: SYS.treatment, valueString: v.treatment.trim() }];
    }

    if (!withhold && (v.diagnosisCode || v.diagnosisLabel?.trim())) {
      const conditionId = await uuidFrom(`condition:${v.id}`);
      add({
        resourceType: "Condition",
        id: conditionId,
        clinicalStatus: { coding: [coding(SYS.condClin, "active")] },
        category: [
          {
            coding: [
              coding(SYS.condCat, "encounter-diagnosis", "Encounter Diagnosis"),
            ],
          },
        ],
        code: {
          ...(v.diagnosisCode
            ? {
                coding: [
                  coding(
                    SYS.icd10,
                    v.diagnosisCode,
                    v.diagnosisLabel?.trim() || undefined,
                  ),
                ],
              }
            : {}),
          text: v.diagnosisLabel?.trim() || v.diagnosisCode,
        },
        subject,
        encounter,
        recordedDate: v.visitDate,
      });
      e.diagnosis = [{ condition: ref("Condition", conditionId) }];
    }
    add(e);

    const base = {
      status: "final",
      category: vitals,
      subject,
      encounter,
      effectiveDateTime: v.visitDate,
    };
    if (isNum(v.systolic) && isNum(v.diastolic)) {
      add({
        resourceType: "Observation",
        id: await uuidFrom(`bp:${v.id}`),
        ...base,
        code: {
          coding: [
            coding(
              SYS.loinc,
              "85354-9",
              "Blood pressure panel with all children optional",
            ),
          ],
          text: "Blood pressure",
        },
        component: [
          {
            code: {
              coding: [coding(SYS.loinc, "8480-6", "Systolic blood pressure")],
            },
            valueQuantity: quantity(v.systolic, "mmHg", "mm[Hg]"),
          },
          {
            code: {
              coding: [coding(SYS.loinc, "8462-4", "Diastolic blood pressure")],
            },
            valueQuantity: quantity(v.diastolic, "mmHg", "mm[Hg]"),
          },
        ],
      });
    }
    if (isNum(v.temperature)) {
      add({
        resourceType: "Observation",
        id: await uuidFrom(`temp:${v.id}`),
        ...base,
        code: { coding: [coding(SYS.loinc, "8310-5", "Body temperature")] },
        valueQuantity: quantity(v.temperature, "°C", "Cel"),
      });
    }
    if (isNum(v.weightKg)) {
      add({
        resourceType: "Observation",
        id: await uuidFrom(`weight:${v.id}`),
        ...base,
        code: { coding: [coding(SYS.loinc, "29463-7", "Body weight")] },
        valueQuantity: quantity(v.weightKg, "kg", "kg"),
      });
    }
  }

  // Vaccines
  for (const s of input.shots) {
    if (s.deletedAt || !patientIds.has(s.patientId)) continue;
    const c = CVX[s.vaccineName];
    add({
      resourceType: "Immunization",
      id: s.id,
      meta: { lastUpdated: instant(s.updatedAt) },
      status: "completed",
      vaccineCode: {
        ...(c ? { coding: [coding(SYS.cvx, c.code, c.display)] } : {}),
        text: s.vaccineName,
      },
      patient: ref("Patient", s.patientId),
      occurrenceDateTime: s.dateGiven,
      primarySource: true,
      performer: [{ actor: ref("Organization", facility.id) }],
      // Dose 0 (birth doses) is not a positive integer, so it is written as text
      protocolApplied: [
        s.doseNumber >= 1
          ? { doseNumberPositiveInt: s.doseNumber }
          : { doseNumberString: String(s.doseNumber) },
      ],
    });
  }

  return {
    resources: out,
    counts,
    withheld,
    dangling: danglingReferences(out),
  };
}

// Every reference should point at something inside the file
function danglingReferences(resources: FhirResource[]): string[] {
  const have = new Set(resources.map((r) => `${r.resourceType}/${r.id}`));
  const missing = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (k === "reference" && typeof x === "string") {
          if (!have.has(x)) missing.add(x);
        } else walk(x);
      }
    }
  };
  resources.forEach(walk);
  return [...missing];
}

// A transaction Bundle: every entry is a PUT with its own id, so loading it twice updates rather than duplicates.
// Built from many small strings so a big register never needs one giant string in memory.
export function toBundleBlob(resources: FhirResource[]): Blob {
  const parts: string[] = [
    `{"resourceType":"Bundle","type":"transaction","timestamp":${JSON.stringify(new Date().toISOString())},"entry":[`,
  ];
  resources.forEach((r, i) => {
    const entry = {
      fullUrl: `urn:uuid:${r.id}`,
      resource: r,
      request: { method: "PUT", url: `${r.resourceType}/${r.id}` },
    };
    parts.push((i > 0 ? "," : "") + JSON.stringify(entry));
  });
  parts.push("]}");
  return new Blob(parts, { type: "application/fhir+json" });
}

// One resource per line: the format bulk loaders use
export const toNdjsonBlob = (resources: FhirResource[]) =>
  new Blob(
    resources.map((r) => JSON.stringify(r) + "\n"),
    { type: "application/fhir+ndjson" },
  );
