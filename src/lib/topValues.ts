// The villages used most in the last 300 registrations, spelled the way people most often wrote them
export function topVillages(
  patients: { village: string; villageKey: string; createdAt: number }[],
  n = 6,
): string[] {
  const groups = new Map<
    string,
    { count: number; spellings: Map<string, number> }
  >();
  const recent = [...patients]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 300);
  for (const p of recent) {
    if (!p.villageKey) continue;
    const g = groups.get(p.villageKey) ?? {
      count: 0,
      spellings: new Map<string, number>(),
    };
    g.count++;
    g.spellings.set(p.village, (g.spellings.get(p.village) ?? 0) + 1);
    groups.set(p.villageKey, g);
  }
  return [...groups.values()]
    .sort((a, b) => b.count - a.count) // ties keep the more recent village first, because the map was filled newest first
    .slice(0, n)
    .map((g) => [...g.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0]);
}

// The complaints heard most often here, as standard names. Common ones fill any empty places.
export function topComplaints(
  texts: string[],
  recognize: (text: string) => string[],
  fallback: string[],
  n = 6,
): string[] {
  const counts = new Map<string, number>();
  for (const text of texts.slice(0, 300))
    for (const term of recognize(text))
      counts.set(term, (counts.get(term) ?? 0) + 1);
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term);
  return [...new Set([...ranked, ...fallback])].slice(0, n);
}

// Add or remove one complaint from a comma-separated line, so several chips can be tapped in turn
export function toggleTerm(text: string, term: string): string {
  const parts = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const at = parts.findIndex((p) => p.toLowerCase() === term.toLowerCase());
  if (at >= 0) parts.splice(at, 1);
  else parts.push(term);
  return parts.join(", ");
}

export const hasTerm = (text: string, term: string) =>
  text.split(",").some((p) => p.trim().toLowerCase() === term.toLowerCase());
