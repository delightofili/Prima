import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useToast } from "../hooks/useToast";
import {
  RELATIONSHIPS,
  attachGuardian,
  updateGuardian,
  validateGuardianChoice,
  type GuardianChoice,
} from "../lib/guardians";
import { formatPhone } from "../lib/utils";
import type { Guardian, Patient, Relationship } from "../types";
import { GuardianPicker } from "./GuardianPicker";

function Shell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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
            aria-label="Close"
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
  const toast = useToast();
  const [choice, setChoice] = useState<GuardianChoice>(
    patient.guardianId
      ? { kind: "existing", id: patient.guardianId }
      : { kind: "none" },
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const problem = validateGuardianChoice(choice);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      await attachGuardian(patient, choice);
      toast(choice.kind === "none" ? "Guardian removed" : "Guardian saved");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the guardian.");
      setBusy(false);
    }
  };

  return (
    <Shell title="Guardian" onClose={onClose}>
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
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary md:w-44"
          disabled={busy}
          onClick={save}
        >
          Save
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
  const toast = useToast();
  const [fullName, setFullName] = useState(guardian.fullName);
  const [phone, setPhone] = useState(formatPhone(guardian.phone) ?? "");
  const [relationship, setRelationship] = useState<Relationship>(
    guardian.relationship,
  );
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const problem = validateGuardianChoice({
      kind: "new",
      fullName,
      phone,
      relationship,
      smsConsent: false,
    });
    if (problem) {
      setError(problem);
      return;
    }
    await updateGuardian(guardian.id, { fullName, phone, relationship });
    toast("Guardian updated");
    onClose();
  };

  return (
    <Shell title="Edit guardian" onClose={onClose}>
      <p className="text-subtext">
        Changes apply to every child linked to this guardian.
      </p>
      <label className="block space-y-1">
        <span className="text-base font-semibold">Full name</span>
        <input
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-base font-semibold">Relationship</span>
        <select
          className="input"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as Relationship)}
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
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary md:w-44"
          onClick={save}
        >
          Save
        </button>
      </div>
    </Shell>
  );
}
