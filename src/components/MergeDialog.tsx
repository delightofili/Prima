import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { GitMerge, X } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { calculateAge } from "../lib/age";
import type { DuplicateMatch } from "../lib/duplicates";
import { executeMerge, planMerge, undoMerge } from "../lib/merge";
import { formatDate, formatPhone } from "../lib/utils";
import type { Patient } from "../types";

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

function Choice({
  p,
  selected,
  onSelect,
}: {
  p: Patient;
  selected: boolean;
  onSelect: () => void;
}) {
  const age = calculateAge(p.dob);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full rounded-2xl border-2 p-4 text-left ${
        selected ? "border-prima-500 bg-prima-50" : "border-line bg-white"
      }`}
    >
      <span className="text-sm font-semibold text-subtext">
        {selected ? "Keeping this record" : "Tap to keep this one instead"}
      </span>
      <span className="mt-1 block text-lg font-bold">{p.fullName}</span>
      <span className="block text-sm font-semibold text-prima-900">
        {p.cardNumber}
      </span>
      <span className="mt-1 block text-subtext">
        {age.label} · born {formatDate(p.dob)}
      </span>
      <span className="block text-subtext">
        {p.village}
        {p.phone ? ` · ${formatPhone(p.phone)}` : ""}
      </span>
      <span className="block text-sm text-subtext">
        Registered{" "}
        {formatDate(new Date(p.createdAt).toLocaleDateString("en-CA"))}
      </span>
    </button>
  );
}

export function MergeDialog({
  match,
  onClose,
}: {
  match: DuplicateMatch;
  onClose: () => void;
}) {
  const toast = useToast();
  const older = match.a.createdAt <= match.b.createdAt ? match.a : match.b;
  const [keepId, setKeepId] = useState(older.id);
  const [busy, setBusy] = useState(false);

  const keep = keepId === match.a.id ? match.a : match.b;
  const drop = keepId === match.a.id ? match.b : match.a;
  const plan = useLiveQuery(() => planMerge(keep, drop), [keep.id, drop.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const confirm = async () => {
    if (!plan || busy) return;
    setBusy(true);
    await executeMerge(plan);
    toast(`Merged into ${plan.keep.fullName}`, "ok", {
      label: "Undo",
      onClick: () => void undoMerge(plan),
    });
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="merge-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="card max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            id="merge-title"
            className="flex items-center gap-2 text-lg font-bold"
          >
            <GitMerge size={22} className="text-prima-500" /> Merge duplicate
            records
          </h2>
          <button
            type="button"
            aria-label="Close"
            className="p-2"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-subtext">
          Choose the record to keep. The other one is merged into it.
        </p>

        <div
          role="radiogroup"
          aria-label="Record to keep"
          className="grid gap-3 md:grid-cols-2"
        >
          <Choice
            p={match.a}
            selected={keepId === match.a.id}
            onSelect={() => setKeepId(match.a.id)}
          />
          <Choice
            p={match.b}
            selected={keepId === match.b.id}
            onSelect={() => setKeepId(match.b.id)}
          />
        </div>

        {plan && (
          <div className="space-y-3 rounded-xl bg-page p-4">
            <p className="font-semibold">What will happen</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                {plural(plan.visitIds.length, "visit moves", "visits move")} to{" "}
                {plan.keep.fullName}
              </li>
              <li>
                {plural(
                  plan.moveShotIds.length,
                  "vaccine record moves",
                  "vaccine records move",
                )}
                {plan.skipShotIds.length > 0 &&
                  `, ${plural(plan.skipShotIds.length, "dose is", "doses are")} already recorded and will not be doubled`}
              </li>
              {plan.filled.length > 0 && (
                <li>
                  Filled in from the other record: {plan.filled.join(", ")}
                </li>
              )}
              <li>
                {plan.drop.cardNumber} is hidden from lists. You can undo for a
                few seconds after merging.
              </li>
            </ul>

            {plan.differences.length > 0 && (
              <div>
                <p className="font-semibold">
                  Different values (the kept record's value stays)
                </p>
                <ul className="list-disc space-y-1 pl-5 text-subtext">
                  {plan.differences.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
            {plan.guardianIds.length > 0 && (
              <li>
                {plural(
                  plan.guardianIds.length,
                  "guardian link moves",
                  "guardian links move",
                )}{" "}
                to {plan.keep.fullName}
              </li>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            className="btn btn-secondary md:w-40"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary md:w-56"
            disabled={!plan || busy}
            onClick={confirm}
          >
            <GitMerge size={20} className="mr-2" /> Merge records
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
