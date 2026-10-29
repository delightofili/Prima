import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, CloudOff, Pause, RefreshCw, TriangleAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSyncState } from "../hooks/useSyncState";
import { useI18n, type Key } from "../i18n";
import { LIMIT_TAG, SCHEMA_TAG } from "../lib/syncHealth";
import { retryFailed, syncNow } from "../lib/syncService";
import type { SyncItem } from "../types";
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

const TABLE: Record<SyncItem["table"], Key> = {
  patients: "sync.table.patients",
  visits: "sync.table.visits",
  immunizations: "sync.table.immunizations",
  guardians: "sync.table.guardians",
  reminders: "sync.table.reminders",
  audit: "sync.table.audit",
};

// Raw server text frightens people. This is the plain sentence a nurse reads instead (raw text shows in development).
function errorKey(raw: string): Key {
  if (raw.startsWith(LIMIT_TAG)) return "syncErr.limit";
  if (raw.startsWith(SCHEMA_TAG)) return "syncErr.schema";
  if (raw.startsWith("BUG:")) return "syncErr.bug";
  if (raw.startsWith("PERMISSION:")) return "syncErr.permission";
  if (
    /failed to fetch|network|load failed|timeout|timed out|abort|unavailable|gateway|paused/i.test(
      raw,
    )
  )
    return "syncErr.network";
  if (/sign in again|jwt/i.test(raw)) return "syncErr.auth";
  if (/foreign key/i.test(raw)) return "syncErr.foreignKey";
  return "syncErr.other";
}

function SyncPanel({ onClose }: { onClose: () => void }) {
  const { state, items, counts } = useSyncState();
  const { role } = useAuth();
  const { t, tp, tm } = useI18n();

  return (
    <Modal title={t("sync.panelTitle")} onClose={onClose}>
      <div className="space-y-4">
        <p className="font-semibold">{tm(state.label)}</p>
        <p className="text-subtext">{tm(state.detail)}</p>

        <p className="text-sm text-subtext">
          {t("sync.panelCounts", {
            waiting: counts.waiting,
            failed: counts.failed,
          })}
        </p>

        {items.length > 0 && (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {items.slice(0, 30).map((i) => (
              <li key={i.id} className="rounded-xl bg-page p-3 text-sm">
                <p className="font-semibold">
                  {t(
                    i.status === "failed"
                      ? "sync.itemFailed"
                      : "sync.itemWaiting",
                    { table: t(TABLE[i.table]) },
                  )}
                  {i.attempts > 0 && ` · ${tp("sync.tries", i.attempts)}`}
                </p>
                {i.lastError && (
                  <p className="break-words text-subtext">
                    {import.meta.env.DEV
                      ? i.lastError
                      : t(errorKey(i.lastError))}
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
            {t("common.syncNow")}
          </button>
          {counts.failed > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void retryFailed()}
            >
              {t("sync.retryFailed")}
            </button>
          )}
        </div>

        {role === "admin" && (
          <Link
            to="/sync-doctor"
            onClick={onClose}
            className="inline-block min-h-12 font-semibold text-prima-500 underline"
          >
            {t("sync.openDoctor")}
          </Link>
        )}
      </div>
    </Modal>
  );
}

export function SyncBadge() {
  const [open, setOpen] = useState(false);
  const { state } = useSyncState();
  const { t, tm } = useI18n();
  const Icon = ICON[state.id];
  const label = tm(state.label);

  return (
    <>
      <button
        type="button"
        aria-label={t("sync.badgeAria", { label })}
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-10 max-w-[12rem] items-center gap-2 rounded-full px-3 text-sm font-semibold ${TONE[state.tone]}`}
      >
        <Icon
          size={16}
          className={`shrink-0 ${state.id === "working" ? "animate-spin" : ""}`}
        />
        <span className="truncate">{label}</span>
      </button>
      {open && <SyncPanel onClose={() => setOpen(false)} />}
    </>
  );
}
