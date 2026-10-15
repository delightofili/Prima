import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useDebounce } from "../hooks/common";
import { useGuardians } from "../hooks/useGuardians";
import { usePatients } from "../hooks/usePatients";
import { searchGuardians } from "../lib/guardians";
import { GuardianCard } from "./GuardianCard";
import { PatientCard } from "./PatientCard";

export function PatientList() {
  const [search, setSearch] = useState("");
  const query = useDebounce(search, 200);
  const { results, total } = usePatients(query);
  const { guardians, childrenOf } = useGuardians();
  const guardianMatches = useMemo(
    () => searchGuardians(guardians, query),
    [guardians, query],
  );
  const shown = results.slice(0, 100);

  return (
    <section className="space-y-3">
      <input
        type="search"
        inputMode="search"
        className="input"
        placeholder="Search name, phone, NHIS or card number"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {total === 0 ? (
        <div className="card text-center">
          <p className="text-lg font-semibold">No patients yet</p>
          <p className="text-subtext">
            Register the first patient and they will appear here.
          </p>
        </div>
      ) : results.length === 0 && guardianMatches.length === 0 ? (
        <p className="py-8 text-center text-subtext">
          No patient or guardian matches “{search}”.
        </p>
      ) : (
        <>
          {guardianMatches.length > 0 && (
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Users size={20} className="text-prima-500" /> Guardians
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {guardianMatches.map((g) => (
                  <GuardianCard
                    key={g.id}
                    guardian={g}
                    kids={childrenOf.get(g.id) ?? []}
                  />
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <>
              <p className="text-sm text-subtext">
                {results.length} of {total} patients
              </p>
              <ul className="grid gap-3 md:grid-cols-2">
                {shown.map((p) => (
                  <li key={p.id}>
                    <PatientCard p={p} />
                  </li>
                ))}
              </ul>
              {results.length > shown.length && (
                <p className="text-center text-sm text-subtext">
                  Showing the first 100. Search to narrow down.
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
