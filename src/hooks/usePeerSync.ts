import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { readBook } from "../lib/peerBookStore";
import {
  cancelPairing,
  disconnect,
  getSession,
  resetSession,
  shareNow,
  startAsGuest,
  startAsHost,
  submitCode,
  subscribeSession,
  type NearbyState,
} from "../lib/peerSession";
import { fetchClinicKey, readClinicKey } from "../lib/syncKey";
import { useAuth } from "./useAuth";

export type { NearbyState, PeerInfo, Totals } from "../lib/peerSession";

// The sharing session is not owned by this screen: it keeps running when the nurse goes to another page.
export function usePeerSync() {
  const { facility, account } = useAuth();
  const ctx = useMemo(
    () => ({ facilityId: facility?.id ?? "", userName: account?.name ?? "" }),
    [facility?.id, account?.name],
  );
  const snap = useSyncExternalStore(subscribeSession, getSession, getSession);

  useEffect(() => cancelPairing, []); // leaving while a code is on display ends that attempt, and nothing else

  return {
    state: snap.state as NearbyState,
    bookVersion: snap.bookVersion,
    startAsHost: useCallback(() => startAsHost(ctx), [ctx]),
    startAsGuest: useCallback(() => startAsGuest(ctx), [ctx]),
    submit: useCallback((text: string) => submitCode(ctx, text), [ctx]),
    shareNow,
    disconnect,
    reset: resetSession,
  };
}

// The phones this one has synced with (reloaded when `version` changes)
export function usePeerBook(version: number) {
  const [book, setBook] = useState<Awaited<ReturnType<typeof readBook>>>([]);
  useEffect(() => {
    let on = true;
    void readBook().then((b) => {
      if (on) setBook(b);
    });
    return () => {
      on = false;
    };
  }, [version]);
  return book;
}

// Whether this phone holds the clinic key, and a way to get it while online
export type KeyStatus = "checking" | "ready" | "missing";
export type KeyNote = null | "getting" | "got" | "offline" | "failed";

export function useClinicKey(facilityId: string) {
  const [status, setStatus] = useState<KeyStatus>("checking");
  const [note, setNote] = useState<KeyNote>(null);

  const get = useCallback(async () => {
    setNote("getting");
    const r = await fetchClinicKey(facilityId);
    if (r === "updated" || r === "same") {
      setStatus("ready");
      setNote("got");
    } else {
      setNote(r === "offline" ? "offline" : "failed");
    }
  }, [facilityId]);

  useEffect(() => {
    let on = true;
    void (async () => {
      const held = await readClinicKey(facilityId);
      if (!on) return;
      setStatus(held ? "ready" : "missing");
      if (!held && navigator.onLine) void get(); // a phone that is online gets its key without being asked
    })();
    return () => {
      on = false;
    };
  }, [facilityId, get]);

  return { status, note, get };
}
