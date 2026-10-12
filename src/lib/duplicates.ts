import { db } from "../db";
import type { Patient } from "../types";

export interface DuplicateMatch {
  key: string;
  a: Patient;
  b: Patient;
  score: number;
  level: "high" | "possible";
  reasons: string[];
}

const DISMISS_KEY = "dismissed-duplicates";
const MIN_NAME = 75;
const MIN_SCORE = 70;
const HIGH_SCORE = 80;

export const pairKey = (x: string, y: string) =>
  x < y ? `${x}|${y}` : `${y}|${x}`;

export async function loadDismissed(): Promise<Set<string>> {
  const row = await db.meta.get(DISMISS_KEY);
  try {
    return new Set<string>(row ? (JSON.parse(row.value) as string[]) : []);
  } catch {
    return new Set();
  }
}

async function saveDismissed(set: Set<string>) {
  await db.meta.put({ key: DISMISS_KEY, value: JSON.stringify([...set]) });
}

export async function dismissPair(a: string, b: string) {
  const set = await loadDismissed();
  set.add(pairKey(a, b));
  await saveDismissed(set);
}

export async function restorePair(a: string, b: string) {
  const set = await loadDismissed();
  set.delete(pairKey(a, b));
  await saveDismissed(set);
}

/* ---------- Name similarity ---------- */

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;

  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}

const ratio = (a: string, b: string) =>
  100 * (1 - levenshtein(a, b) / Math.max(a.length, b.length));
const sortedWords = (s: string) => s.split(" ").sort().join(" ");

export const nameSimilarity = (a: string, b: string) =>
  Math.max(ratio(a, b), ratio(sortedWords(a), sortedWords(b)));

/* ---------- Comparing two patients ---------- */

function compare(a: Patient, b: Patient): Omit<DuplicateMatch, "key"> | null {
  // Hard rules: these two are different people.
  if (a.gender !== b.gender) return null;
  if (a.bloodGroup && b.bloodGroup && a.bloodGroup !== b.bloodGroup)
    return null;
  if (a.nhisNumber && b.nhisNumber && a.nhisNumber !== b.nhisNumber)
    return null;

  const sameNhis = !!a.nhisNumber && a.nhisNumber === b.nhisNumber;
  const samePhone = !!a.phone && a.phone === b.phone;
  const sameDob = a.dob === b.dob;
  const sameYear = a.dob.slice(0, 4) === b.dob.slice(0, 4);
  const sameVillage = a.villageKey === b.villageKey;
  const name = nameSimilarity(a.name, b.name);

  const score = Math.min(
    100,
    name * 0.5 +
      (sameDob ? 25 : sameYear ? 8 : 0) +
      (samePhone ? 12 : 0) +
      (sameVillage ? 5 : 0) +
      (sameNhis ? 40 : 0),
  );

  if (!sameNhis && (name < MIN_NAME || score < MIN_SCORE)) return null;

  const reasons: string[] = [];
  if (sameNhis) reasons.push("Same NHIS number");
  if (name >= 100) reasons.push("Same name");
  else if (name >= MIN_NAME)
    reasons.push(`Similar name (${Math.round(name)}%)`);
  if (sameDob) reasons.push("Same date of birth");
  else if (sameYear) reasons.push("Born the same year");
  if (samePhone) reasons.push("Same phone number");
  if (sameVillage) reasons.push("Same village");

  return {
    a,
    b,
    score: Math.round(score),
    level: sameNhis || score >= HIGH_SCORE ? "high" : "possible",
    reasons,
  };
}

/* ---------- Scanning the register ---------- */

const prefixes = (name: string) =>
  new Set(name.split(" ").map((t) => t.slice(0, 2)));

export async function findDuplicates(
  patients: Patient[],
  dismissed: Set<string>,
): Promise<DuplicateMatch[]> {
  const starts = new Map(
    patients.map((p) => [p.id, prefixes(p.name)] as const),
  );
  const blocks = new Map<string, Patient[]>();
  const byNhis = new Map<string, Patient[]>();

  for (const p of patients) {
    const k = `${p.gender}|${p.dob.slice(0, 4)}`;
    const block = blocks.get(k);
    if (block) block.push(p);
    else blocks.set(k, [p]);

    if (p.nhisNumber) {
      const group = byNhis.get(p.nhisNumber);
      if (group) group.push(p);
      else byNhis.set(p.nhisNumber, [p]);
    }
  }

  const seen = new Set<string>();
  const out: DuplicateMatch[] = [];

  const consider = (a: Patient, b: Patient) => {
    const key = pairKey(a.id, b.id);
    if (seen.has(key) || dismissed.has(key)) return;
    seen.add(key);
    const m = compare(a, b);
    if (m) out.push({ key, ...m });
  };

  // Same NHIS number: compare across groups, whatever the birth year says
  for (const group of byNhis.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) consider(group[i], group[j]);
    }
  }

  // Everyone else: only compare people in the same pile
  for (const block of blocks.values()) {
    for (let i = 0; i < block.length; i++) {
      for (let j = i + 1; j < block.length; j++) {
        const a = block[i];
        const b = block[j];
        if (Math.abs(a.name.length - b.name.length) > 8) continue;

        const pa = starts.get(a.id)!;
        const pb = starts.get(b.id)!;
        let shareStart = false;
        for (const s of pa) {
          if (pb.has(s)) {
            shareStart = true;
            break;
          }
        }
        if (!shareStart) continue;

        consider(a, b);
      }
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0)); // let the screen breathe
  }

  return out.sort((x, y) =>
    x.level === y.level ? y.score - x.score : x.level === "high" ? -1 : 1,
  );
}
