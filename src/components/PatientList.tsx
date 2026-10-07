import { useState } from "react";
import { usePatients } from "../hooks/usePatients";
import { useDebounce } from "../hooks/common";
import { PatientCard } from "./PatientCard";

export function PatientList() {
  const [search, setSearch] = useState("");
  const query = useDebounce(search, 200);
  const { results, total } = usePatients(query);
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
      ) : results.length === 0 ? (
        <p className="py-8 text-center text-subtext">
          No patient matches “{search}”.
        </p>
      ) : (
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
    </section>
  );
}
