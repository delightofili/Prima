import { config } from "./config";
import { nameSimilarity } from "./duplicates";
import { supabase } from "./supabase";
import { isPowerSaving } from "./power";

export interface SimilarMatch {
  id: string;
  name: string;
  score: number;
}

const THRESHOLD = 85;

function findSimilarLocal(
  name: string,
  candidates: { id: string; name: string }[],
): SimilarMatch[] {
  return candidates
    .map((c) => ({
      ...c,
      score: Math.round(nameSimilarity(name, c.name) * 10) / 10,
    }))
    .filter((m) => m.score >= THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

async function findSimilarRemote(
  name: string,
  candidates: { id: string; name: string }[],
): Promise<SimilarMatch[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`${config.pythonApiUrl}/api/fuzzy-check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name, candidates, threshold: THRESHOLD }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.matches as SimilarMatch[];
  } catch {
    return null; // not hosted, asleep, offline or slow: the caller falls back
  } finally {
    clearTimeout(timer);
  }
}

export async function findSimilar(
  name: string,
  candidates: { id: string; name: string }[],
): Promise<SimilarMatch[]> {
  if (candidates.length === 0) return [];
  if (config.pythonApiUrl && navigator.onLine && !isPowerSaving()) {
    const remote = await findSimilarRemote(name, candidates);
    if (remote) return remote;
  }
  return findSimilarLocal(name, candidates);
}
