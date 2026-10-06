import { useState } from "react";
import { usePatients } from "../hooks/usePatients";
import { useDebounce } from "../hooks/common";
import { calculateAge, isUnder5 } from "../lib/age";

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
          <ul className="space-y-3">
            {shown.map((p) => {
              const age = calculateAge(p.dob);
              return (
                <li key={p.id} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-semibold">{p.fullName}</p>
                    <span className="text-sm font-semibold text-prima-500">
                      {p.cardNumber}
                    </span>
                  </div>
                  <p className="text-subtext">
                    {age.label} · {p.gender === "FEMALE" ? "Female" : "Male"} ·{" "}
                    {p.village}
                  </p>
                  {p.phone && <p>{p.phone}</p>}
                  <div className="mt-2 flex gap-2">
                    {p.isPregnant && (
                      <span className="rounded-full bg-pregnant px-3 py-1 text-sm font-semibold text-white">
                        Pregnant
                      </span>
                    )}
                    {isUnder5(age) && (
                      <span className="rounded-full bg-accent-500 px-3 py-1 text-sm font-semibold text-black">
                        Under 5
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
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
