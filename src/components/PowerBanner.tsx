// src/components/PowerBanner.tsx
import { useLiveQuery } from "dexie-react-hooks";
import { BatteryLow } from "lucide-react";
import { db } from "../db";
import { setPowerMode, usePower } from "../lib/power";
import { syncNow } from "../lib/syncService";

// Shown while Low Battery Mode is on, so nobody wonders why nothing is syncing
export function PowerBanner() {
  const power = usePower();
  const waiting = useLiveQuery(
    () => db.syncQueue.filter((i) => i.status !== "failed").count(),
    [],
    0,
  );
  if (!power.active) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-line bg-white p-4">
      <p className="flex items-start gap-2 font-semibold">
        <BatteryLow size={20} className="mt-0.5 shrink-0" />
        <span>
          Low Battery Mode is on. Everything is saved on this phone.
          <span className="block text-sm font-normal text-subtext">
            {waiting > 0
              ? `${waiting} ${waiting === 1 ? "record is" : "records are"} waiting to upload.`
              : "Nothing is waiting to upload."}{" "}
            Syncing is paused.
          </span>
        </span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void syncNow()}
        >
          Sync now
        </button>
        <button
          type="button"
          className="min-h-12 px-3 font-semibold text-subtext"
          onClick={() => setPowerMode("off")}
        >
          Turn off
        </button>
      </div>
    </div>
  );
}
