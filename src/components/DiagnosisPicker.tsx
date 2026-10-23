import { useEffect, useMemo, useState } from "react";
import { Lock, Search, X } from "lucide-react";
import { frequentDiagnoses } from "../lib/diagnosisUsage";
import { isSensitiveCode, searchDiagnoses, type Icd10 } from "../lib/icd10";
import type { Diagnosis } from "../lib/visits";

export function DiagnosisPicker({
  value,
  onChange,
}: {
  value: Diagnosis;
  onChange: (d: Diagnosis) => void;
}) {
  const [open, setOpen] = useState(false);
  const [frequent, setFrequent] = useState<Icd10[]>([]);
  const typed = value.label.trim().length >= 2;
  const matches = useMemo(() => searchDiagnoses(value.label), [value.label]);
  const picked = !!value.code;

  // The first time the box is opened empty, offer what this facility records most
  useEffect(() => {
    if (!open || typed || picked) return;
    let alive = true;
    void frequentDiagnoses().then((list) => {
      if (alive) setFrequent(list);
    });
    return () => {
      alive = false;
    };
  }, [open, typed, picked]);

  const list = typed ? matches : frequent;

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtext"
        />
        <input
          className="input pl-10 pr-12"
          placeholder="Type to search, e.g. malaria or sugar"
          autoComplete="off"
          role="combobox"
          aria-expanded={open && list.length > 0}
          value={value.label}
          onChange={(e) => {
            onChange({ label: e.target.value });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        {value.label && (
          <button
            type="button"
            aria-label="Clear diagnosis"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-3 text-subtext"
            onClick={() => onChange({ label: "" })}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {open && !picked && list.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border-2 border-line bg-white shadow-lg"
        >
          {!typed && (
            <li className="px-3 pt-2 text-sm font-semibold text-subtext">
              Used most here
            </li>
          )}
          {list.map((d) => (
            <li key={d.code} role="option" aria-selected={false}>
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-prima-50"
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus in the box so the list does not vanish before the tap lands
                  onChange({ code: d.code, label: d.label });
                  setOpen(false);
                }}
              >
                <span>
                  {d.label}
                  <span className="block text-sm text-subtext">{d.group}</span>
                </span>
                <span className="shrink-0 font-mono text-sm font-semibold text-prima-500">
                  {d.code}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {picked ? (
        <div className="mt-1 space-y-1 text-sm text-subtext">
          <p>
            ICD-10 code <strong>{value.code}</strong> will be saved.
          </p>
          {isSensitiveCode(value.code) && (
            <p className="flex items-start gap-1">
              <Lock size={16} className="mt-0.5 shrink-0" />
              Sensitive diagnosis. It is left out of shared exports unless your
              admin includes it.
            </p>
          )}
        </div>
      ) : value.label.trim() ? (
        <p className="mt-1 text-sm text-subtext">
          No code selected. This will be saved as free text.
        </p>
      ) : null}
    </div>
  );
}
