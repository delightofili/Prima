// The conversation two phones have once they are connected. It knows nothing about screens, the camera or WebRTC:
// it only needs a way to send and receive text (a Link) and a way to read and save records (a Store).
//
//   1. hello    who am I, which clinic, which key version, what time is it
//   2. auth     a proof that I hold the clinic key, tied to the two codes that were scanned
//   3. digest   a short fingerprint of each group of records, so equal groups are skipped
//   4. index    for the groups that differ, a list of (id, changed-at) so each side can see what the other lacks
//   5. records  each side sends only the records the other lacks or has older copies of
//   6. bye
//
// A conversation is one "round". A link can be kept open for many rounds (startLiveSession): after the first, the
// first phone (host) starts a round every minute and whenever either phone says something changed (a "poke").
import { checkProof, makeProof, randomToken, type Role } from "./peerAuth";
import { sha256Hex } from "./peerCodec";
import {
  TABLES,
  shouldSend,
  type Entry,
  type Rec,
  type TableName,
} from "./peerValidate";

export { TABLES };
export type { Entry, Rec, TableName };

export interface ApplyResult {
  added: number;
  updated: number;
  skipped: number;
  rejected: number;
}

export interface Store {
  index(table: TableName): Promise<Entry[]>;
  read(table: TableName, ids: string[]): Promise<Rec[]>;
  apply(table: TableName, items: unknown[]): Promise<ApplyResult>;
}

export interface Link {
  send(text: string): Promise<void>;
  onMessage(cb: (text: string) => void): void;
  onClose(cb: () => void): void;
  close(): void;
}

export type PeerCode =
  | "version" // the other phone runs a different version of this conversation
  | "facility" // the other phone belongs to another clinic
  | "key-here" // this phone's clinic key is older: it must go online once
  | "key-there" // the other phone's clinic key is older
  | "clock" // the two clocks differ too much to trust "newest wins"
  | "auth" // the proof was wrong: not the same clinic, or not the same scan
  | "protocol" // the other phone sent something that does not make sense
  | "too-big" // the other phone sent far more than any clinic holds
  | "closed" // the link dropped
  | "timeout" // nothing arrived for too long
  | "cancelled" // someone stopped it
  | "link" // the phones could not reach each other at all
  | "unsupported" // this browser cannot do it
  | "no-key" // this phone has not received the clinic key yet
  | "code"; // the code was not a Prima code, or was for another clinic

export class PeerError extends Error {
  code: PeerCode;
  detail?: number;
  constructor(code: PeerCode, detail?: number) {
    super(`peer sync: ${code}`);
    this.name = "PeerError";
    this.code = code;
    this.detail = detail;
  }
}

export const PEER_LIMITS = {
  frame: 262_144, // the biggest message accepted, in characters
  chunk: 40_000, // the size of a message we send
  idleMs: 45_000, // nothing heard for this long: give up
  sessionMs: 15 * 60_000,
  clockMs: 10 * 60_000, // clocks further apart than this: refuse
  entriesPerFrame: 500,
  recordsPerFrame: 2000,
  totalRecords: 500_000, // far more than any clinic holds
} as const;

export interface SelfInfo {
  dev: string;
  name: string;
  user: string;
  fac: string; // facility tag
  kv: number; // version of the clinic key this phone holds
  key: string; // the clinic key
}

export interface Progress {
  phase: "hello" | "auth" | "compare" | "send" | "receive" | "finish";
  sent: number;
  received: number;
}

export interface Summary {
  peer: { dev: string; name: string; user: string };
  sent: number;
  received: ApplyResult;
  byTable: Record<TableName, { sent: number; received: number }>;
  skewMs: number;
}

export interface Options {
  role: Role;
  self: SelfInfo;
  binding: string; // what the two scanned codes agreed on
  now?: () => number;
  signal?: AbortSignal;
  onProgress?: (p: Progress) => void;
  idleMs?: number; // how long to wait for the other phone before giving up (the tests make it short)
}

export interface LiveOptions extends Options {
  everyMs?: number; // the host starts a round at least this often (default one minute)
  onRound: (summary: Summary) => void; // after every finished round, the first one included
  onEnd: (error: PeerError | null) => void; // once, when the session is over (null: it was stopped on purpose)
}

export interface LiveHandle {
  poke(): void; // something changed here: share it soon
  stop(): void;
}

/* ---------- fingerprints of groups of records ---------- */

