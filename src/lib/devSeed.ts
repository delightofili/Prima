import { db, remoteTransaction } from "../db";
import { config } from "./config";
import { ICD10 } from "./icd10";
import {
  addDays,
  daysBetween,
  generateCardNumber,
  normalize,
  todayISO,
} from "./utils";
import { VACCINES, nextFor } from "./vaccines";
import type { ImmunizationRecord, Patient, Visit, Guardian } from "../types";
import { calculateAge } from "./age";

const FEMALE = [
  "Ngozi",
  "Chidinma",
  "Obiageli",
  "Adaeze",
  "Nkechi",
  "Chiamaka",
  "Amaka",
  "Folake",
  "Yetunde",
  "Bisi",
  "Aisha",
  "Fatima",
  "Zainab",
];
const MALE = [
  "Chinedu",
  "Ifeanyi",
  "Emeka",
  "Uchenna",
  "Ikenna",
  "Tunde",
  "Adebayo",
  "Oluwaseun",
  "Musa",
  "Ibrahim",
  "Abubakar",
];
const SURNAMES = [
  "Okafor",
  "Eze",
  "Nwosu",
  "Obi",
  "Okeke",
  "Adeyemi",
  "Balogun",
  "Bello",
  "Abdullahi",
  "Danjuma",
  "Chukwu",
  "Nwankwo",
];
const VILLAGES = [
  "Amansea",
  "Awba-Ofemili",
  "Ebenebe",
  "Achalla",
  "Isu-Aniocha",
  "Mgbakwu",
  "Nawfia",
  "Ugbenu",
  "Amanuke",
];

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const int = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const phone = () =>
  `+234${pick([7, 8, 9])}${pick([0, 1])}${String(int(0, 99999999)).padStart(8, "0")}`;
const oneDecimal = (n: number) => Math.round(n * 10) / 10;

