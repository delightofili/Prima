import { useMemo, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useOnline } from "./common";
import { useAuth } from "./useAuth";
import { usePower } from "../lib/power";
import { LIMIT_TAG, useSyncHealth } from "../lib/syncHealth";
import { describeSync, type SyncState } from "../lib/syncState";

// The current time to the second, and it re-renders once a second, but only while a countdown is on screen.
// (The time is read inside the store's own callbacks, never while a component is drawing itself.)
function useSecond(active: boolean) {
  return useSyncExternalStore(
    (onChange) => {
      if (!active) return () => undefined;
      const t = setInterval(onChange, 1000);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / 1000) * 1000,
    () => 0,
  );
}

export function useSyncState() {
  const online = useOnline();
  const { cloudOk } = useAuth();
  const power = usePower();
  const health = useSyncHealth();
  const items = useLiveQuery(() => db.syncQueue.toArray(), [], []);
  const now = useSecond(health.nextRetryAt !== null);

  const counts = useMemo(() => {
    const failed = items.filter((i) => i.status === "failed");
    return {
      waiting: items.length - failed.length,
      failed: failed.length,
      parked: failed.filter((i) => i.lastError?.startsWith(LIMIT_TAG)).length,
    };
  }, [items]);

  const state: SyncState = describeSync({
    online,
    cloudOk,
    powerActive: power.active,
    waiting: counts.waiting,
    failed: counts.failed,
    parked: counts.parked,
    schemaProblem: health.schemaProblem,
    working: health.working > 0,
    failures: health.failures,
    nextRetryAt: health.nextRetryAt,
    now,
  });
  return { state, items, counts };
}
