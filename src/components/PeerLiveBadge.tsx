import { useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router-dom";
import { Wifi } from "lucide-react";
import { useI18n } from "../i18n";
import { disconnect, getSession, subscribeSession } from "../lib/peerSession";

// While two phones are connected, a small bar on every page says so (and lets the nurse disconnect).
// It is not shown on the Nearby screen itself, which says the same thing in full.
export function PeerLiveBadge() {
  const { t } = useI18n();
  const { state } = useSyncExternalStore(
    subscribeSession,
    getSession,
    getSession,
  );
  const { pathname, search } = useLocation();
  if (state.step !== "live") return null;
  if (
    pathname.startsWith("/dashboard") &&
    new URLSearchParams(search).get("tab") === "nearby"
  )
    return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border-2 border-prima-500 bg-white px-4 py-1"
    >
      <Link
        to="/dashboard?tab=nearby"
        className="flex min-h-11 min-w-0 items-center gap-2 font-semibold text-prima-900"
      >
        <Wifi size={18} className="shrink-0 text-prima-500" />
        <span className="truncate">
          {t("near.live", { name: state.peer.name })}
        </span>
      </Link>
      <button
        type="button"
        className="min-h-11 shrink-0 font-semibold text-prima-500 underline"
        onClick={disconnect}
      >
        {t("near.disconnect")}
      </button>
    </div>
  );
}
