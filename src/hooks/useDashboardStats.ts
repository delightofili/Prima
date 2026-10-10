import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { computeStats } from "../lib/stats";
import { timed } from "../lib/timing";
import { usePatients } from "./usePatients";

export function useDashboardStats(month: string) {
  const { results: patients, patientMap, loading } = usePatients("");
  const visits = useLiveQuery(() => db.visits.toArray(), []);

  return useMemo(() => {
    if (loading || !visits) return null;
    const { value, ms } = timed(() =>
      computeStats(patients, visits, patientMap, month),
    );
    return { stats: value, ms };
  }, [patients, patientMap, visits, month, loading]);
}
