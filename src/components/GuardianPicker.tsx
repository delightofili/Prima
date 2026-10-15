import { useMemo, useState, type KeyboardEvent } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { useGuardians } from "../hooks/useGuardians";
import { usePatients } from "../hooks/usePatients";
import {
  RELATIONSHIPS,
  relationshipLabel,
  searchGuardians,
  type GuardianChoice,
} from "../lib/guardians";
import { formatPhone, normalize } from "../lib/utils";
import type { Relationship } from "../types";
import { GuardianCard } from "./GuardianCard";

// Pressing Enter inside these boxes must not submit the whole patient form.
const noEnter = (e: KeyboardEvent) => {
  if (e.key === "Enter") e.preventDefault();
};

type NewChoice = Extract<GuardianChoice, { kind: "new" }>;
type NextOfKin = { name: string; phone: string };

function NewGuardianForm({
  value,
  onChange,
  nextOfKin,
  onBack,
}: {
  value: NewChoice;
  onChange: (v: GuardianChoice) => void;
  nextOfKin: NextOfKin;
  onBack: () => void;
}) {
  const { results: patients, patientMap } = usePatients("");
  const [find, setFind] = useState("");
  const linked = value.patientId ? patientMap.get(value.patientId) : undefined;

  const candidates = useMemo(() => {
    const raw = find.trim();
    if (raw.length < 2) return [];
    const term = normalize(raw);
    const digits = raw.replace(/\D/g, "");
    const local = digits.startsWith("234")
      ? digits.slice(3)
      : digits.replace(/^0/, "");
    return patients
      .filter(
        (p) =>
          p.name.includes(term) ||
          p.cardNumber.toLowerCase().includes(term) ||
          (local.length >= 3 && (p.phone?.slice(4).includes(local) ?? false)),
      )
      .slice(0, 5);
  }, [patients, find]);

  return (
    <div className="space-y-3 rounded-2xl border-2 border-line bg-page p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">New guardian</p>
        <button
          type="button"
          className="min-h-11 px-2 font-semibold text-prima-500"
          onClick={onBack}
        >
          Back to search
        </button>
      </div>

      <label className="block space-y-1">
        <span className="text-base font-semibold">Full name</span>
        <input
          className="input"
          value={value.fullName}
          onKeyDown={noEnter}
          onChange={(e) => onChange({ ...value, fullName: e.target.value })}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-base font-semibold">
          Relationship to the patient
        </span>
        <select
          className="input"
          value={value.relationship}
          onChange={(e) =>
            onChange({ ...value, relationship: e.target.value as Relationship })
          }
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-base font-semibold">Phone (optional)</span>
        <input
          type="tel"
          inputMode="numeric"
          className="input"
          placeholder="08031234567"
          value={value.phone}
          onKeyDown={noEnter}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
        />
      </label>

      {nextOfKin.name.trim() && (
        <button
          type="button"
          className="min-h-11 text-left font-semibold text-prima-500 underline"
          onClick={() =>
            onChange({
              ...value,
              fullName: nextOfKin.name,
              phone: nextOfKin.phone,
            })
          }
        >
          Use next of kin: {nextOfKin.name}
        </button>
      )}

      <div className="space-y-2">
        <p className="text-base font-semibold">
          Is this person also a patient here? (optional)
        </p>
        {linked ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-prima-50 p-3">
            <span className="font-medium">
              {linked.fullName} · {linked.cardNumber}
            </span>
            <button
              type="button"
              aria-label="Remove link"
              className="p-2"
              onClick={() => onChange({ ...value, patientId: undefined })}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtext"
              />
              <input
                className="input pl-10"
                placeholder="Search name, phone or card number"
                value={find}
                onKeyDown={noEnter}
                onChange={(e) => setFind(e.target.value)}
              />
            </div>
            {candidates.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border-2 border-line bg-white px-3 text-left"
                onClick={() => {
                  onChange({ ...value, patientId: p.id });
                  setFind("");
                }}
              >
                <span className="font-medium">{p.fullName}</span>
                <span className="text-sm font-semibold text-prima-500">
                  {p.cardNumber}
                </span>
              </button>
            ))}
          </>
        )}
        {value.relationship === "MOTHER" && (
          <p className="text-sm text-subtext">
            Linking the mother's record shows her antenatal visits on the baby's
            profile.
          </p>
        )}
      </div>
    </div>
  );
}

export function GuardianPicker({
  value,
  onChange,
  nextOfKin,
}: {
  value: GuardianChoice;
  onChange: (v: GuardianChoice) => void;
  nextOfKin: NextOfKin;
}) {
  const { guardians, guardianMap, childrenOf } = useGuardians();
  const [query, setQuery] = useState("");
  const matches = useMemo(
    () => searchGuardians(guardians, query),
    [guardians, query],
  );

  if (value.kind === "existing") {
    const g = guardianMap.get(value.id);
    if (!g) {
      return (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onChange({ kind: "none" })}
        >
          Guardian not found. Choose again
        </button>
      );
    }
    return (
      <GuardianCard
        guardian={g}
        kids={childrenOf.get(g.id) ?? []}
        linkKids={false}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onChange({ kind: "none" })}
          >
            Choose a different guardian
          </button>
        }
      />
    );
  }

  if (value.kind === "new") {
    return (
      <NewGuardianForm
        value={value}
        onChange={onChange}
        nextOfKin={nextOfKin}
        onBack={() => onChange({ kind: "none" })}
      />
    );
  }

  const looksLikePhone = query.replace(/\D/g, "").length >= 6;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtext"
        />
        <input
          className="input pl-10"
          placeholder="Search guardian by phone or name"
          value={query}
          onKeyDown={noEnter}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {matches.map((g) => {
        const count = childrenOf.get(g.id)?.length ?? 0;
        return (
          <button
            key={g.id}
            type="button"
            className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 border-line bg-white px-3 py-2 text-left hover:border-prima-500"
            onClick={() => onChange({ kind: "existing", id: g.id })}
          >
            <span>
              <span className="block font-semibold">{g.fullName}</span>
              <span className="block text-sm text-subtext">
                {relationshipLabel(g.relationship)}
                {g.phone ? ` · ${formatPhone(g.phone)}` : ""}
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-prima-500">
              {count} {count === 1 ? "child" : "children"}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() =>
          onChange({
            kind: "new",
            fullName: "",
            phone: looksLikePhone ? query : "",
            relationship: "MOTHER",
          })
        }
      >
        <UserPlus size={20} className="mr-2" /> Add a new guardian
      </button>
    </div>
  );
}
