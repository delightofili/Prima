import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import type { Guardian, Patient } from "../types";
import { usePatients } from "./usePatients";

const EMPTY: Guardian[] = [];

export function useGuardians() {
  const raw = useLiveQuery(() => db.guardians.toArray(), []);
  const { results: patients } = usePatients("");

  const guardians = useMemo(
    () => (raw ?? EMPTY).filter((g) => !g.deletedAt),
    [raw],
  );
  const guardianMap = useMemo(
    () => new Map(guardians.map((g) => [g.id, g] as const)),
    [guardians],
  );

  const childrenOf = useMemo(() => {
    const map = new Map<string, Patient[]>();
    for (const p of patients) {
      if (!p.guardianId) continue;
      const list = map.get(p.guardianId);
      if (list) list.push(p);
      else map.set(p.guardianId, [p]);
    }
    return map;
  }, [patients]);

  return { guardians, guardianMap, childrenOf, loading: raw === undefined };
}
