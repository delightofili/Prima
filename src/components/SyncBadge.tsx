import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, CloudOff, Pause, RefreshCw, TriangleAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSyncState } from "../hooks/useSyncState";
import { friendlySyncError } from "../lib/syncHealth";
import { retryFailed, syncNow } from "../lib/syncService";
import { Modal } from "./Modal";

const ICON = {
  synced: Check,
  offline: CloudOff,
  signin: TriangleAlert,
  schema: TriangleAlert,
  working: RefreshCw,
  paused: Pause,
  attention: TriangleAlert,
  upgrade: Pause,
  "cloud-down": CloudOff,
  retrying: RefreshCw,
  waiting: RefreshCw,
} as const;

const TONE = {
  ok: "bg-white/20 text-white",
  busy: "bg-accent-50 text-ink",
  calm: "bg-accent-50 text-ink",
  attention: "bg-accent-500 text-ink",
} as const;

function SyncPanel({ onClose }: { onClose: () => void }) {
  const { state, items, counts } = useSyncState();
  const { role } = useAuth();

  return (
    <Modal title="Sync details" onClose={onClose}>
      <div className="space-y-4">
        <p className="font-semibold">{state.label}</p>
        <p className="text-subtext">{state.detail}</p>

        <p className="text-sm text-subtext">
          {counts.waiting} waiting to upload, {counts.failed} that need
          attention. Everything stays safe on this phone.
        </p>

        {items.length > 0 && (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {items.slice(0, 30).map((i) => (
              <li key={i.id} className="rounded-xl bg-page p-3 text-sm">
                <p className="font-semibold">
                  {i.table} ·{" "}
                  {i.status === "failed" ? "needs attention" : "waiting"}
                  {i.attempts > 0 &&
                    ` · ${i.attempts} ${i.attempts === 1 ? "try" : "tries"}`}
                </p>
                {i.lastError && (
                  <p className="break-words text-subtext">
                    {friendlySyncError(i.lastError)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void syncNow(true)}
          >
            Sync now
          </button>
          {counts.failed > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void retryFailed()}
            >
              Retry the ones that need attention
            </button>
          )}
        </div>

        {role === "admin" && (
          <Link
            to="/sync-doctor"
            onClick={onClose}
            className="inline-block min-h-12 font-semibold text-prima-500 underline"
          >
            Open Sync Doctor (for admins)
          </Link>
        )}
      </div>
    </Modal>
  );
}

export function SyncBadge() {
  const [open, setOpen] = useState(false);
  const { state } = useSyncState();
  const Icon = ICON[state.id];

  return (
    <>
      <button
        type="button"
        aria-label={`Sync status: ${state.label}. Tap for details.`}
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-10 max-w-[12rem] items-center gap-2 rounded-full px-3 text-sm font-semibold ${TONE[state.tone]}`}
      >
        <Icon
          size={16}
          className={`shrink-0 ${state.id === "working" ? "animate-spin" : ""}`}
        />
        <span className="truncate">{state.label}</span>
      </button>
      {open && <SyncPanel onClose={() => setOpen(false)} />}
    </>
  );
}
