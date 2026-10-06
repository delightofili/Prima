import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useOnline } from "../hooks/common";

export function SyncBadge() {
  const online = useOnline();
  const queue = useLiveQuery(() => db.syncQueue.toArray(), []);
  const waiting = queue?.filter((i) => i.status !== "failed").length ?? 0;
  const failed = queue?.filter((i) => i.status === "failed").length ?? 0;

  let text = "Synced";
  if (failed > 0) text = `${failed} need attention`;
  else if (!online)
    text = waiting > 0 ? `Offline · ${waiting} saved on phone` : "Offline";
  else if (waiting > 0) text = `Syncing ${waiting}…`;

  const attention = !online || waiting > 0 || failed > 0;
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-semibold ${
        attention ? "bg-accent-50 text-ink" : "bg-prima-50 text-prima-900"
      }`}
    >
      {text}
    </span>
  );
}
