import { Link } from "react-router-dom";
import { CloudOff, DatabaseZap, Lock, TriangleAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { syncNow } from "../lib/syncService";
import { useSyncState } from "../hooks/useSyncState";

const BOX =
  "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4";

// One calm message at a time, always saying the records are safe
export function StatusBanner() {
  const { cloudOk, account, role } = useAuth();
  const { state } = useSyncState();

  if (!account || !cloudOk) return null; // the sign-in banner speaks first

  if (state.id === "schema") {
    return (
      <div className={BOX}>
        <p className="flex items-center gap-2 font-semibold">
          <DatabaseZap size={20} className="shrink-0" />
          {state.detail}
        </p>
        {role === "admin" && (
          <Link to="/sync-doctor" className="btn btn-accent sm:w-48">
            Open Sync Doctor
          </Link>
        )}
      </div>
    );
  }

  if (state.id === "upgrade") {
    return (
      <div className={BOX}>
        <p className="flex items-center gap-2 font-semibold">
          <Lock size={20} className="shrink-0" />
          {state.detail} Nothing is lost.
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

  if (state.id === "attention") {
    return (
      <div className={BOX}>
        <p className="flex items-center gap-2 font-semibold">
          <TriangleAlert size={20} className="shrink-0" />
          {state.detail}
        </p>
        {role === "admin" && (
          <Link to="/sync-doctor" className="btn btn-accent sm:w-48">
            Open Sync Doctor
          </Link>
        )}
      </div>
    );
  }

  if (state.id === "cloud-down") {
    return (
      <div className={BOX}>
        <p className="flex items-center gap-2 font-semibold">
          <CloudOff size={20} className="shrink-0" />
          {state.detail}
        </p>
        <button
          type="button"
          className="btn btn-secondary sm:w-40"
          onClick={() => void syncNow(true)}
        >
          Try again
        </button>
      </div>
    );
  }

  return null;
}
