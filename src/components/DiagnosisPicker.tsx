import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { searchDiagnoses } from "../lib/icd10";
import type { Diagnosis } from "../lib/visits";

export function DiagnosisPicker({
  value,
  onChange,
}: {
  value: Diagnosis;
  onChange: (d: Diagnosis) => void;
}) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => searchDiagnoses(value.label), [value.label]);
  const picked = !!value.code;

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
          aria-expanded={open && matches.length > 0}
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

      {open && !picked && matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border-2 border-line bg-white shadow-lg"
        >
          {matches.map((d) => (
            <li key={d.code} role="option" aria-selected={false}>
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-prima-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange({ code: d.code, label: d.label });
                  setOpen(false);
                }}
              >
                <span>{d.label}</span>
                <span className="font-mono text-sm font-semibold text-prima-500">
                  {d.code}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {picked ? (
        <p className="mt-1 text-sm text-subtext">
          ICD-10 code <strong>{value.code}</strong> will be saved.
        </p>
      ) : value.label.trim() ? (
        <p className="mt-1 text-sm text-subtext">
          No code selected. This will be saved as free text.
        </p>
      ) : null}
    </div>
  );
}
