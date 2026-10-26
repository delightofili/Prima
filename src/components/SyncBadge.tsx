import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Check,
  CloudOff,
  RefreshCw,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { db } from "../db";
import { useOnline } from "../hooks/common";
import { useToast } from "../hooks/useToast";
import { syncNow } from "../lib/syncService";
import type { SyncItem } from "../types";
import { KeyRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { friendlySyncError } from "../lib/syncHealth";

function SyncPanel({
  items,
  onClose,
}: {
  items: SyncItem[];
  onClose: () => void;
}) {
  const toast = useToast();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sync details"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="card max-h-[80vh] w-full max-w-lg space-y-3 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Sync details</h2>
          <button
            type="button"
            aria-label="Close"
            className="p-2"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="rounded-xl border-2 border-line p-3">
              <p className="font-semibold">
                {i.table} ·{" "}
                {i.status === "failed" ? "needs attention" : "waiting"} · tries{" "}
                {i.attempts}
              </p>
              {i.lastError && (
                <p className="mt-1 break-words text-sm text-danger">
                  {friendlySyncError(i.lastError)}
                </p>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            toast("Retrying sync…");
            await syncNow(true);
            /* await retryFailed(); */
          }}
        >
          <RefreshCw size={20} className="mr-2" /> Retry now
        </button>
      </div>
    </div>
  );
}

export function SyncBadge() {
  const online = useOnline();
  const queue = useLiveQuery(() => db.syncQueue.toArray(), []);
  const [open, setOpen] = useState(false);
  const items = queue ?? [];
  const waiting = items.filter((i) => i.status !== "failed").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const { cloudOk } = useAuth();

  let Icon: LucideIcon = Check;
  let text = "Synced";
  if (failed > 0) {
    Icon = TriangleAlert;
    text = `${failed} need attention`;
  } else if (!online) {
    Icon = CloudOff;
    text = waiting > 0 ? `Offline · ${waiting} saved` : "Offline";
  } else if (!cloudOk) {
    Icon = KeyRound;
    text = "Sign in to sync";
  } else if (waiting > 0) {
    Icon = RefreshCw;
    text = `Syncing ${waiting}…`;
  }

  const attention = !online || waiting > 0 || failed > 0;
  return (
    <>
      <button
        type="button"
        disabled={items.length === 0}
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold disabled:cursor-default ${
          attention ? "bg-accent-50 text-ink" : "bg-prima-50 text-prima-900"
        }`}
      >
        <Icon size={16} className={Icon === RefreshCw ? "animate-spin" : ""} />
        {text}
      </button>
      {open &&
        items.length > 0 &&
        createPortal(
          <SyncPanel items={items} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
}
