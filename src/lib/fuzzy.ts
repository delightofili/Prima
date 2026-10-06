import { config } from "./config";

export interface SimilarMatch {
  id: string;
  name: string;
  score: number;
}

export async function findSimilar(
  name: string,
  candidates: { id: string; name: string }[],
): Promise<SimilarMatch[]> {
  if (!navigator.onLine || candidates.length === 0) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${config.pythonApiUrl}/api/fuzzy-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, candidates, threshold: 85 }),
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.matches as SimilarMatch[];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
