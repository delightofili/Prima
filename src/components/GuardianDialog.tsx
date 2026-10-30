import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useToast } from "../hooks/useToast";
import {
  RELATIONSHIPS,
  GuardianError,
  attachGuardian,
  guardianChoiceError,
  relationshipKey,
  updateGuardian,
  type GuardianChoice,
} from "../lib/guardians";
import { formatPhone } from "../lib/utils";
import type { Guardian, Patient, Relationship } from "../types";
import { GuardianPicker } from "./GuardianPicker";
import { useI18n } from "../i18n";

function Shell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            aria-label={t("common.close")}
            className="p-2"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function GuardianDialog({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [choice, setChoice] = useState<GuardianChoice>(
    patient.guardianId
      ? { kind: "existing", id: patient.guardianId }
      : { kind: "none" },
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const problem = guardianChoiceError(choice);
    if (problem) {
      setError(t(problem));
      return;
    }
    setBusy(true);
    try {
      await attachGuardian(patient, choice);
      toast(t(choice.kind === "none" ? "guardian.removed" : "guardian.saved"));
      onClose();
    } catch (e) {
      setError(
        e instanceof GuardianError ? t(e.key) : t("guardian.saveFailed"),
      );
      setBusy(false);
    }
  };

  return (
    <Shell title={t("guardian.title")} onClose={onClose}>
      <GuardianPicker
        value={choice}
        onChange={(v) => {
          setError(null);
          setChoice(v);
        }}
        nextOfKin={{
          name: patient.nextOfKinName,
          phone: formatPhone(patient.nextOfKinPhone) ?? "",
        }}
      />
      {error && (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          className="btn btn-secondary md:w-36"
          onClick={onClose}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className="btn btn-primary md:w-44"
          disabled={busy}
          onClick={save}
        >
          {t("common.save")}
        </button>
      </div>
    </Shell>
  );
}

export function GuardianEditDialog({
  guardian,
  onClose,
}: {
  guardian: Guardian;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [fullName, setFullName] = useState(guardian.fullName);
  const [phone, setPhone] = useState(formatPhone(guardian.phone) ?? "");
  const [relationship, setRelationship] = useState<Relationship>(
    guardian.relationship,
  );
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const problem = guardianChoiceError({
      kind: "new",
      fullName,
      phone,
      relationship,
      smsConsent: false,
    });
    if (problem) {
      setError(t(problem));
      return;
    }
    await updateGuardian(guardian.id, { fullName, phone, relationship });
    toast(t("guardian.updated"));
    onClose();
  };

  return (
    <Shell title={t("guardian.editTitle")} onClose={onClose}>
      <p className="text-subtext">{t("guardian.editNote")}</p>
      <label className="block space-y-1">
        <span className="text-base font-semibold">
          {t("register.fullName")}
        </span>
        <input
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-base font-semibold">
          {t("guardian.relationship")}
        </span>
        <select
          className="input"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as Relationship)}
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r.value} value={r.value}>
              {t(relationshipKey(r.value))}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-base font-semibold">
          {t("register.phoneOptional")}
        </span>
        <input
          type="tel"
          inputMode="numeric"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          className="btn btn-secondary md:w-36"
          onClick={onClose}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className="btn btn-primary md:w-44"
          onClick={save}
        >
          {t("common.save")}
        </button>
      </div>
    </Shell>
  );
}