function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export const bucketOf = (id: string) => fnv1a(id) & 255;
const sha16 = async (text: string) => (await sha256Hex(text)).slice(0, 16);

export interface Digest {
  n: number;
  h: string; // fingerprint of the whole table
  b: string[]; // fingerprint of each of 256 groups ("" when the group is empty)
}

export async function digestOf(entries: Entry[]): Promise<Digest> {
  const groups: string[][] = Array.from({ length: 256 }, () => []);
  for (const [id, updatedAt, erased] of entries)
    groups[bucketOf(id)].push(`${id}:${updatedAt}:${erased}`);
  const b: string[] = [];
  for (const g of groups) {
    if (g.length === 0) {
      b.push("");
      continue;
    }
    g.sort();
    b.push(await sha16(g.join("\n")));
  }
  return { n: entries.length, h: await sha16(b.join(",")), b };
}

/* ---------- reading messages ---------- */

const WAKE = Symbol("wake");

class Inbox {
  private queue: string[] = [];
  private waiter: ((v: string | typeof WAKE | PeerError) => void) | null = null;
  private closed = false;

  constructor(link: Link) {
    link.onMessage((text) => {
      if (this.waiter) {
        const w = this.waiter;
        this.waiter = null;
        w(text);
      } else {
        this.queue.push(text);
      }
    });
    link.onClose(() => {
      this.closed = true;
      if (this.waiter) {
        const w = this.waiter;
        this.waiter = null;
        w(new PeerError("closed"));
      }
    });
  }

  next(ms: number): Promise<string | typeof WAKE> {
    const queued = this.queue.shift();
    if (queued !== undefined) return Promise.resolve(queued);
    if (this.closed) return Promise.reject(new PeerError("closed"));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiter = null;
        reject(new PeerError("timeout"));
      }, ms);
      this.waiter = (v) => {
        clearTimeout(timer);
        if (v instanceof PeerError) reject(v);
        else resolve(v);
      };
    });
  }

  // Ends an idle wait early (this phone has something to share). Only a waiting reader is woken.
  wake() {
    if (this.waiter) {
      const w = this.waiter;
      this.waiter = null;
      w(WAKE);
    }
  }
}

type Msg = { t: string } & Record<string, unknown>;

function parse(text: string): Msg {
  if (text.length > PEER_LIMITS.frame) throw new PeerError("too-big");
  let m: unknown;
  try {
    m = JSON.parse(text);
  } catch {
    throw new PeerError("protocol");
  }
  if (typeof m !== "object" || m === null || typeof (m as Msg).t !== "string")
    throw new PeerError("protocol");
  return m as Msg;
}

const isInt = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0;
const clip = (s: string, n: number) => s.slice(0, n);
const emptyResult = (): ApplyResult => ({
  added: 0,
  updated: 0,
  skipped: 0,
  rejected: 0,
});
const emptyTables = () =>
  Object.fromEntries(
    TABLES.map((t) => [t, { sent: 0, received: 0 }]),
  ) as Record<TableName, { sent: number; received: number }>;

// What the other phone says when it gives up, seen from here (its "older key" is the other phone's, not ours)
const FLIP: Partial<Record<PeerCode, PeerCode>> = {
  "key-here": "key-there",
  "key-there": "key-here",
};
const REMOTE_CODES: readonly string[] = [
  "version",
  "facility",
  "key-here",
  "key-there",
  "clock",
  "auth",
  "protocol",
  "too-big",
  "cancelled",
];

function validDigest(v: unknown): v is Digest {
  const d = v as Digest;
  return (
    typeof d === "object" &&
    d !== null &&
    isInt(d.n) &&
    typeof d.h === "string" &&
    d.h.length <= 16 &&
    Array.isArray(d.b) &&
    d.b.length === 256 &&
    d.b.every((x) => typeof x === "string" && x.length <= 16)
  );
}

/* ---------- the conversation ---------- */

// Everything one conversation needs, shared by every round on the same link
interface Core {
  link: Link;
  store: Store;
  opts: Options;
  inbox: Inbox;
  roundStartedAt: number;
  poked: boolean; // the other phone said "something changed" while a round was running
  lastHeard: number;
  send(m: Msg): Promise<void>;
  read(...types: string[]): Promise<Msg>;
}

const asPeerError = (e: unknown) =>
  e instanceof PeerError ? e : new PeerError("protocol");

