import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useOnline } from "../hooks/common";
import { friendlyError } from "../lib/auth";
import { ACTION_LABELS } from "../lib/auditLabels";
import { config } from "../lib/config";
import { supabase } from "../lib/supabase";

interface Row {
  id: string;
  actor_name: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string;
  created_at: string;
}

const FILTERS = [
  { id: "", label: "Everything" },
  { id: "patient", label: "Patients" },
  { id: "visit", label: "Visits" },
  { id: "consent", label: "Consent" },
  { id: "export", label: "Exports" },
  { id: "team", label: "Team" },
  { id: "request", label: "Requests" },
  { id: "auth", label: "Sign-ins" },
  { id: "security", label: "Security" },
];

export function AuditView() {
  const online = useOnline();
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const waiting = useLiveQuery(() => db.audit.count(), [], 0);

  useEffect(() => {
    if (!online) return;
    let alive = true;
    (async () => {
      let q = supabase
        .from("audit_log")
        .select(
          "id, actor_name, action, entity_type, entity_id, summary, created_at",
        )
        .eq("facility_id", config.facilityId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter) q = q.like("action", `${filter}.%`);
      const { data, error: err } = await q;
      if (!alive) return;
      if (err) setError(friendlyError(err));
      else {
        setRows(data as Row[]);
        setError(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [online, filter]);

  return (
    <div className="space-y-4">
      <p className="text-subtext">
        Who did what, and when. The log records card numbers and which fields
        changed, never names or diagnoses, and nobody can edit or delete it.
        Entries from a phone appear once that phone has synced.
        {waiting > 0 &&
          ` ${waiting} ${waiting === 1 ? "entry is" : "entries are"} still waiting on this phone.`}
      </p>

      <label className="block space-y-1 sm:max-w-xs">
        <span className="text-base font-semibold">Show</span>
        <select
          className="input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      {!online ? (
        <p className="card text-subtext">
          You need internet to read the audit log.
        </p>
      ) : error ? (
        <p role="alert" className="card font-medium text-danger">
          {error}
        </p>
      ) : !rows ? (
        <p className="card text-subtext">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="card text-subtext">
          Nothing recorded for this filter yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="card space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {ACTION_LABELS[r.action] ?? r.action}
                </p>
                <p className="text-sm text-subtext">
                  {new Date(r.created_at).toLocaleString("en-NG")}
                </p>
              </div>
              <p className="text-subtext">
                {r.actor_name}
                {r.summary && ` · ${r.summary}`}
              </p>
              {r.entity_type === "patient" &&
                r.entity_id &&
                r.action !== "patient.erase" && (
                  <Link
                    to={`/patients/${r.entity_id}`}
                    className="text-sm font-semibold text-prima-500 underline"
                  >
                    Open the patient
                  </Link>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
