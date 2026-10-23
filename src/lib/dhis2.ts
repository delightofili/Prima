import { AGE_GROUPS } from "./stats";
import { SERVICE_LINES } from "./serviceCodes";
import { VACCINES } from "./vaccines";
import type { LgaReport } from "./lgaReport";

export interface Indicator {
  key: string;
  label: string;
  group: string;
}
export interface Mapping {
  dataElement: string;
  categoryOptionCombo?: string;
}
export interface Dhis2Config {
  orgUnit: string; // the UID of this facility in the DHIS2 instance
  dataSet?: string;
  items: Record<string, Mapping>;
}
export interface DataValueSet {
  dataSet?: string;
  period: string;
  orgUnit: string;
  dataValues: {
    dataElement: string;
    categoryOptionCombo?: string;
    value: string;
  }[];
}

// A DHIS2 identifier: 11 characters, starting with a letter
const UID = /^[A-Za-z][A-Za-z0-9]{10}$/;
export const isUid = (s: string) => UID.test(s);

export function indicatorList(): Indicator[] {
  const list: Indicator[] = [
    {
      key: "newRegistrations",
      label: "New registrations",
      group: "Attendance",
    },
    { key: "patientsSeen", label: "Patients seen", group: "Attendance" },
    { key: "totalVisits", label: "Total visits", group: "Attendance" },
  ];
  for (const g of AGE_GROUPS) {
    for (const sex of ["male", "female"] as const) {
      list.push({
        key: `age:${g}:${sex}`,
        label: `Visits, ${g}, ${sex}`,
        group: "Visits by age and sex",
      });
    }
  }
  for (const l of SERVICE_LINES)
    list.push({
      key: `service:${l.key}`,
      label: l.label,
      group: "Maternal and child",
    });
  for (const v of VACCINES)
    list.push({
      key: `vaccine:${v.key}`,
      label: `${v.label} doses`,
      group: "Immunization",
    });
  return list;
}

export function valuesFromReport(r: LgaReport): Map<string, number> {
  const m = new Map<string, number>([
    ["newRegistrations", r.newRegistrations],
    ["patientsSeen", r.patientsSeen],
    ["totalVisits", r.totalVisits],
  ]);
  for (const a of r.ageSex) {
    m.set(`age:${a.label}:male`, a.male);
    m.set(`age:${a.label}:female`, a.female);
  }
  SERVICE_LINES.forEach((l, i) =>
    m.set(`service:${l.key}`, r.maternalChild[i]?.value ?? 0),
  );
  // The report lists only vaccines that were given; a mapped vaccine with no doses is a real zero
  const given = new Map(r.vaccines.map((v) => [v.label, v.doses] as const));
  for (const v of VACCINES) m.set(`vaccine:${v.key}`, given.get(v.label) ?? 0);
  return m;
}

export function validateConfig(cfg: Dhis2Config): string[] {
  const problems: string[] = [];
  if (!isUid(cfg.orgUnit))
    problems.push(
      "The facility (organisation unit) code must be 11 letters and numbers, starting with a letter.",
    );
  if (cfg.dataSet && !isUid(cfg.dataSet))
    problems.push(
      "The data set code must be 11 letters and numbers, starting with a letter.",
    );
  const labels = new Map(indicatorList().map((i) => [i.key, i.label] as const));
  for (const [key, m] of Object.entries(cfg.items)) {
    if (m.dataElement && !isUid(m.dataElement))
      problems.push(
        `${labels.get(key) ?? key}: the data element code is not valid.`,
      );
    if (m.categoryOptionCombo && !isUid(m.categoryOptionCombo))
      problems.push(
        `${labels.get(key) ?? key}: the category option combo code is not valid.`,
      );
  }
  return problems;
}

export function buildDataValueSet(
  report: LgaReport,
  cfg: Dhis2Config,
): { set: DataValueSet; skipped: Indicator[] } {
  const values = valuesFromReport(report);
  const dataValues: DataValueSet["dataValues"] = [];
  const skipped: Indicator[] = [];
  for (const ind of indicatorList()) {
    const m = cfg.items[ind.key];
    if (!m || !isUid(m.dataElement)) {
      skipped.push(ind);
      continue;
    }
    dataValues.push({
      dataElement: m.dataElement,
      ...(m.categoryOptionCombo && isUid(m.categoryOptionCombo)
        ? { categoryOptionCombo: m.categoryOptionCombo }
        : {}),
      value: String(values.get(ind.key) ?? 0),
    });
  }
  return {
    set: {
      ...(cfg.dataSet ? { dataSet: cfg.dataSet } : {}),
      period: report.month.replace("-", ""), // 2026-10 becomes 202610, DHIS2's monthly period
      orgUnit: cfg.orgUnit,
      dataValues,
    },
    skipped,
  };
}

/* ---------- the mapping file a district officer can fill in once ---------- */

export function templateJson(): string {
  const items: Record<
    string,
    { label: string; dataElement: string; categoryOptionCombo: string }
  > = {};
  for (const i of indicatorList())
    items[i.key] = {
      label: `${i.group}: ${i.label}`,
      dataElement: "",
      categoryOptionCombo: "",
    };
  return JSON.stringify({ orgUnit: "", dataSet: "", items }, null, 2);
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function parseMapping(text: string): Dhis2Config {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This is not a JSON file.");
  }
  if (!isObj(raw)) throw new Error("The mapping file must be a JSON object.");
  const known = new Set(indicatorList().map((i) => i.key));
  const items: Record<string, Mapping> = {};
  if (isObj(raw.items)) {
    for (const [key, v] of Object.entries(raw.items)) {
      if (!known.has(key) || !isObj(v)) continue;
      const dataElement =
        typeof v.dataElement === "string" ? v.dataElement.trim() : "";
      const combo =
        typeof v.categoryOptionCombo === "string"
          ? v.categoryOptionCombo.trim()
          : "";
      if (dataElement)
        items[key] = combo
          ? { dataElement, categoryOptionCombo: combo }
          : { dataElement };
    }
  }
  const dataSet = typeof raw.dataSet === "string" ? raw.dataSet.trim() : "";
  return {
    orgUnit: typeof raw.orgUnit === "string" ? raw.orgUnit.trim() : "",
    ...(dataSet ? { dataSet } : {}),
    items,
  };
}