export async function seedDemo(count: number) {
  const now = Date.now();
  const today = todayISO();
  const patients: Patient[] = [];
  const visits: Visit[] = [];
  const shots: ImmunizationRecord[] = [];

  for (let i = 0; i < count; i++) {
    const female = Math.random() < 0.58;
    const young = Math.random() < 0.25;
    const days = young ? int(20, 5 * 365 - 30) : int(5 * 365, 75 * 365);
    const dob = addDays(today, -days);
    const adult = days >= 13 * 365;
    const fullName = `${pick(female ? FEMALE : MALE)} ${pick(SURNAMES)}`;
    const village = pick(VILLAGES);
    const womanOver12 = female && adult;
    const pregnant = womanOver12 && days < 45 * 365 && Math.random() < 0.18;
    const gravida =
      womanOver12 && Math.random() < 0.6 ? int(pregnant ? 1 : 0, 6) : undefined;
    const createdAt = now - int(0, 45) * 86_400_000 - int(0, 86_399_999);

    const patient: Patient = {
      id: crypto.randomUUID(),
      facilityId: config.facilityId,
      cardNumber: generateCardNumber(config.facilityCode),
      fullName,
      name: normalize(fullName),
      dob,
      gender: female ? "FEMALE" : "MALE",
      phone: young ? undefined : phone(),
      village,
      villageKey: normalize(village),
      lga: config.facilityLga,
      state: config.facilityState,
      nextOfKinName: `${pick(female ? MALE : FEMALE)} ${fullName.split(" ")[1]}`,
      nextOfKinPhone: phone(),
      isPregnant: pregnant,
      gravida,
      para: gravida !== undefined ? int(0, gravida) : undefined,
      createdAt,
      updatedAt: createdAt,
    };
    patients.push(patient);

    const created = new Date(createdAt).toLocaleDateString("en-CA");
    const span = Math.max(0, daysBetween(created, today));
    for (let k = int(0, 3); k > 0; k--) {
      const visitDate = addDays(created, int(0, span));
      const dx = pick(ICD10);
      const systolic = int(100, 170);
      const dueDate = addDays(today, int(-6, 12));
      visits.push({
        id: crypto.randomUUID(),
        patientId: patient.id,
        facilityId: config.facilityId,
        visitDate,
        complaints: "Demo visit",
        systolic: adult ? systolic : undefined,
        diastolic: adult ? Math.min(systolic - 20, int(60, 105)) : undefined,
        temperature: oneDecimal(36 + Math.random() * 3.5),
        weightKg: adult ? int(45, 95) : oneDecimal(4 + Math.random() * 14),
        diagnosisCode: dx.code,
        diagnosisLabel: dx.label,
        nextDueDate:
          Math.random() < 0.4 && dueDate > visitDate ? dueDate : undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (young) {
      const given = VACCINES.filter((v) => v.quick)
        .sort(() => Math.random() - 0.5)
        .slice(0, int(2, 5));
      for (const v of given) {
        const dateGiven = addDays(dob, int(0, Math.min(days, 300)));
        shots.push({
          id: crypto.randomUUID(),
          patientId: patient.id,
          facilityId: config.facilityId,
          vaccineName: v.vaccineName,
          doseNumber: v.doseNumber,
          dateGiven,
          ...nextFor(v, dateGiven),
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  // remoteTransaction keeps demo data on this device: nothing is queued for Supabase.
  await remoteTransaction(
    [db.patients, db.visits, db.immunizations, db.syncQueue],
    async () => {
      await db.patients.bulkAdd(patients);
      await db.visits.bulkAdd(visits);
      await db.immunizations.bulkAdd(shots);
    },
  );
}

export async function seedDuplicates(count: number) {
  const all = (await db.patients.toArray()).filter((p) => !p.deletedAt);
  const picks = [...all].sort(() => Math.random() - 0.5).slice(0, count);
  const now = Date.now();
  const today = todayISO();
  const copies: Patient[] = [];
  const visits: Visit[] = [];

  picks.forEach((p, i) => {
    const [first, ...rest] = p.fullName.split(" ");
    const surname = rest.join(" ");
    const swapLetters = (s: string) =>
      s.length > 3 ? `${s.slice(0, 2)}${s[3]}${s[2]}${s.slice(4)}` : s;
    const fullName =
      i % 3 === 0
        ? `${surname} ${first}`
        : i % 3 === 1
          ? `${swapLetters(first)} ${surname}`
          : p.fullName;

    const copy: Patient = {
      ...p,
      id: crypto.randomUUID(),
      cardNumber: generateCardNumber(config.facilityCode),
      fullName,
      name: normalize(fullName),
      phone: i % 2 ? p.phone : undefined,
      nhisNumber: undefined,
      createdAt: now,
      updatedAt: now,
    };
    copies.push(copy);
    visits.push({
      id: crypto.randomUUID(),
      patientId: copy.id,
      facilityId: config.facilityId,
      visitDate: today,
      complaints: "Visit recorded on the second record",
      createdAt: now,
      updatedAt: now,
    });
  });

  await remoteTransaction([db.patients, db.visits, db.syncQueue], async () => {
    await db.patients.bulkAdd(copies);
    await db.visits.bulkAdd(visits);
  });
}

export async function seedFamilies() {
  const now = Date.now();
  const patients = (await db.patients.toArray()).filter((p) => !p.deletedAt);
  const years = (dob: string) => {
    const a = calculateAge(dob);
    return a.unit === "years" ? a.value : 0;
  };

  const kids = patients
    .filter(
      (p) =>
        !p.guardianId &&
        (calculateAge(p.dob).unit === "months" || years(p.dob) < 18),
    )
    .sort(() => Math.random() - 0.5);
  const mothers = patients
    .filter(
      (p) =>
        p.gender === "FEMALE" &&
        years(p.dob) >= 18 &&
        years(p.dob) <= 45 &&
        p.phone,
    )
    .sort(() => Math.random() - 0.5);

  const guardians: Guardian[] = [];
  const links: { kidId: string; guardianId: string }[] = [];
  let next = 0;

  for (let i = 0; i < kids.length; ) {
    const family = kids.slice(i, i + int(1, 3));
    i += family.length;

    const mother = Math.random() < 0.5 ? mothers[next++] : undefined;
    const surname = family[0].fullName.split(" ").slice(1).join(" ");
    const fullName = mother ? mother.fullName : `${pick(FEMALE)} ${surname}`;

    const guardian: Guardian = {
      id: crypto.randomUUID(),
      facilityId: config.facilityId,
      fullName,
      name: normalize(fullName),
      phone: mother?.phone ?? phone(),
      relationship: "MOTHER",
      patientId: mother?.id,
      createdAt: now,
      updatedAt: now,
    };
    guardians.push(guardian);
    for (const kid of family)
      links.push({ kidId: kid.id, guardianId: guardian.id });
  }

  // Local only: nothing is queued for Supabase
  await remoteTransaction(
    [db.guardians, db.patients, db.syncQueue],
    async () => {
      await db.guardians.bulkAdd(guardians);
      for (const l of links)
        await db.patients.update(l.kidId, { guardianId: l.guardianId });
    },
  );

  return { families: guardians.length, children: links.length };
}
