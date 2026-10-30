import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Syringe, X } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { saveImmunization } from "../lib/immunizations";
import { todayISO } from "../lib/utils";
import { useI18n } from "../i18n";
import { VACCINES, VACCINE_BY_KEY, nextFor } from "../lib/vaccines";
import type { ImmunizationRecord, Patient } from "../types";

interface Props {
  patient: Patient;
  existing: ImmunizationRecord[];
  onClose: () => void;
}

export function AddVaccineDialog({ patient, existing, onClose }: Props) {
  const { t, isoDate } = useI18n();
  const toast = useToast();
  const taken = useMemo(
    () => new Set(existing.map((r) => `${r.vaccineName}|${r.doseNumber}`)),
    [existing],
  );
  const options = VACCINES.filter(
    (v) => !taken.has(`${v.vaccineName}|${v.doseNumber}`),
  );

  const [key, setKey] = useState(options[0]?.key ?? "");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const vaccine = VACCINE_BY_KEY.get(key);
  const preview = vaccine && date ? nextFor(vaccine, date) : {};

  const save = async () => {
    if (!vaccine) return;
    if (!date) return setError(t("vaccine.errDate"));
    if (date > todayISO()) return setError(t("vaccine.errFuture"));
    if (date < patient.dob) return setError(t("vaccine.errBeforeBirth"));
    await saveImmunization(patient, key, date);
    toast(t("vaccine.recorded", { label: vaccine.label }));
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("patient.addVaccine")}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Syringe size={20} className="text-prima-500" />{" "}
            {t("patient.addVaccine")}
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

        {options.length === 0 ? (
          <p className="text-subtext">{t("vaccine.allRecorded")}</p>
        ) : (
          <>
            <label className="block space-y-1">
              <span className="text-base font-semibold">
                {t("vaccine.label")}
              </span>
              <select
                className="input"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              >
                {options.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-base font-semibold">
                {t("vaccine.dateGiven")}
              </span>
              <input
                type="date"
                className="input"
                max={todayISO()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            {preview.nextDueDate && (
              <p className="rounded-xl bg-accent-50 p-3 font-medium">
                {t("vaccine.nextPreview", {
                  label: preview.nextVaccineLabel ?? "",
                  date: isoDate(preview.nextDueDate),
                })}
              </p>
            )}
            {error && (
              <p role="alert" className="font-medium text-danger">
                {error}
              </p>
            )}
            <button type="button" className="btn btn-primary" onClick={save}>
              {t("vaccine.save")}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
