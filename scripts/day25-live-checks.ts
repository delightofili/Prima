import { randomToken } from "../src/lib/peerAuth";
import {
  PeerError,
  TABLES,
  startLiveSession,
  type ApplyResult,
  type Link,
  type LiveHandle,
  type Rec,
  type SelfInfo,
  type Store,
  type Summary,
  type TableName,
} from "../src/lib/peerProtocol";
import { decide, validateRecord, type Entry } from "../src/lib/peerValidate";

let failed = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
  if (!cond) failed++;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const until = async (cond: () => boolean, ms = 3000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (cond()) return true;
    await sleep(15);
  }
  return cond();
};

const NOW = Date.now();
const FAC = "fac-1";
const KEY = randomToken(32);
const me = (name: string, over: Partial<SelfInfo> = {}): SelfInfo => ({
  dev: `dev-${name}`,
  name: `${name}'s phone`,
  user: name,
  fac: "abcd1234",
  kv: 3,
  key: KEY,
  ...over,
});
const rec = (
  id: string,
  updatedAt: number,
  extra: Record<string, unknown> = {},
): Rec => ({
  id,
  facilityId: FAC,
  createdAt: NOW - 100_000,
  updatedAt,
  ...extra,
});

// A phone's database. Saving something here (add) is what a nurse does; received records come in through apply.
function phone(initial: Rec[] = []) {
  const patients = new Map<string, Rec>(
    initial.map((r) => [r.id, structuredClone(r)]),
  );
  const others = new Map<TableName, Map<string, Rec>>(
    TABLES.filter((t) => t !== "patients").map((t) => [t, new Map()]),
  );
  const table = (t: TableName) =>
    t === "patients" ? patients : others.get(t)!;
  const queue: string[] = [];
  const listeners: (() => void)[] = [];
  const store: Store = {
    async index(t) {
      return [...table(t).values()].map(
        (r): Entry => [r.id, r.updatedAt, r.erasedAt ? 1 : 0],
      );
    },
    async read(t, ids) {
      return ids
        .map((id) => structuredClone(table(t).get(id)!))
        .filter(Boolean);
    },
    async apply(t, items) {
      const res: ApplyResult = {
        added: 0,
        updated: 0,
        skipped: 0,
        rejected: 0,
      };
      for (const raw of items) {
        const r = validateRecord(t, raw, { facilityId: FAC, now: Date.now() });
        if (!r) {
          res.rejected++;
          continue;
        }
        const d = decide(table(t).get(r.id), r);
        if (d === "skip") {
          res.skipped++;
          continue;
        }
        table(t).set(r.id, r);
        queue.push(r.id);
        if (d === "add") res.added++;
        else res.updated++;
      }
      if (res.added + res.updated > 0) listeners.forEach((l) => l()); // what the database hooks do in the app
      return res;
    },
  };
  return {
    store,
    queue,
    patients,
    save: (r: Rec) => {
      patients.set(r.id, r);
    }, // a nurse saves a patient (the app then pokes)
    has: (id: string) => patients.has(id),
    onChange: (l: () => void) => listeners.push(l),
  };
}
type Phone = ReturnType<typeof phone>;

interface Wire {
  onSend?: (from: "a" | "b", text: string) => string | null;
  frames: number;
  sent: string[];
}
function linkPair(wire: Wire = { frames: 0, sent: [] }) {
  const mk = (me: "a" | "b") => ({
    me,
    cb: (() => undefined) as (t: string) => void,
    closeCb: (() => undefined) as () => void,
    closed: false,
  });
  const A = mk("a"),
    B = mk("b");
  const close = (self: typeof A, other: typeof B) => () => {
    if (self.closed) return;
    self.closed = true;
    setTimeout(() => {
      self.closeCb();
      if (!other.closed) {
        other.closed = true;
        other.closeCb();
      }
    }, 0);
  };
  const link = (self: typeof A, other: typeof B): Link => ({
    async send(text) {
      if (self.closed) throw new Error("closed");
      const out = wire.onSend ? wire.onSend(self.me, text) : text;
      wire.frames++;
      wire.sent.push(text);
      if (out !== null) setTimeout(() => other.cb(out), 0);
    },
    onMessage: (cb) => {
      self.cb = cb;
    },
    onClose: (cb) => {
      self.closeCb = cb;
    },
    close: close(self, other),
  });
  return { a: link(A, B), b: link(B, A), wire };
}

interface Side {
  handle: LiveHandle;
  rounds: Summary[];
  ended: { done: boolean; err: PeerError | null };
}
function live(
  link: Link,
  p: Phone,
  role: "host" | "guest",
  name: string,
  over: {
    key?: string;
    everyMs?: number;
    idleMs?: number;
    binding?: string;
  } = {},
): Side {
  const side: Side = {
    handle: undefined as unknown as LiveHandle,
    rounds: [],
    ended: { done: false, err: null },
  };
  side.handle = startLiveSession(link, p.store, {
    role,
    self: me(name, over.key ? { key: over.key } : {}),
    binding: over.binding ?? "s|fpH|fpG",
    everyMs: over.everyMs ?? 60_000,
    idleMs: over.idleMs,
    onRound: (s) => side.rounds.push(s),
    onEnd: (err) => {
      side.ended = { done: true, err };
    },
  });
  return side;
}

