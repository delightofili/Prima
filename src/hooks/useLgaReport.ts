import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { computeLgaReport } from "../lib/lgaReport";
import { usePatients } from "./usePatients";

export function useLgaReport(month: string) {
  const { results: patients, patientMap, loading } = usePatients("");
  const visits = useLiveQuery(() => db.visits.toArray(), []);
  const shots = useLiveQuery(() => db.immunizations.toArray(), []);

  return useMemo(
    () =>
      loading || !visits || !shots
        ? null
        : computeLgaReport(patients, visits, shots, patientMap, month),
    [patients, patientMap, visits, shots, month, loading],
  );
}
