import { ICD10_DATA, type Icd10 } from "./icd10Data";
import { normalize } from "./utils";

export type { Icd10 };
export const ICD10 = ICD10_DATA;

const BY_CODE = new Map(ICD10.map((d) => [d.code, d] as const));
export const findCode = (code: string) => BY_CODE.get(code);
export const labelForCode = (code: string) => BY_CODE.get(code)?.label;

// HIV, sexually transmitted infections, mental health and pregnancy loss.
// Exports leave these out unless the admin chooses to include them.
const SENSITIVE = /^(B2[0-4]|Z21|A5\d|A6[0-4]|F\d\d|O0[0-8])/;
export const isSensitiveCode = (code?: string) =>
  !!code && SENSITIVE.test(code.toUpperCase());

interface Row {
  d: Icd10;
  order: number; // position in the data file: the common conditions come first, so they win ties
  code: string; // "b50.9"
  bare: string; // "b509": nurses often type codes without the dot
  label: string;
  words: string[];
  text: string;
}

const words = (s: string) => s.split(/[^a-z0-9]+/).filter(Boolean);

const INDEX: Row[] = ICD10.map((d, order) => {
  const code = d.code.toLowerCase();
  const own = normalize(`${d.label} ${d.aka ?? ""}`);
  // The group name ("Malaria and parasites") only counts as a last resort, never as a real match
  const text = normalize(`${d.label} ${d.aka ?? ""} ${d.group}`);
  return {
    d,
    order,
    code,
    bare: code.replace(".", ""),
    label: normalize(d.label),
    words: words(own),
    text,
  };
});

// Lower is better. null means "not a match".
function score(
  row: Row,
  q: string,
  bare: string,
  tokens: string[],
): number | null {
  if (row.code === q || row.bare === bare) return 0;
  if (
    /\d/.test(bare) &&
    bare.length >= 2 &&
    (row.code.startsWith(q) || row.bare.startsWith(bare))
  )
    return 1;
  if (row.label.startsWith(q)) return 2;
  if (tokens.every((t) => row.words.includes(t))) return 3; // every typed word is a whole word ("bp")
  if (tokens.every((t) => row.words.some((w) => w.startsWith(t)))) return 4; // or the start of one ("mala")
  if (tokens.every((t) => row.text.includes(t))) return 5;
  return null;
}

export function searchDiagnoses(query: string, limit = 8): Icd10[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const bare = q.replace(/[.\s]/g, "");
  const tokens = words(q);
  const hits: { row: Row; s: number }[] = [];
  for (const row of INDEX) {
    const s = score(row, q, bare, tokens);
    if (s !== null) hits.push({ row, s });
  }
  hits.sort((a, b) => a.s - b.s || a.row.order - b.row.order);
  return hits.slice(0, limit).map((h) => h.row.d);
}
