// The sharing session lives here, outside any screen, so it keeps going while the nurse uses the rest of the app
// (registering a patient, opening a record). Screens only look at it and press its buttons.
import { db } from "../db";
import { logAudit } from "./audit";
import { deviceLabelFromAgent } from "./deviceHealth";
import { getDeviceId } from "./deviceStatus";
import { facilityTag } from "./peerCodec";
import {
  joinAsGuest,
  startHost,
  type GuestSession,
  type HostSession,
  type Opened,
} from "./peerLink";
import {
  PeerError,
  startLiveSession,
  type LiveHandle,
  type PeerCode,
  type Progress,
} from "./peerProtocol";
import type { Role } from "./peerAuth";
import { noteSync } from "./peerBook";
import { readBook, writeBook } from "./peerBookStore";
import { makePeerStore } from "./peerStore";
import { keepAwake, watchLocalChanges } from "./peerWatch";
import { fetchClinicKey, readClinicKey } from "./syncKey";
import { pushPending } from "./syncService";

export interface PeerInfo {
  dev: string;
  name: string;
  user: string;
}

export interface Totals {
  sent: number;
  received: number;
  rounds: number;
}

export type NearbyState =
  | { step: "idle" }
  | { step: "host-code"; code: string } // the first phone shows its code
  | { step: "guest-scan" } // the second phone scans it
  | { step: "guest-code"; code: string } // the second phone shows its answer
  | { step: "connecting" }
  | { step: "syncing"; progress: Progress } // the first round
  | {
      step: "live";
      peer: PeerInfo;
      totals: Totals;
      lastAt: number;
      busy: boolean;
    } // connected, sharing as things change
  | {
      step: "done";
      peer: PeerInfo | null;
      totals: Totals;
      ended: "you" | "them" | "quiet";
      waiting: number;
    }
  | { step: "error"; code: PeerCode; detail?: number };

export interface SessionSnapshot {
  state: NearbyState;
  bookVersion: number; // goes up whenever the book of phones changes
}

// Who this phone belongs to, given by the screen at the moment a button is pressed
export interface Ctx {
  facilityId: string;
  userName: string;
}

const QUIET_END_MS = 30 * 60_000; // nothing to share for this long: disconnect, to save the battery
const SHARE_EVERY_MS = 60_000;

/* ---------- what screens can look at ---------- */

let current: SessionSnapshot = { state: { step: "idle" }, bookVersion: 0 };
const listeners = new Set<() => void>();

function publish(patch: Partial<SessionSnapshot>) {
  current = { ...current, ...patch };
  listeners.forEach((l) => l());
}
const show = (state: NearbyState) => publish({ state });

export const subscribeSession = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export const getSession = () => current;

/* ---------- the session itself ---------- */

let host: HostSession | null = null;
let guest: GuestSession | null = null;
let live: LiveHandle | null = null;
let abort: AbortController | null = null;
let busy = false; // the camera reports the same code many times: only the first counts
let endedBy: "you" | "them" | "quiet" = "them";
let writes: Promise<void> = Promise.resolve(); // book writes happen one after the other

function stop() {
  abort?.abort();
  host?.cancel();
  guest?.cancel();
  live?.stop();
  abort = null;
  host = null;
  guest = null;
  live = null;
  busy = false;
}

function fail(ctx: Ctx, e: unknown) {
  const err = e instanceof PeerError ? e : new PeerError("protocol");
  stop();
  show({ step: "error", code: err.code, detail: err.detail });
  // An out-of-date clinic key fixes itself the next time this phone is online, so try straight away
  if (err.code === "key-here") void fetchClinicKey(ctx.facilityId);
}

