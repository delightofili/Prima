import { config } from "./config";
import { localSimilar, type SimilarMatch } from "./similar";

export type { SimilarMatch };

const THRESHOLD = 85;

// Names that look like someone already registered. The phone works this out itself, so the warning appears with no internet
// and on every plan. When there is a connection, the matching service is asked as well, and anything either one finds is shown.
export async function findSimilar(
  name: string,
  candidates: { id: string; name: string }[],
): Promise<SimilarMatch[]> {
  if (candidates.length === 0) return [];
  const here = localSimilar(name, candidates, THRESHOLD);
  if (!navigator.onLine) return here;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${config.pythonApiUrl}/api/fuzzy-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, candidates, threshold: THRESHOLD }),
      signal: controller.signal,
    });
    if (!res.ok) return here;
    const data = (await res.json()) as { matches?: unknown };
    if (!Array.isArray(data.matches)) return here;
    const known = new Set(candidates.map((c) => c.id));
    const best = new Map<string, SimilarMatch>(here.map((m) => [m.id, m]));
    for (const m of data.matches as Partial<SimilarMatch>[]) {
      // only people the phone really has, with a real score: whatever else the service says is ignored
      if (
        typeof m?.id !== "string" ||
        !known.has(m.id) ||
        typeof m.score !== "number" ||
        !Number.isFinite(m.score)
      )
        continue;
      const mine = best.get(m.id);
      if (!mine || m.score > mine.score)
        best.set(m.id, {
          id: m.id,
          name: candidates.find((c) => c.id === m.id)?.name ?? "",
          score: m.score,
        });
    }
    return [...best.values()].sort((a, b) => b.score - a.score).slice(0, 10);
  } catch {
    return here; // offline, slow, or the service asleep or not a service at all: the phone's own answer stands
  } finally {
    clearTimeout(timer);
  }
}
