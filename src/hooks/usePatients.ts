import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { normalize } from "../lib/utils";
import type { Patient } from "../types";

const EMPTY: Patient[] = [];

export function usePatients(search: string) {
  const patients = useLiveQuery(
    () => db.patients.orderBy("createdAt").reverse().toArray(),
    [],
  );
  const all = patients ?? EMPTY;

  const { patientMap, cardMap } = useMemo(
    () => ({
      patientMap: new Map(all.map((p) => [p.id, p] as const)),
      cardMap: new Map(all.map((p) => [p.cardNumber, p] as const)),
    }),
    [all],
  );

  const results = useMemo(() => {
    const raw = search.trim();
    if (!raw) return all;

    const exact = cardMap.get(raw.toUpperCase());
    if (exact) return [exact];

    const term = normalize(raw);
    const digits = raw.replace(/\D/g, "");
    return all.filter(
      (p) =>
        p.name.includes(term) ||
        p.cardNumber.toLowerCase().includes(term) ||
        (p.nhisNumber?.toLowerCase().includes(term) ?? false) ||
        (digits.length >= 3 && (p.phone?.includes(digits) ?? false)),
    );
  }, [all, cardMap, search]);

  return {
    results,
    total: all.length,
    patientMap,
    cardMap,
    loading: patients === undefined,
  };
}