// Connected: run the first round, then keep sharing until someone disconnects
async function share(ctx: Ctx, opened: Opened, role: Role) {
  const key = await readClinicKey(ctx.facilityId);
  if (!key) throw new PeerError("no-key");
  const dev = await getDeviceId();
  const controller = new AbortController();
  abort = controller;
  show({ step: "syncing", progress: { phase: "hello", sent: 0, received: 0 } });

  const totals: Totals = { sent: 0, received: 0, rounds: 0 };
  let peer: PeerInfo | null = null;
  let lastMoved = Date.now();
  endedBy = "them";

  const unwatch = watchLocalChanges(() => live?.poke()); // something was saved here: share it
  const release = await keepAwake();
  const quietTimer = window.setInterval(() => {
    if (Date.now() - lastMoved > QUIET_END_MS) {
      endedBy = "quiet";
      live?.stop();
    }
  }, 60_000);
  const cleanup = () => {
    unwatch();
    release();
    window.clearInterval(quietTimer);
  };

  live = startLiveSession(opened.link, makePeerStore(ctx.facilityId), {
    role,
    binding: opened.binding,
    signal: controller.signal,
    everyMs: SHARE_EVERY_MS,
    self: {
      dev,
      name: deviceLabelFromAgent(navigator.userAgent, dev),
      user: ctx.userName,
      fac: await facilityTag(ctx.facilityId),
      kv: key.version,
      key: key.key,
    },
    onProgress: (progress) => {
      if (totals.rounds === 0) show({ step: "syncing", progress });
      else if (progress.phase === "compare" && peer)
        show({
          step: "live",
          peer,
          totals: { ...totals },
          lastAt: Date.now(),
          busy: true,
        });
    },
    onRound: (summary) => {
      const got = summary.received.added + summary.received.updated;
      peer = summary.peer;
      totals.sent += summary.sent;
      totals.received += got;
      totals.rounds += 1;
      if (summary.sent + got > 0) lastMoved = Date.now();
      if (got > 0) void pushPending(); // if this phone has internet, what it just received starts on its way to the cloud
      if (totals.rounds === 1 || summary.sent + got > 0) {
        writes = writes.then(async () => {
          await writeBook(
            noteSync(
              await readBook(),
              summary.peer,
              summary.sent,
              got,
              Date.now(),
            ),
          );
          publish({ bookVersion: current.bookVersion + 1 });
        });
      }
      show({
        step: "live",
        peer: summary.peer,
        totals: { ...totals },
        lastAt: Date.now(),
        busy: false,
      });
    },
    onEnd: (err) => {
      cleanup();
      busy = false;
      live = null;
      if (peer)
        void logAudit(
          "sync.peer",
          "device",
          peer.dev,
          `with ${peer.name}: sent ${totals.sent}, received ${totals.received} in ${totals.rounds} rounds`,
        );
      // A link that drops or goes quiet after sharing worked is an ending, not a failure
      if (
        err &&
        (totals.rounds === 0 ||
          (err.code !== "closed" && err.code !== "timeout"))
      ) {
        show({ step: "error", code: err.code, detail: err.detail });
        if (err.code === "key-here") void fetchClinicKey(ctx.facilityId);
        return;
      }
      void db.syncQueue
        .filter((i) => i.status !== "failed")
        .count()
        .then((waiting) =>
          show({
            step: "done",
            peer,
            totals: { ...totals },
            ended: endedBy,
            waiting,
          }),
        );
    },
  });
}

/* ---------- what screens can do ---------- */

export async function startAsHost(ctx: Ctx) {
  try {
    stop();
    if (!(await readClinicKey(ctx.facilityId))) throw new PeerError("no-key");
    host = await startHost(ctx.facilityId);
    show({ step: "host-code", code: host.code });
  } catch (e) {
    fail(ctx, e);
  }
}

export async function startAsGuest(ctx: Ctx) {
  try {
    stop();
    if (!(await readClinicKey(ctx.facilityId))) throw new PeerError("no-key");
    show({ step: "guest-scan" });
  } catch (e) {
    fail(ctx, e);
  }
}

// The text of the other phone's code, from the camera or from the paste box
export async function submitCode(ctx: Ctx, text: string) {
  if (busy) return;
  busy = true;
  try {
    if (host) {
      const session = host;
      show({ step: "connecting" });
      await share(ctx, await session.accept(text), "host");
    } else {
      guest = await joinAsGuest(text, ctx.facilityId);
      show({ step: "guest-code", code: guest.code });
      const opened = await guest.connected();
      show({ step: "connecting" });
      await share(ctx, opened, "guest");
    }
  } catch (e) {
    fail(ctx, e);
  }
}

// Share right now, without waiting for the next check
export const shareNow = () => live?.poke();

// End the sharing on purpose: the screen then shows what was shared
export function disconnect() {
  endedBy = "you";
  live?.stop();
}

export function resetSession() {
  stop();
  show({ step: "idle" });
}

// Leaving the screen while a code is still on display ends that attempt. A connected session carries on.
export function cancelPairing() {
  const s = current.state.step;
  if (s === "host-code" || s === "guest-scan" || s === "guest-code")
    resetSession();
}