// What the other phone says when it gives up, as a PeerError seen from here
function remoteError(m: Msg): PeerError {
  const code =
    typeof m.code === "string" && REMOTE_CODES.includes(m.code)
      ? (m.code as PeerCode)
      : "protocol";
  return new PeerError(
    FLIP[code] ?? code,
    typeof m.detail === "number" ? m.detail : undefined,
  );
}

function makeCore(link: Link, store: Store, opts: Options): Core {
  const inbox = new Inbox(link);
  const core: Core = {
    link,
    store,
    opts,
    inbox,
    roundStartedAt: Date.now(),
    poked: false,
    lastHeard: Date.now(),
    async send(m) {
      guard();
      await link.send(JSON.stringify(m));
    },
    async read(...types) {
      for (;;) {
        guard();
        let m: Msg;
        try {
          const raw = await inbox.next(opts.idleMs ?? PEER_LIMITS.idleMs);
          if (raw === WAKE) continue; // a local nudge is not a message
          core.lastHeard = Date.now();
          m = parse(raw);
        } catch (e) {
          if (opts.signal?.aborted) throw new PeerError("cancelled");
          throw e;
        }
        if (m.t === "poke") {
          core.poked = true; // the other phone has news: remember it and carry on with this round
          continue;
        }
        if (m.t === "error") throw remoteError(m);
        if (!types.includes(m.t)) throw new PeerError("protocol");
        return m;
      }
    },
  };
  function guard() {
    if (opts.signal?.aborted) throw new PeerError("cancelled");
    if (Date.now() - core.roundStartedAt > PEER_LIMITS.sessionMs)
      throw new PeerError("timeout");
  }
  return core;
}

