// "Is this new patient probably someone already registered?" worked out on the phone itself, so it works with no internet.
// It scores two names exactly as the Python service does (RapidFuzz): the better of fuzz.ratio and fuzz.token_sort_ratio, 0 to 100.

export interface SimilarMatch {
  id: string;
  name: string;
  score: number;
}

// The same cleaning the service does: lower case, and any run of spaces becomes one space
const clean = (text: string) =>
  text.toLowerCase().split(/\s+/).filter(Boolean).join(" ");

// Length of the longest run of letters the two names share, in order (not necessarily side by side)
function commonLength(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  let previous = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const row = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      row[j] =
        a[i - 1] === b[j - 1]
          ? previous[j - 1] + 1
          : Math.max(previous[j], row[j - 1]);
    }
    previous = row;
  }
  return previous[b.length];
}

// 100 when identical, 0 when nothing is shared: 2 x (shared letters) / (letters in both names)
function ratio(a: string, b: string): number {
  const total = a.length + b.length;
  return total === 0 ? 100 : (200 * commonLength(a, b)) / total;
}

const sorted = (text: string) => text.split(" ").sort().join(" ");

export function score(a: string, b: string): number {
  const x = clean(a);
  const y = clean(b);
  return Math.max(ratio(x, y), ratio(sorted(x), sorted(y)));
}

export function localSimilar(
  name: string,
  candidates: { id: string; name: string }[],
  threshold = 85,
): SimilarMatch[] {
  if (clean(name).length < 2) return [];
  return candidates
    .map((c) => ({
      id: c.id,
      name: c.name,
      score: Math.round(score(name, c.name) * 10) / 10,
    }))
    .filter((m) => m.score >= threshold)
    .sort((p, q) => q.score - p.score)
    .slice(0, 10);
}
