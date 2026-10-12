import { useEffect, useMemo, useState } from "react";
import {
  findDuplicates,
  loadDismissed,
  type DuplicateMatch,
} from "../lib/duplicates";
import type { Patient } from "../types";
import { usePatients } from "./usePatients";

export function useDuplicateScan() {
  const { results: patients, loading } = usePatients("");
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{
    source: Patient[];
    version: number;
    matches: DuplicateMatch[];
  } | null>(null);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      const dismissed = await loadDismissed();
      const matches = await findDuplicates(patients, dismissed);
      if (!cancelled) setResult({ source: patients, version, matches });
    })();
    return () => {
      cancelled = true;
    };
  }, [patients, loading, version]);

  const ids = useMemo(() => new Set(patients.map((p) => p.id)), [patients]);
  const matches = useMemo(
    () =>
      result
        ? result.matches.filter((m) => ids.has(m.a.id) && ids.has(m.b.id))
        : null,
    [result, ids],
  );
  const scanning =
    loading ||
    !result ||
    result.source !== patients ||
    result.version !== version;

  return {
    matches,
    scanning,
    total: patients.length,
    rescan: () => setVersion((v) => v + 1),
  };
}
