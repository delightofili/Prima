import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../db";
import { logAudit } from "../lib/audit";
import { deviceLabelFromAgent } from "../lib/deviceHealth";
import { getDeviceId } from "../lib/deviceStatus";
import { facilityTag } from "../lib/peerCodec";
import {
  joinAsGuest,
  startHost,
  type GuestSession,
  type HostSession,
  type Opened,
} from "../lib/peerLink";
import {
  PeerError,
  runPeerSync,
  type PeerCode,
  type Progress,
  type Summary,
} from "../lib/peerProtocol";
import type { Role } from "../lib/peerAuth";
import { makePeerStore } from "../lib/peerStore";
import { fetchClinicKey, readClinicKey } from "../lib/syncKey";
import { pushPending } from "../lib/syncService";
import { useAuth } from "./useAuth";

export type NearbyState =
  | { step: "idle" }
  | { step: "host-code"; code: string } // the first phone shows its code
  | { step: "guest-scan" } // the second phone scans it
  | { step: "guest-code"; code: string } // the second phone shows its answer
  | { step: "connecting" }
  | { step: "syncing"; progress: Progress }
  | { step: "done"; summary: Summary; waiting: number }
  | { step: "error"; code: PeerCode; detail?: number };

export function usePeerSync() {
  const { facility, account } = useAuth();
  const facilityId = facility?.id ?? "";
  const userName = account?.name ?? "";
  const [state, setState] = useState<NearbyState>({ step: "idle" });

  const host = useRef<HostSession | null>(null);
  const guest = useRef<GuestSession | null>(null);
  const abort = useRef<AbortController | null>(null);
  const busy = useRef(false); // the camera reports the same code many times: only the first counts
  const alive = useRef(true);

  const show = useCallback((s: NearbyState) => {
    if (alive.current) setState(s);
  }, []);

  const stop = useCallback(() => {
    abort.current?.abort();
    host.current?.cancel();
    guest.current?.cancel();
    abort.current = null;
    host.current = null;
    guest.current = null;
    busy.current = false;
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stop(); // leaving the screen ends any link
    };
  }, [stop]);

  const fail = useCallback(
    (e: unknown) => {
      const err = e instanceof PeerError ? e : new PeerError("protocol");
      stop();
      show({ step: "error", code: err.code, detail: err.detail });
      // An out-of-date clinic key fixes itself the next time this phone is online, so try straight away
      if (err.code === "key-here") void fetchClinicKey(facilityId);
    },
    [facilityId, show, stop],
  );

  const converse = useCallback(
    async (opened: Opened, role: Role) => {
      const key = await readClinicKey(facilityId);
      if (!key) throw new PeerError("no-key");
      const dev = await getDeviceId();
      const controller = new AbortController();
      abort.current = controller;
      show({
        step: "syncing",
        progress: { phase: "hello", sent: 0, received: 0 },
      });
      const summary = await runPeerSync(
        opened.link,
        makePeerStore(facilityId),
        {
          role,
          binding: opened.binding,
          signal: controller.signal,
          self: {
            dev,
            name: deviceLabelFromAgent(navigator.userAgent, dev),
            user: userName,
            fac: await facilityTag(facilityId),
            kv: key.version,
            key: key.key,
          },
          onProgress: (progress) => show({ step: "syncing", progress }),
        },
      );
      const received = summary.received.added + summary.received.updated;
      void logAudit(
        "sync.peer",
        "device",
        summary.peer.dev,
        `with ${summary.peer.name}: sent ${summary.sent}, received ${received}`,
      );
      void pushPending(); // if this phone has internet, what it just received starts on its way to the cloud
      const waiting = await db.syncQueue
        .filter((i) => i.status !== "failed")
        .count();
      show({ step: "done", summary, waiting });
      busy.current = false;
    },
    [facilityId, show, userName],
  );

  const startAsHost = useCallback(async () => {
    try {
      stop();
      if (!(await readClinicKey(facilityId))) throw new PeerError("no-key");
      const session = await startHost(facilityId);
      host.current = session;
      show({ step: "host-code", code: session.code });
    } catch (e) {
      fail(e);
    }
  }, [facilityId, fail, show, stop]);

  const startAsGuest = useCallback(async () => {
    try {
      stop();
      if (!(await readClinicKey(facilityId))) throw new PeerError("no-key");
      show({ step: "guest-scan" });
    } catch (e) {
      fail(e);
    }
  }, [facilityId, fail, show, stop]);

  // The text of the other phone's code, from the camera or from the paste box
  const submit = useCallback(
    async (text: string) => {
      if (busy.current) return;
      busy.current = true;
      try {
        if (host.current) {
          const session = host.current;
          show({ step: "connecting" });
          await converse(await session.accept(text), "host");
        } else {
          const session = await joinAsGuest(text, facilityId);
          guest.current = session;
          show({ step: "guest-code", code: session.code });
          const opened = await session.connected();
          show({ step: "connecting" });
          await converse(opened, "guest");
        }
      } catch (e) {
        fail(e);
      }
    },
    [converse, facilityId, fail, show],
  );

  const reset = useCallback(() => {
    stop();
    show({ step: "idle" });
  }, [show, stop]);

  return { state, startAsHost, startAsGuest, submit, reset };
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