// One round: hello, proof, fingerprints, lists, records, goodbye. It leaves the link open.
async function round(core: Core): Promise<Summary> {
  const { store, opts } = core;
  const { role, self, binding } = opts;
  const now = opts.now ?? Date.now;
  core.roundStartedAt = Date.now();
  let sent = 0;
  let got = 0;
  const progress = (phase: Progress["phase"]) =>
    opts.onProgress?.({ phase, sent, received: got });
  // Declared with its full type so the compiler knows that code after a failed check never runs
  const fail: (code: PeerCode, detail?: number) => never = (code, detail) => {
    throw new PeerError(code, detail);
  };
  const { send, read } = core;

  /* 1. hello */
  progress("hello");
  const mine = {
    t: "hello",
    v: 1,
    dev: self.dev,
    name: clip(self.name, 40),
    user: clip(self.user, 40),
    fac: self.fac,
    kv: self.kv,
    now: now(),
    nonce: randomToken(),
  };
  await send(mine);
  const h = await read("hello");
  if (h.v !== 1) fail("version");
  if (
    typeof h.dev !== "string" ||
    typeof h.name !== "string" ||
    typeof h.user !== "string" ||
    typeof h.fac !== "string" ||
    !isInt(h.kv) ||
    typeof h.now !== "number" ||
    !Number.isFinite(h.now) ||
    typeof h.nonce !== "string" ||
    h.nonce.length < 8 ||
    h.nonce.length > 64
  ) {
    fail("protocol");
  }
  if (h.fac !== self.fac) fail("facility");
  if (h.kv !== self.kv)
    fail((h.kv as number) > self.kv ? "key-here" : "key-there");
  const skewMs = Math.abs((h.now as number) - now());
  if (skewMs > PEER_LIMITS.clockMs) fail("clock", skewMs);
  const peer = {
    dev: clip(h.dev as string, 80),
    name: clip(h.name as string, 40),
    user: clip(h.user as string, 40),
  };

  /* 2. auth */
  progress("auth");
  const nonceHost = role === "host" ? mine.nonce : (h.nonce as string);
  const nonceGuest = role === "host" ? (h.nonce as string) : mine.nonce;
  await send({
    t: "auth",
    proof: await makeProof(self.key, role, binding, nonceHost, nonceGuest),
  });
  const a = await read("auth");
  const theirRole: Role = role === "host" ? "guest" : "host";
  if (
    typeof a.proof !== "string" ||
    !(await checkProof(
      self.key,
      a.proof,
      theirRole,
      binding,
      nonceHost,
      nonceGuest,
    ))
  )
    fail("auth");

  /* 3. digest */
  progress("compare");
  const local = {} as Record<TableName, Entry[]>;
  const mineDigest = {} as Record<TableName, Digest>;
  for (const table of TABLES) {
    local[table] = await store.index(table);
    mineDigest[table] = await digestOf(local[table]);
  }
  await send({ t: "digest", tables: mineDigest });
  const d = await read("digest");
  const theirDigests = d.tables as Record<string, unknown> | undefined;
  const differing = new Map<TableName, Set<number>>();
  for (const table of TABLES) {
    const theirs = theirDigests?.[table];
    if (!validDigest(theirs)) fail("protocol");
    const t = theirs as Digest;
    if (t.h === mineDigest[table].h) continue;
    const set = new Set<number>();
    for (let i = 0; i < 256; i++)
      if (t.b[i] !== mineDigest[table].b[i]) set.add(i);
    differing.set(table, set);
  }

  /* 4. index of the groups that differ */
  for (const table of TABLES) {
    const set = differing.get(table);
    if (!set) continue;
    const entries = local[table].filter((e) => set.has(bucketOf(e[0])));
    for (let i = 0; i < entries.length; i += PEER_LIMITS.entriesPerFrame) {
      await send({
        t: "index",
        table,
        entries: entries.slice(i, i + PEER_LIMITS.entriesPerFrame),
      });
    }
  }
  await send({ t: "index-end" });

  const theirIndex = new Map<TableName, Map<string, [number, 0 | 1]>>();
  let seen = 0;
  for (;;) {
    const m = await read("index", "index-end");
    if (m.t === "index-end") break;
    const table = m.table as TableName;
    const set = differing.get(table);
    if (
      !TABLES.includes(table) ||
      !set ||
      !Array.isArray(m.entries) ||
      m.entries.length > PEER_LIMITS.entriesPerFrame
    )
      fail("protocol");
    seen += (m.entries as unknown[]).length;
    if (seen > PEER_LIMITS.totalRecords) fail("too-big");
    const map = theirIndex.get(table) ?? new Map<string, [number, 0 | 1]>();
    for (const e of m.entries as unknown[]) {
      if (
        !Array.isArray(e) ||
        e.length !== 3 ||
        typeof e[0] !== "string" ||
        typeof e[1] !== "number" ||
        (e[2] !== 0 && e[2] !== 1) ||
        !set.has(bucketOf(e[0]))
      )
        fail("protocol");
      map.set((e as Entry)[0], [(e as Entry)[1], (e as Entry)[2]]);
    }
    theirIndex.set(table, map);
  }

  /* 5. records: only what the other phone lacks or has an older copy of */
  progress("send");
  const byTable = emptyTables();
  for (const table of TABLES) {
    const set = differing.get(table);
    if (!set) continue;
    const theirs = theirIndex.get(table) ?? new Map<string, [number, 0 | 1]>();
    const ids = local[table]
      .filter((e) => set.has(bucketOf(e[0])) && shouldSend(e, theirs.get(e[0])))
      .map((e) => e[0]);
    let batch: Rec[] = [];
    let size = 0;
    const flush = async () => {
      if (batch.length === 0) return;
      await send({ t: "records", table, items: batch });
      sent += batch.length;
      byTable[table].sent += batch.length;
      batch = [];
      size = 0;
      progress("send");
    };
    for (let i = 0; i < ids.length; i += 100) {
      for (const rec of await store.read(table, ids.slice(i, i + 100))) {
        const length = JSON.stringify(rec).length;
        if (
          size + length > PEER_LIMITS.chunk ||
          batch.length >= PEER_LIMITS.recordsPerFrame
        )
          await flush();
        batch.push(rec);
        size += length;
      }
    }
    await flush();
  }
  await send({
    t: "done",
    counts: Object.fromEntries(TABLES.map((t) => [t, byTable[t].sent])),
  });

  progress("receive");
  const received = emptyResult();
  const arrived = Object.fromEntries(TABLES.map((t) => [t, 0])) as Record<
    TableName,
    number
  >;
  let total = 0;
  let promised: Record<string, unknown> | undefined;
  for (;;) {
    const m = await read("records", "done");
    if (m.t === "done") {
      promised = (m.counts ?? {}) as Record<string, unknown>;
      break;
    }
    const table = m.table as TableName;
    if (
      !TABLES.includes(table) ||
      !Array.isArray(m.items) ||
      m.items.length > PEER_LIMITS.recordsPerFrame
    )
      fail("protocol");
    total += (m.items as unknown[]).length;
    arrived[table] += (m.items as unknown[]).length;
    if (total > PEER_LIMITS.totalRecords) fail("too-big");
    const r = await store.apply(table, m.items as unknown[]);
    received.added += r.added;
    received.updated += r.updated;
    received.skipped += r.skipped;
    received.rejected += r.rejected;
    byTable[table].received += r.added + r.updated;
    got += r.added + r.updated;
    progress("receive");
  }

  // The other phone said how many records it sent: if fewer arrived, something was lost on the way, so this is not a success
  for (const table of TABLES)
    if (promised?.[table] !== arrived[table]) fail("protocol");

  /* 6. bye. Both sides have everything now; a missing goodbye does not undo that. */
  progress("finish");
  await send({ t: "bye" });
  try {
    await read("bye");
  } catch {
    /* the other phone may already have closed */
  }
  return { peer, sent, received, byTable, skewMs };
}

