import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { GitMerge, X } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { useI18n } from "../i18n";
import { calculateAge } from "../lib/age";
import type { DuplicateMatch } from "../lib/duplicates";
import { executeMerge, planMerge, undoMerge } from "../lib/merge";
import { formatPhone } from "../lib/utils";
import type { Patient } from "../types";

function Choice({
  p,
  selected,
  onSelect,
}: {
  p: Patient;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, date, isoDate } = useI18n();
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
        {t(selected ? "merge.keeping" : "merge.keepOther")}
      </span>
      <span className="mt-1 block text-lg font-bold">{p.fullName}</span>
      <span className="block text-sm font-semibold text-prima-900">
        {p.cardNumber}
      </span>
      <span className="mt-1 block text-subtext">
        {age.label} · {t("merge.born", { date: isoDate(p.dob) })}
      </span>
      <span className="block text-subtext">
        {p.village}
        {p.phone ? ` · ${formatPhone(p.phone)}` : ""}
      </span>
      <span className="block text-sm text-subtext">
        {t("merge.registered", { date: date(new Date(p.createdAt)) })}
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
  const { t, tp } = useI18n();
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
    toast(t("merge.done", { name: plan.keep.fullName }), "ok", {
      label: t("common.undo"),
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
            <GitMerge size={22} className="text-prima-500" /> {t("merge.title")}
          </h2>
          <button
            type="button"
            aria-label={t("common.close")}
            className="p-2"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-subtext">{t("merge.help")}</p>

        <div
          role="radiogroup"
          aria-label={t("merge.groupLabel")}
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
            <p className="font-semibold">{t("merge.willHappen")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                {tp("merge.visits", plan.visitIds.length, {
                  name: plan.keep.fullName,
                })}
              </li>
              <li>
                {tp("merge.vaccines", plan.moveShotIds.length, {
                  name: plan.keep.fullName,
                })}
              </li>
              {plan.skipShotIds.length > 0 && (
                <li>{tp("merge.dosesSkipped", plan.skipShotIds.length)}</li>
              )}
              {plan.guardianIds.length > 0 && (
                <li>
                  {tp("merge.guardians", plan.guardianIds.length, {
                    name: plan.keep.fullName,
                  })}
                </li>
              )}
              {plan.filled.length > 0 && (
                <li>{t("merge.filled", { fields: plan.filled.join(", ") })}</li>
              )}
              <li>{t("merge.hidden", { card: plan.drop.cardNumber })}</li>
            </ul>

            {plan.differences.length > 0 && (
              <div>
                <p className="font-semibold">{t("merge.differences")}</p>
                <ul className="list-disc space-y-1 pl-5 text-subtext">
                  {plan.differences.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            className="btn btn-secondary md:w-40"
            onClick={onClose}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-primary md:w-56"
            disabled={!plan || busy}
            onClick={confirm}
          >
            <GitMerge size={20} className="mr-2" /> {t("merge.confirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
