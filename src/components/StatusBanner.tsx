import { Link } from "react-router-dom";
import { CloudOff, DatabaseZap, Lock, TriangleAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSyncState } from "../hooks/useSyncState";
import { useI18n } from "../i18n";
import { syncNow } from "../lib/syncService";

const BOX =
  "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4";

// One calm message at a time, always saying the records are safe
export function StatusBanner() {
  const { cloudOk, account, role } = useAuth();
  const { state } = useSyncState();
  const { t, tm } = useI18n();

  if (!account || !cloudOk) return null; // the sign-in banner speaks first

  if (state.id === "schema") {
    return (
      <div className={BOX}>
        <p className="flex items-center gap-2 font-semibold">
          <DatabaseZap size={20} className="shrink-0" />
          {tm(state.detail)}
        </p>
        {role === "admin" && (
          <Link to="/sync-doctor" className="btn btn-accent sm:w-48">
            {t("sync.openDoctorShort")}
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
          {tm(state.detail)} {t("banner.nothingLost")}
          {role !== "admin" && ` ${t("banner.askAdmin")}`}
        </p>
        {role === "admin" && (
          <Link to="/plans" className="btn btn-accent sm:w-40">
            {t("banner.seePlans")}
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
          {tm(state.detail)}
        </p>
        {role === "admin" && (
          <Link to="/sync-doctor" className="btn btn-accent sm:w-48">
            {t("sync.openDoctorShort")}
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
          {tm(state.detail)}
        </p>
        <button
          type="button"
          className="btn btn-secondary sm:w-40"
          onClick={() => void syncNow(true)}
        >
          {t("common.tryAgain")}
        </button>
      </div>
    );
  }

  return null;
}
