import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { CloudOff, Lock } from "lucide-react";
import { db } from "../db";
import { useOnline } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { LIMIT_TAG, useSyncHealth } from "../lib/syncHealth";
import { syncNow } from "../lib/syncService";

const BOX =
  "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4";

export function StatusBanner() {
  const { cloudOk, account, role } = useAuth();
  const online = useOnline();
  const health = useSyncHealth();
  const parked = useLiveQuery(
    () =>
      db.syncQueue
        .filter(
          (i) =>
            i.table === "patients" &&
            i.status === "failed" &&
            !!i.lastError?.startsWith(LIMIT_TAG),
        )
        .count(),
    [],
    0,
  );

  if (!account || !cloudOk) return null; // the sign-in banner speaks first

  if (parked > 0) {
    return (
      <div className={BOX}>
        <p className="flex items-center gap-2 font-semibold">
          <Lock size={20} className="shrink-0" />
          {parked} {parked === 1 ? "patient is" : "patients are"} saved on this
          phone but not uploaded yet, because the Free plan holds 200 patients.
          Nothing is lost.
          {role !== "admin" && " Ask your facility admin to upgrade."}
        </p>
        {role === "admin" && (
          <Link to="/plans" className="btn btn-accent sm:w-40">
            See plans
          </Link>
        )}
      </div>
    );
  }

  if (online && health.failures >= 3) {
    return (
      <div className={BOX}>
        <p className="flex items-center gap-2 font-semibold">
          <CloudOff size={20} className="shrink-0" />
          Prima can't reach the cloud right now. Everything is saved on this
          phone and will upload by itself.
        </p>
        <button
          type="button"
          className="btn btn-secondary sm:w-40"
          onClick={() => void syncNow()}
        >
          Try again
        </button>
      </div>
    );
  }

  return null;
}
