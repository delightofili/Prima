// Two small helpers for a phone that is sharing live: notice when something is saved here, and keep the screen on.
import type { Table } from "dexie";
import { db } from "../db";
import { TABLES } from "./peerValidate";

// Calls `onChange` shortly after anything is saved, changed or deleted in the five record tables.
// It only listens: it never changes what is saved. (A hook that returns a value would change it, so these return nothing.)
export function watchLocalChanges(
  onChange: () => void,
  delayMs = 2000,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const heard = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, delayMs); // a burst of saves becomes one call
  };
  const tables = TABLES.map((t) => db[t] as unknown as Table);
  for (const t of tables) {
    t.hook.creating.subscribe(heard);
    t.hook.updating.subscribe(heard);
    t.hook.deleting.subscribe(heard);
  }
  return () => {
    clearTimeout(timer);
    for (const t of tables) {
      t.hook.creating.unsubscribe(heard);
      t.hook.updating.unsubscribe(heard);
      t.hook.deleting.unsubscribe(heard);
    }
  };
}

// A phone that goes to sleep drops the link. The screen is kept on while sharing, and asked for again
// when the nurse comes back to the page (the browser lets go of it whenever the page is hidden).
export async function keepAwake(): Promise<() => void> {
  let lock: WakeLockSentinel | null = null;
  let on = true;
  const ask = async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      lock = await navigator.wakeLock.request("screen");
    } catch {
      lock = null; // refused (for example, a very low battery): sharing still works, the screen just may sleep
    }
  };
  const back = () => {
    if (on && document.visibilityState === "visible") void ask();
  };
  document.addEventListener("visibilitychange", back);
  await ask();
  return () => {
    on = false;
    document.removeEventListener("visibilitychange", back);
    void lock?.release().catch(() => undefined);
  };
}
