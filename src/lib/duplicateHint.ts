import { db } from "../db";
import type { Patient } from "../types";
import { shiftYears } from "./estimateDob";
import { findSimilar } from "./fuzzy";
import { findExactDuplicate } from "./patients";
import { normalize } from "./utils";

export type DuplicateHint =
  | { kind: "exact"; patient: Patient }
  | { kind: "similar"; matches: { patient: Patient; score: number }[] };

// The same duplicate check the full form makes. When the birth date is only an estimate, it also looks two years either
// side, but only among patients of the same sex from the same village, so it stays quiet about strangers.
export async function findDuplicateHint(input: {
  fullName: string;
  dob: string;
  village: string;
  gender: string;
  estimated: boolean;
}): Promise<DuplicateHint | null> {
  const exact = await findExactDuplicate(
    input.fullName,
    input.dob,
    input.village,
  );
  if (exact) return { kind: "exact", patient: exact };

  const villageKey = normalize(input.village);
  const candidates = input.estimated
    ? await db.patients
        .where("dob")
        .between(
          shiftYears(input.dob, -2),
          shiftYears(input.dob, 2),
          true,
          true,
        )
        .filter(
          (p) =>
            !p.deletedAt &&
            p.gender === input.gender &&
            p.villageKey === villageKey,
        )
        .toArray()
    : await db.patients
        .where("dob")
        .equals(input.dob)
        .filter((p) => !p.deletedAt)
        .toArray();

  const found = await findSimilar(
    normalize(input.fullName),
    candidates.map((p) => ({ id: p.id, name: p.name })),
  );
  const byId = new Map(candidates.map((p) => [p.id, p] as const));
  const matches = found.flatMap((m) => {
    const patient = byId.get(m.id);
    return patient ? [{ patient, score: m.score }] : [];
  });
  return matches.length > 0 ? { kind: "similar", matches } : null;
}
