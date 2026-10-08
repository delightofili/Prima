import { useLiveQuery } from "dexie-react-hooks";
import {
  Check,
  CloudOff,
  RefreshCw,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { db } from "../db";
import { useOnline } from "../hooks/common";

export function SyncBadge() {
  const online = useOnline();
  const queue = useLiveQuery(() => db.syncQueue.toArray(), []);
  const waiting = queue?.filter((i) => i.status !== "failed").length ?? 0;
  const failed = queue?.filter((i) => i.status === "failed").length ?? 0;

  let Icon: LucideIcon = Check;
  let text = "Synced";
  if (failed > 0) {
    Icon = TriangleAlert;
    text = `${failed} need attention`;
  } else if (!online) {
    Icon = CloudOff;
    text = waiting > 0 ? `Offline · ${waiting} saved` : "Offline";
  } else if (waiting > 0) {
    Icon = RefreshCw;
    text = `Syncing ${waiting}…`;
  }

  const attention = !online || waiting > 0 || failed > 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
        attention ? "bg-accent-50 text-ink" : "bg-prima-50 text-prima-900"
      }`}
    >
      <Icon size={16} className={Icon === RefreshCw ? "animate-spin" : ""} />
      {text}
    </span>
  );
}
