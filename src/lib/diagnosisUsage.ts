import { db } from "../db";
import { findCode, type Icd10 } from "./icd10";

let cache: { at: number; list: Icd10[] } | null = null;

// The diagnoses this facility records most, so the nurse's own common ones come first.
// Samples up to 2,000 visits: precise enough for a shortlist and quick on a low-end phone.
export async function frequentDiagnoses(limit = 6): Promise<Icd10[]> {
  if (cache && Date.now() - cache.at < 300_000)
    return cache.list.slice(0, limit);

  const visits = await db.visits
    .filter((v) => !v.deletedAt && !!v.diagnosisCode)
    .limit(2000)
    .toArray();
  const counts = new Map<string, number>();
  for (const v of visits)
    counts.set(v.diagnosisCode!, (counts.get(v.diagnosisCode!) ?? 0) + 1);

  const list = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => findCode(code))
    .filter((d): d is Icd10 => !!d); // codes typed long ago that are no longer in the list are skipped

  cache = { at: Date.now(), list };
  return list.slice(0, limit);
}