(async () => {
  /* ---- the first round, then the link stays open ---- */
  let pa = phone([rec("a1", NOW - 5000)]),
    pb = phone([rec("b1", NOW - 4000)]);
  let l = linkPair();
  let A = live(l.a, pa, "host", "Ada"),
    B = live(l.b, pb, "guest", "Bola");
  ok(
    "the first round happens on both phones and swaps what each lacks",
    (await until(() => A.rounds.length === 1 && B.rounds.length === 1)) &&
      pa.has("b1") &&
      pb.has("a1"),
  );
  await sleep(120);
  ok(
    "afterwards the link stays open: nobody has ended",
    !A.ended.done && !B.ended.done,
  );

  /* ---- a change on the second phone ---- */
  pb.save(rec("b2", NOW - 100));
  B.handle.poke();
  ok(
    "a record saved on the second phone reaches the first within a moment of the poke",
    await until(() => pa.has("b2")),
    "",
  );
  await until(() => A.rounds.length === 2 && B.rounds.length === 2);
  ok(
    "that took one more round on each phone, and the round says one record moved",
    A.rounds.length === 2 &&
      B.rounds.length === 2 &&
      A.rounds[1].received.added === 1 &&
      B.rounds[1].sent === 1,
  );

  /* ---- a change on the first phone ---- */
  pa.save(rec("a2", NOW - 100));
  A.handle.poke();
  ok(
    "a record saved on the first phone reaches the second",
    await until(() => pb.has("a2")),
  );

  /* ---- both change at the same moment ---- */
  pa.save(rec("a3", NOW - 90));
  pb.save(rec("b3", NOW - 90));
  A.handle.poke();
  B.handle.poke();
  ok(
    "both phones saving and poking at once: both end up with both",
    (await until(() => pa.has("b3") && pb.has("a3"))) &&
      !A.ended.done &&
      !B.ended.done,
  );

  /* ---- a burst ---- */
  const before = A.rounds.length;
  for (let i = 0; i < 40; i++) {
    pb.save(rec(`burst${i}`, NOW - 80 + i));
    B.handle.poke();
  }
  ok(
    "forty saves and forty pokes in a burst all arrive and nothing breaks",
    (await until(() => pa.has("burst39"), 5000)) &&
      !A.ended.done &&
      !B.ended.done,
  );
  ok(
    "a burst does not make forty rounds",
    A.rounds.length - before < 8,
    `${A.rounds.length - before} rounds`,
  );
  await sleep(100);

  /* ---- nothing changed: quiet link ---- */
  const frames = l.wire.frames;
  await sleep(300);
  ok("while nothing changes, nothing is sent", l.wire.frames === frames);

  /* ---- a change nobody poked about is found by the first phone's timer ---- */
  A.handle.stop();
  B.handle.stop();
  await until(() => A.ended.done && B.ended.done);
  pa = phone([rec("x", NOW - 3000)]);
  pb = phone();
  l = linkPair();
  A = live(l.a, pa, "host", "Ada", { everyMs: 150 });
  B = live(l.b, pb, "guest", "Bola", { everyMs: 150 });
  await until(() => A.rounds.length === 1 && B.rounds.length === 1);
  pb.save(rec("quiet-b", NOW - 50));
  pa.save(rec("quiet-a", NOW - 50)); // nobody pokes
  ok(
    "without any poke, the first phone's own timer still finds changes on both phones",
    await until(() => pa.has("quiet-b") && pb.has("quiet-a"), 2500),
  );
  A.handle.stop();
  B.handle.stop();
  await until(() => A.ended.done && B.ended.done);

  /* ---- a poke that arrives in the middle of a round ---- */
  pa = phone(
    Array.from({ length: 2000 }, (_, i) => rec(`m${i}`, NOW - 9000 - i)),
  );
  pb = phone();
  l = linkPair();
  A = live(l.a, pa, "host", "Ada");
  B = live(l.b, pb, "guest", "Bola");
  await sleep(5);
  B.handle.poke();
  B.handle.poke(); // pokes while the first, big, round is still running
  ok(
    "pokes during a running round do not break it",
    (await until(
      () => A.rounds.length >= 1 && pb.patients.size === 2000,
      5000,
    )) &&
      !A.ended.done &&
      !B.ended.done,
  );
  pb.save(rec("late", NOW - 10));
  B.handle.poke();
  ok(
    "and the next change still goes through afterwards",
    await until(() => pa.has("late")),
  );
  A.handle.stop();
  B.handle.stop();
  await until(() => A.ended.done && B.ended.done);

  /* ---- ending ---- */
  pa = phone([rec("e1", NOW - 1000)]);
  pb = phone();
  l = linkPair();
  A = live(l.a, pa, "host", "Ada");
  B = live(l.b, pb, "guest", "Bola");
  await until(() => A.rounds.length === 1 && B.rounds.length === 1);
  A.handle.stop();
  ok(
    "stopping one phone ends both: the one that stopped says so quietly, the other hears the link close",
    (await until(() => A.ended.done && B.ended.done)) &&
      A.ended.err === null &&
      B.ended.err?.code === "closed",
  );
  ok("what had been shared stays on both phones", pb.has("e1"));
  A.handle.poke();
  B.handle.poke();
  ok("poking an ended session does nothing and does not crash", true);

  /* ---- a phone that goes silent ---- */
  pa = phone();
  pb = phone();
  let muted = false;
  l = linkPair({
    frames: 0,
    sent: [],
    onSend: (from, t) => (muted && from === "b" ? null : t),
  });
  A = live(l.a, pa, "host", "Ada", { idleMs: 300 });
  B = live(l.b, pb, "guest", "Bola", { idleMs: 300 });
  await until(() => A.rounds.length === 1 && B.rounds.length === 1);
  muted = true;
  pa.save(rec("into-the-void", NOW - 10));
  A.handle.poke();
  ok(
    "if the second phone stops answering, the first gives up with a timeout",
    (await until(() => A.ended.done, 3000)) && A.ended.err?.code === "timeout",
    String(A.ended.err?.code),
  );
  B.handle.stop();

  pa = phone();
  pb = phone();
  muted = false;
  l = linkPair({
    frames: 0,
    sent: [],
    onSend: (from, t) => (muted && from === "a" ? null : t),
  });
  A = live(l.a, pa, "host", "Ada", { everyMs: 100 });
  B = live(l.b, pb, "guest", "Bola", { everyMs: 100 });
  await until(() => A.rounds.length === 1 && B.rounds.length === 1);
  muted = true;
  ok(
    "if the first phone goes quiet for three rounds' time, the second gives up",
    (await until(() => B.ended.done, 3000)) && B.ended.err?.code === "timeout",
    String(B.ended.err?.code),
  );
  A.handle.stop();

  /* ---- who is allowed ---- */
  pa = phone([rec("secret", NOW - 1000)]);
  pb = phone();
  l = linkPair();
  A = live(l.a, pa, "host", "Ada");
  B = live(l.b, pb, "guest", "Bola", { key: randomToken(32) });
  ok(
    "a phone with another clinic key never gets past the first round, on either side",
    (await until(() => A.ended.done && B.ended.done)) &&
      A.ended.err?.code === "auth" &&
      B.ended.err?.code === "auth" &&
      !pb.has("secret"),
  );

  /* ---- three phones: A shares with B, B with C, and a change on A reaches C ---- */
  const A3 = phone([rec("from-a", NOW - 2000)]),
    B3 = phone([rec("from-b", NOW - 2000)]),
    C3 = phone([rec("from-c", NOW - 2000)]);
  const lab = linkPair(),
    lbc = linkPair();
  const sAB_a = live(lab.a, A3, "host", "Ada", { everyMs: 200 }),
    sAB_b = live(lab.b, B3, "guest", "Bola", { everyMs: 200 });
  const sBC_b = live(lbc.a, B3, "host", "Bola", { everyMs: 200 }),
    sBC_c = live(lbc.b, C3, "guest", "Chi", { everyMs: 200 });
  // what the database hooks do in the app: records that arrive from one neighbour are shared with the other
  B3.onChange(() => {
    sAB_b.handle.poke();
    sBC_b.handle.poke();
  });
  ok(
    "three phones, two live links: everything reaches everyone",
    await until(
      () =>
        A3.has("from-c") &&
        C3.has("from-a") &&
        B3.has("from-a") &&
        B3.has("from-c"),
      4000,
    ),
  );
  A3.save(rec("new-on-a", NOW - 5));
  sAB_a.handle.poke();
  ok(
    "a new record on the first phone passes through the middle phone to the third",
    await until(() => C3.has("new-on-a"), 4000),
  );
  C3.save(rec("new-on-c", NOW - 5));
  sBC_c.handle.poke();
  ok(
    "and a new record on the third phone reaches the first",
    await until(() => A3.has("new-on-c"), 4000),
  );
  ok(
    "the middle phone queued everything it received for upload, once per record version",
    ["from-a", "from-c", "new-on-a", "new-on-c"].every((id) =>
      B3.queue.includes(id),
    ),
  );
  for (const s of [sAB_a, sAB_b, sBC_b, sBC_c]) s.handle.stop();

  console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
  process.exit(failed ? 1 : 0);
})();
