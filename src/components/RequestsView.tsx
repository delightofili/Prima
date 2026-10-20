import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Download, Plus, TriangleAlert } from "lucide-react";
import { Field } from "./FormBits";
import { Modal } from "./Modal";
import { useOnline } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import { useToast } from "../hooks/useToast";
import { friendlyError } from "../lib/auth";
import { config } from "../lib/config";
import { exportPatientRecord } from "../lib/privacy";
import { pullChanges } from "../lib/syncService";
import { supabase } from "../lib/supabase";
import { formatDate, normalize, todayISO } from "../lib/utils";
import type { Patient } from "../types";

type Kind = "access" | "correction" | "erasure" | "stop_sms" | "other";

interface RequestRow {
  id: string;
  patient_id: string | null;
  requester: string;
  kind: Kind;
  received_on: string;
  status: "open" | "done" | "declined";
  notes: string;
}

const KINDS: { id: Kind; label: string }[] = [
  { id: "access", label: "Wants to see their record" },
  { id: "correction", label: "Wants a mistake corrected" },
  { id: "erasure", label: "Wants their record removed" },
  { id: "stop_sms", label: "Wants SMS reminders stopped" },
  { id: "other", label: "Something else" },
];
const kindLabel = (k: Kind) => KINDS.find((x) => x.id === k)?.label ?? k;

function NewRequestDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { results: patients } = usePatients("");
  const [requester, setRequester] = useState("");
  const [kind, setKind] = useState<Kind>("access");
  const [received, setReceived] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [find, setFind] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    const term = normalize(find);
    if (term.length < 2) return [];
    return patients
      .filter(
        (p) =>
          p.name.includes(term) || p.cardNumber.toLowerCase().includes(term),
      )
      .slice(0, 5);
  }, [patients, find]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (requester.trim().length < 2) return setError("Enter who is asking.");
    const { error: err } = await supabase.from("data_requests").insert({
      facility_id: config.facilityId,
      patient_id: patient?.id ?? null,
      requester: requester.trim(),
      kind,
      received_on: received,
      notes: notes.trim(),
    });
    if (err) return setError(friendlyError(err));
    onSaved();
    onClose();
  };

  return (
    <Modal title="Log a data request" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Who is asking?">
          <input
            className="input"
            value={requester}
            onChange={(e) => setRequester(e.target.value)}
          />
        </Field>
        <Field label="What do they want?">
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
          >
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date received">
          <input
            type="date"
            className="input"
            max={todayISO()}
            value={received}
            onChange={(e) => setReceived(e.target.value)}
          />
        </Field>
        <div className="space-y-2">
          <p className="text-base font-semibold">Their record (optional)</p>
          {patient ? (
            <p className="flex items-center justify-between gap-2 rounded-xl bg-prima-50 p-3 font-medium">
              {patient.fullName} · {patient.cardNumber}
              <button
                type="button"
                className="font-semibold text-prima-500"
                onClick={() => setPatient(null)}
              >
                Change
              </button>
            </p>
          ) : (
            <>
              <input
                className="input"
                placeholder="Search name or card number"
                value={find}
                onChange={(e) => setFind(e.target.value)}
              />
              {matches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between rounded-xl border-2 border-line bg-white px-3 text-left"
                  onClick={() => setPatient(p)}
                >
                  <span className="font-medium">{p.fullName}</span>
                  <span className="text-sm font-semibold text-prima-500">
                    {p.cardNumber}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
        <Field label="Notes">
          <textarea
            className="input h-auto py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="font-medium text-danger">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary">
          Save request
        </button>
      </form>
    </Modal>
  );
}

function EraseDialog({
  patient,
  requestId,
  onClose,
  onDone,
}: {
  patient: Patient;
  requestId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches =
    typed.trim().toUpperCase() === patient.cardNumber.toUpperCase();

  const erase = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc("erase_patient", {
      p_patient_id: patient.id,
      p_request_id: requestId,
    });
    if (err) {
      setError(friendlyError(err));
      setBusy(false);
      return;
    }
    await pullChanges(); // bring the erased version to this phone straight away
    toast("Patient permanently erased");
    onDone();
    onClose();
  };

  return (
    <Modal title="Permanently erase this patient?" onClose={onClose}>
      <p className="flex items-start gap-3">
        <TriangleAlert size={24} className="mt-0.5 shrink-0 text-danger" />
        <span>
          This wipes <strong>{patient.fullName}</strong>'s name, date of birth,
          phone, address, next of kin, allergies and every visit's contents, on
          every phone. It <strong>cannot be undone</strong>. Health records may
          have to be kept for a period set by law, so check before you erase.
        </span>
      </p>
      <Field label={`Type the card number ${patient.cardNumber} to confirm`}>
        <input
          className="input font-mono uppercase"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
        />
      </Field>
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
          className="btn bg-danger text-white hover:brightness-90 md:w-56"
          disabled={!matches || busy}
          onClick={erase}
        >
          {busy ? "Erasing…" : "Erase permanently"}
        </button>
      </div>
    </Modal>
  );
}

export function RequestsView() {
  const online = useOnline();
  const toast = useToast();
  const { account } = useAuth();
  const { patientMap } = usePatients("");
  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [creating, setCreating] = useState(false);
  const [erasing, setErasing] = useState<{
    patient: Patient;
    requestId: string;
  } | null>(null);

  useEffect(() => {
    if (!online) return;
    let alive = true;
    (async () => {
      const { data, error: err } = await supabase
        .from("data_requests")
        .select("id, patient_id, requester, kind, received_on, status, notes")
        .eq("facility_id", config.facilityId)
        .order("created_at", { ascending: false });
      if (!alive) return;
      if (err) setError(friendlyError(err));
      else {
        setRows(data as RequestRow[]);
        setError(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [online, version]);

  const setStatus = async (id: string, status: "done" | "declined") => {
    const { error: err } = await supabase
      .from("data_requests")
      .update({
        status,
        handled_by: account?.userId,
        handled_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (err) return toast(friendlyError(err), "error");
    setVersion((v) => v + 1);
  };

  return (
    <div className="space-y-4">
      <p className="text-subtext">
        When someone asks to see, correct or remove their information, log it
        here and deal with it. Every step is recorded in the audit log.
      </p>
      <button
        type="button"
        className="btn btn-primary sm:w-60"
        onClick={() => setCreating(true)}
        disabled={!online}
      >
        <Plus size={20} className="mr-2" /> Log a request
      </button>

      {!online ? (
        <p className="card text-subtext">
          You need internet to handle data requests.
        </p>
      ) : error ? (
        <p role="alert" className="card font-medium text-danger">
          {error}
        </p>
      ) : !rows ? (
        <p className="card text-subtext">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="card text-subtext">No requests logged yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const patient = r.patient_id
              ? patientMap.get(r.patient_id)
              : undefined;
            return (
              <li key={r.id} className="card space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{kindLabel(r.kind)}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      r.status === "open"
                        ? "bg-accent-50"
                        : "bg-prima-50 text-prima-900"
                    }`}
                  >
                    {r.status === "open"
                      ? "Open"
                      : r.status === "done"
                        ? "Done"
                        : "Declined"}
                  </span>
                </div>
                <p className="text-subtext">
                  {r.requester} · received {formatDate(r.received_on)}
                  {patient
                    ? ` · ${patient.fullName} (${patient.cardNumber})`
                    : r.patient_id
                      ? " · record erased or removed"
                      : ""}
                </p>
                {r.notes && <p>{r.notes}</p>}

                {r.status === "open" && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {patient && (
                      <button
                        type="button"
                        className="btn btn-secondary sm:w-52"
                        onClick={() => void exportPatientRecord(patient)}
                      >
                        <Download size={20} className="mr-2" /> Export record
                      </button>
                    )}
                    {patient && r.kind === "erasure" && (
                      <button
                        type="button"
                        className="btn border-2 border-danger text-danger hover:bg-danger/10 sm:w-52"
                        onClick={() => setErasing({ patient, requestId: r.id })}
                      >
                        Erase permanently
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary sm:w-40"
                      onClick={() => void setStatus(r.id, "done")}
                    >
                      Mark done
                    </button>
                    <button
                      type="button"
                      className="min-h-12 px-3 font-semibold text-subtext"
                      onClick={() => void setStatus(r.id, "declined")}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {creating && (
        <NewRequestDialog
          onClose={() => setCreating(false)}
          onSaved={() => setVersion((v) => v + 1)}
        />
      )}
      {erasing && (
        <EraseDialog
          patient={erasing.patient}
          requestId={erasing.requestId}
          onClose={() => setErasing(null)}
          onDone={() => setVersion((v) => v + 1)}
        />
      )}
    </div>
  );
}