async function tellPeer(link: Link, err: PeerError) {
  if (err.code === "closed" || err.code === "timeout") return;
  try {
    await link.send(
      JSON.stringify({ t: "error", code: err.code, detail: err.detail }),
    );
  } catch {
    /* the link may already be gone */
  }
}

// One conversation, then the link is closed
export async function runPeerSync(
  link: Link,
  store: Store,
  opts: Options,
): Promise<Summary> {
  const core = makeCore(link, store, opts);
  const onAbort = () => link.close();
  opts.signal?.addEventListener("abort", onAbort);
  try {
    return await round(core);
  } catch (e) {
    const err = asPeerError(e);
    await tellPeer(link, err);
    throw err;
  } finally {
    opts.signal?.removeEventListener("abort", onAbort);
    link.close();
  }
}

// The link stays open and the phones keep sharing. The first phone (host) starts a round every minute and whenever
// either phone says something changed. The second phone (guest) asks for a round with a "poke".
export function startLiveSession(
  link: Link,
  store: Store,
  opts: LiveOptions,
): LiveHandle {
  const core = makeCore(link, store, opts);
  const every = opts.everyMs ?? 60_000;
  let stopped = false;
  let ended = false;
  let localPoke = false;
  let idle = false;

  const onAbort = () => handle.stop();
  opts.signal?.addEventListener("abort", onAbort);

  const finish = (err: PeerError | null) => {
    if (ended) return;
    ended = true;
    opts.signal?.removeEventListener("abort", onAbort);
    link.close();
    opts.onEnd(stopped || opts.signal?.aborted ? null : err);
  };

  // Waits for the other phone, a local nudge, or the end of `ms`. Returns what happened.
  const wait = async (ms: number): Promise<"message" | "nudge" | "quiet"> => {
    idle = true;
    try {
      const raw = await core.inbox.next(ms);
      if (raw === WAKE) return "nudge";
      core.lastHeard = Date.now();
      const m = parse(raw);
      if (m.t === "error") throw remoteError(m);
      if (m.t === (opts.role === "host" ? "poke" : "again")) return "message";
      throw new PeerError("protocol");
    } catch (e) {
      if (e instanceof PeerError && e.code === "timeout") return "quiet";
      throw e;
    } finally {
      idle = false;
    }
  };

  void (async () => {
    try {
      opts.onRound(await round(core)); // both phones start together
      while (!stopped) {
        if (opts.role === "host") {
          if (!core.poked && !localPoke) await wait(every); // a poke, a nudge, or a quiet minute: all mean "run a round"
          core.poked = false;
          localPoke = false;
          await core.send({ t: "again" });
          opts.onRound(await round(core));
        } else {
          if (localPoke) {
            localPoke = false;
            await core.send({ t: "poke" });
          }
          const what = await wait(every);
          if (what === "message") {
            core.poked = false;
            opts.onRound(await round(core));
          } else if (
            what === "quiet" &&
            Date.now() - core.lastHeard > 3 * every
          ) {
            throw new PeerError("timeout"); // the first phone has not said anything for three rounds' time
          }
        }
      }
      finish(null);
    } catch (e) {
      const err = asPeerError(e);
      if (!stopped) await tellPeer(link, err);
      finish(err);
    }
  })();

  const handle: LiveHandle = {
    poke() {
      if (stopped || ended) return;
      localPoke = true;
      if (idle) core.inbox.wake();
    },
    stop() {
      if (stopped) return;
      stopped = true;
      link.close();
    },
  };
  return handle;
}
