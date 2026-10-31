import { checkProof, makeProof, randomToken } from "../src/lib/peerAuth";
import {
  MAX_SIGNAL_CHARS,
  SIGNAL_PREFIX,
  decodeSignal,
  encodeSignal,
  facilityTag,
  sdpFingerprint,
  stripSdp,
  zip,
  type Signal,
} from "../src/lib/peerCodec";
import {
  PEER_LIMITS,
  PeerError,
  TABLES,
  bucketOf,
  digestOf,
  runPeerSync,
  type ApplyResult,
  type Link,
  type Rec,
  type SelfInfo,
  type Store,
  type TableName,
} from "../src/lib/peerProtocol";
import {
  decide,
  shouldSend,
  validateRecord,
  MAX_AHEAD,
  MIN_TIME,
  type Entry,
} from "../src/lib/peerValidate";

let failed = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
  if (!cond) failed++;
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

/* ---------- a stand-in for a phone's database ---------- */
type Data = Record<TableName, Rec[]>;
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

function phone(initial: Partial<Data> = {}, facilityId = FAC) {
  const tables = new Map<TableName, Map<string, Rec>>(
    TABLES.map((t) => [
      t,
      new Map((initial[t] ?? []).map((r) => [r.id, structuredClone(r)])),
    ]),
  );
  const queue: { table: TableName; id: string }[] = [];
  const store: Store = {
    async index(t) {
      return [...tables.get(t)!.values()].map(
        (r): Entry => [r.id, r.updatedAt, r.erasedAt ? 1 : 0],
      );
    },
    async read(t, ids) {
      return ids
        .map((id) => structuredClone(tables.get(t)!.get(id)!))
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
        const r = validateRecord(t, raw, { facilityId, now: Date.now() });
        if (!r) {
          res.rejected++;
          continue;
        }
        const local = tables.get(t)!.get(r.id);
        const d = decide(local, r);
        if (d === "skip") {
          res.skipped++;
          continue;
        }
        tables.get(t)!.set(r.id, r);
        queue.push({ table: t, id: r.id });
        if (d === "add") res.added++;
        else res.updated++;
      }
      return res;
    },
  };
  return {
    store,
    tables,
    queue,
    get: (t: TableName, id: string) => tables.get(t)!.get(id),
    count: (t: TableName) => tables.get(t)!.size,
  };
}

/* ---------- two phones joined by a pretend link ---------- */
interface Wire {
  onSend?: (from: "a" | "b", text: string) => string | null;
  bytes: number;
  frames: number;
  sent: string[];
}
function linkPair(wire: Wire = { bytes: 0, frames: 0, sent: [] }) {
  // Like a real data channel: what was sent before a close still arrives, and only then does the other side hear "closed"
  const mk = (me: "a" | "b") => ({
    me,
    // starts as "do nothing"; the real handler replaces it when a phone starts listening
    cb: (() => undefined) as (text: string) => void,
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
      wire.bytes += text.length;
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

type Pair = ReturnType<typeof phone>;
async function sync(
  x: Pair,
  y: Pair,
  over: {
    x?: Partial<SelfInfo>;
    y?: Partial<SelfInfo>;
    binding?: [string, string];
    wire?: Wire;
    idleMs?: number;
    xSignal?: AbortSignal;
  } = {},
) {
  const l = linkPair(over.wire);
  const [bx, by] = over.binding ?? ["session|fpH|fpG", "session|fpH|fpG"];
  const rx = runPeerSync(l.a, x.store, {
    role: "host",
    self: me("Ada", over.x),
    binding: bx,
    idleMs: over.idleMs,
    signal: over.xSignal,
  });
  const ry = runPeerSync(l.b, y.store, {
    role: "guest",
    self: me("Bola", over.y),
    binding: by,
    idleMs: over.idleMs,
  });
  const [a, b] = await Promise.allSettled([rx, ry]);
  return { a, b, l };
}
const code = (r: PromiseSettledResult<unknown>) =>
  r.status === "rejected"
    ? r.reason instanceof PeerError
      ? r.reason.code
      : `other:${r.reason?.message}`
    : "ok";
const value = <T>(r: PromiseSettledResult<T>) =>
  (r as PromiseFulfilledResult<T>).value;
const same = (x: Pair, y: Pair) =>
  TABLES.every(
    (t) =>
      JSON.stringify([...x.tables.get(t)!.entries()].sort()) ===
      JSON.stringify([...y.tables.get(t)!.entries()].sort()),
  );

(async () => {
  /* ===================== the QR text ===================== */
  const SDP =
    "v=0\r\no=mozilla...THIS_IS_SDPARTA-99.0 4880605835995044744 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=sendrecv\r\na=fingerprint:sha-256 DA:9C:EC:36:16:CD:85:E0:68:0A:5E:81:78:14:C2:60:D6:C3:AA:A6:5B:20:03:3B:74:93:89:62:E5:EB:98:6A\r\na=group:BUNDLE 0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=candidate:0 1 UDP 2122252543 f471ae41-68d6-4fc6-878d-9095b1645b77.local 40122 typ host\r\na=candidate:1 1 TCP 2105524479 f471ae41-68d6-4fc6-878d-9095b1645b77.local 9 typ host tcptype active\r\na=ice-pwd:c04c34c18d814516541a78db9644d9a6\r\na=ice-ufrag:b57babe1\r\na=mid:0\r\na=setup:actpass\r\na=sctp-port:5000\r\n";
  const sig: Signal = {
    v: 1,
    kind: "offer",
    sid: "AbCdEf123456",
    fac: await facilityTag("fac-1"),
    sdp: stripSdp(SDP),
  };
  const text = await encodeSignal(sig);
  ok(
    "a code starts with the Prima marker and fits a QR code comfortably",
    text.startsWith(SIGNAL_PREFIX) && text.length < 800,
    `${text.length} characters`,
  );
  ok(
    "a code reads back exactly",
    JSON.stringify(await decodeSignal(text)) === JSON.stringify(sig),
  );
  ok(
    "a code survives line breaks and spaces from copying",
    JSON.stringify(
      await decodeSignal(`  ${text.slice(0, 60)}\n${text.slice(60)}\n`),
    ) === JSON.stringify(sig),
  );
  ok(
    "tcp candidates are removed to keep the code short",
    !stripSdp(SDP).includes("tcptype") && stripSdp(SDP).includes("typ host"),
  );
  ok(
    "the certificate fingerprint is found",
    sdpFingerprint(SDP) ===
      "sha-256 DA:9C:EC:36:16:CD:85:E0:68:0A:5E:81:78:14:C2:60:D6:C3:AA:A6:5B:20:03:3B:74:93:89:62:E5:EB:98:6A" &&
      sdpFingerprint("v=0") === null,
  );
  ok(
    "the facility tag is stable and differs between clinics",
    (await facilityTag("fac-1")) === sig.fac &&
      (await facilityTag("fac-2")) !== sig.fac &&
      /^[0-9a-f]{8}$/.test(sig.fac),
  );
  for (const [name, bad] of [
    ["plain text", "hello"],
    ["wrong marker", "PS2." + text.slice(4)],
    ["marker only", SIGNAL_PREFIX],
    ["garbage after the marker", SIGNAL_PREFIX + "!!!!"],
    ["too long", SIGNAL_PREFIX + "A".repeat(MAX_SIGNAL_CHARS)],
  ] as const) {
    ok(
      `a bad code is refused: ${name}`,
      (await decodeSignal(bad).then(
        () => "accepted",
        (e) => e.name,
      )) === "SignalError",
    );
  }
  ok(
    "a code with a missing or wrong field is refused",
    (
      await Promise.all(
        [
          { ...sig, v: 2 },
          { ...sig, kind: "x" },
          { ...sig, sid: "a" },
          { ...sig, fac: "ZZZZZZZZ" },
          { ...sig, sdp: "hello" },
          { ...sig, sdp: "v=0" + "x".repeat(9000) },
          { ...sig, sdp: undefined },
        ].map(async (o) =>
          decodeSignal(SIGNAL_PREFIX + (await zip(JSON.stringify(o)))).then(
            () => "accepted",
            () => "refused",
          ),
        ),
      )
    ).every((r) => r === "refused"),
  );
  const bomb =
    SIGNAL_PREFIX +
    (await zip(JSON.stringify({ ...sig, sdp: "v=0" + " ".repeat(2_000_000) })));
  ok(
    "a small code that unpacks to something huge is refused (a zip bomb)",
    bomb.length < MAX_SIGNAL_CHARS &&
      (await decodeSignal(bomb).then(
        () => "accepted",
        (e) => e.name,
      )) === "SignalError",
    `${bomb.length} characters`,
  );

  /* ===================== the clinic key proof ===================== */
  const n1 = randomToken(),
    n2 = randomToken();
  const proof = await makeProof(KEY, "host", "bind", n1, n2);
  ok(
    "a proof from the right key checks out",
    await checkProof(KEY, proof, "host", "bind", n1, n2),
  );
  ok(
    "a proof from another key is refused",
    !(await checkProof(randomToken(32), proof, "host", "bind", n1, n2)),
  );
  ok(
    "a proof cannot be handed back as the other side's (no echo)",
    !(await checkProof(KEY, proof, "guest", "bind", n1, n2)),
  );
  ok(
    "a proof for other scanned codes is refused (no relay)",
    !(await checkProof(KEY, proof, "host", "other", n1, n2)),
  );
  ok(
    "an old proof is refused when the random numbers are new",
    !(await checkProof(KEY, proof, "host", "bind", randomToken(), n2)) &&
      !(await checkProof(KEY, proof, "host", "bind", n1, randomToken())),
  );
  ok(
    "garbage in place of a proof is refused, not crashed on",
    !(await checkProof(KEY, "%%%", "host", "bind", n1, n2)) &&
      !(await checkProof("!!!", proof, "host", "bind", n1, n2)),
  );
  ok(
    "random numbers are different every time",
    new Set(Array.from({ length: 200 }, () => randomToken())).size === 200,
  );

  /* ===================== what is accepted ===================== */
  const ctx = { facilityId: FAC, now: NOW };
  const good = rec("p1", NOW - 1000, {
    fullName: "Ngozi",
    village: "Ugwu",
    isPregnant: false,
    age: 3,
  });
  ok(
    "a good record is accepted",
    validateRecord("patients", good, ctx)?.id === "p1",
  );
  const bad = (table: TableName, r: unknown) =>
    validateRecord(table, r, ctx) === null;
  ok(
    "a record from another clinic is refused",
    bad("patients", { ...good, facilityId: "fac-2" }),
  );
  ok(
    "a record dated tomorrow is refused (it would beat every honest edit)",
    bad("patients", { ...good, updatedAt: NOW + MAX_AHEAD + 60_000 }) &&
      !bad("patients", { ...good, updatedAt: NOW + 3_600_000 }),
  );
  ok(
    "a record from before 2020, or with no date, is refused",
    bad("patients", { ...good, updatedAt: MIN_TIME - 1 }) &&
      bad("patients", { ...good, updatedAt: undefined }) &&
      bad("patients", { ...good, createdAt: "yesterday" }),
  );
  ok(
    "a nested object or a list is refused",
    bad("patients", { ...good, extra: { a: 1 } }) &&
      bad("patients", { ...good, extra: [1] }),
  );
  ok(
    "a field named __proto__ or constructor is refused",
    bad(
      "patients",
      JSON.parse(
        `{"id":"p1","facilityId":"${FAC}","createdAt":${NOW},"updatedAt":${NOW},"__proto__":{"admin":true}}`,
      ),
    ) && bad("patients", { ...good, constructor: "x" }),
  );
  ok(
    "an odd field name is refused",
    bad("patients", { ...good, "a b": 1 }) &&
      bad("patients", { ...good, "<script>": 1 }),
  );
  ok(
    "a huge text, a number that is not a number, or too many fields is refused",
    bad("patients", { ...good, note: "x".repeat(4001) }) &&
      bad("patients", { ...good, n: NaN }) &&
      bad("patients", { ...good, n: 1e20 }) &&
      bad("patients", {
        ...good,
        ...Object.fromEntries(
          Array.from({ length: 61 }, (_, i) => [`f${i}`, 1]),
        ),
      }),
  );
  ok(
    "an id that is not an id is refused",
    bad("patients", { ...good, id: "../etc" }) &&
      bad("patients", { ...good, id: "" }) &&
      bad("patients", { ...good, id: "a".repeat(201) }) &&
      !bad("reminders", {
        ...good,
        id: "visit:abc-123:2026-11-01",
        patientId: "p1",
      }),
  );
  ok(
    "a visit, vaccine or reminder with no patient is refused",
    bad("visits", good) &&
      bad("immunizations", good) &&
      bad("reminders", good) &&
      !bad("visits", { ...good, patientId: "p1" }),
  );
  ok(
    "things that are not records are refused",
    bad("patients", null) &&
      bad("patients", "x") &&
      bad("patients", [good]) &&
      bad("patients", 5),
  );
  ok(
    "a clean copy is returned, with empty values dropped",
    !Object.keys(
      validateRecord(
        "patients",
        { ...good, phone: null, nok: undefined },
        ctx,
      )!,
    ).includes("phone"),
  );

  /* ===================== which copy wins ===================== */
  const world: ([number, boolean] | null)[] = [
    null,
    [1, false],
    [2, false],
    [3, false],
    [1, true],
    [2, true],
  ];
  let consistent = true;
  let comparisons = 0;
  for (const local of world)
    for (const incoming of world) {
      if (!incoming) continue;
      const l = local
        ? { updatedAt: local[0], erasedAt: local[1] ? local[0] : undefined }
        : undefined;
      const i = {
        updatedAt: incoming[0],
        erasedAt: incoming[1] ? incoming[0] : undefined,
      };
      const sends = shouldSend(
        ["x", incoming[0], incoming[1] ? 1 : 0],
        local ? [local[0], local[1] ? 1 : 0] : undefined,
      );
      const applies = decide(l, i) !== "skip";
      comparisons++;
      if (sends !== applies) {
        consistent = false;
        console.log("   mismatch", { local, incoming, sends, applies });
      }
    }
  ok(
    `the sender and the receiver always agree on what is worth sending (${comparisons} cases)`,
    consistent,
  );
  ok(
    "newer wins, equal is left alone, older is ignored",
    decide({ updatedAt: 5 }, { updatedAt: 6 }) === "update" &&
      decide({ updatedAt: 5 }, { updatedAt: 5 }) === "skip" &&
      decide({ updatedAt: 5 }, { updatedAt: 4 }) === "skip" &&
      decide(undefined, { updatedAt: 1 }) === "add",
  );
  ok(
    "an erased record is never brought back, and an erasure always wins",
    decide({ updatedAt: 9, erasedAt: 9 }, { updatedAt: 99 }) === "skip" &&
      decide({ updatedAt: 99 }, { updatedAt: 1, erasedAt: 1 }) === "update",
  );

  /* ===================== groups of records ===================== */
  const e1: Entry[] = [
    ["a", 1, 0],
    ["b", 2, 0],
    ["c", 3, 1],
  ];
  ok(
    "the fingerprint does not depend on the order",
    (await digestOf(e1)).h === (await digestOf([...e1].reverse())).h,
  );
  ok(
    "the fingerprint changes when a time, an erasure or a record changes",
    new Set([
      (await digestOf(e1)).h,
      (
        await digestOf([
          ["a", 1, 0],
          ["b", 3, 0],
          ["c", 3, 1],
        ])
      ).h,
      (
        await digestOf([
          ["a", 1, 0],
          ["b", 2, 0],
          ["c", 3, 0],
        ])
      ).h,
      (
        await digestOf([
          ["a", 1, 0],
          ["b", 2, 0],
        ])
      ).h,
    ]).size === 4,
  );
  const dd = await digestOf(e1);
  ok(
    "an empty list has a fingerprint, and the groups are 256",
    dd.b.length === 256 && (await digestOf([])).n === 0,
  );
  const spread = new Map<number, number>();
  for (let i = 0; i < 10_000; i++) {
    const b = bucketOf(crypto.randomUUID());
    spread.set(b, (spread.get(b) ?? 0) + 1);
  }
  ok(
    "records spread evenly over the 256 groups",
    spread.size === 256 && Math.max(...spread.values()) < 80,
    `largest group ${Math.max(...spread.values())} of about 39`,
  );
  const rb = new Map<number, number>();
  for (let i = 0; i < 2000; i++) {
    const b = bucketOf(`visit:${crypto.randomUUID()}:2026-11-01`);
    rb.set(b, (rb.get(b) ?? 0) + 1);
  }
  ok(
    "reminder ids (which all start the same way) spread evenly too",
    rb.size > 240,
    `${rb.size} groups used`,
  );

  /* ===================== two phones talking ===================== */
  let a = phone(),
    b = phone();
  let r = await sync(a, b);
  ok(
    "two empty phones agree there is nothing to do",
    code(r.a) === "ok" && code(r.b) === "ok" && value(r.a).sent === 0,
  );

  a = phone({
    patients: Array.from({ length: 50 }, (_, i) =>
      rec(`pa${i}`, NOW - 5000 - i),
    ),
    visits: Array.from({ length: 80 }, (_, i) =>
      rec(`va${i}`, NOW - 4000, { patientId: `pa${i % 50}` }),
    ),
  });
  b = phone();
  r = await sync(a, b);
  ok(
    "a full phone and an empty phone: the empty one receives everything",
    code(r.a) === "ok" &&
      b.count("patients") === 50 &&
      b.count("visits") === 80 &&
      same(a, b),
  );
  ok(
    "the summary says what was sent and received, and who the other phone was",
    value(r.a).sent === 130 &&
      value(r.b).received.added === 130 &&
      value(r.a).received.added === 0 &&
      value(r.a).peer.name === "Bola's phone" &&
      value(r.b).peer.user === "Ada",
  );
  ok(
    "everything received is queued to go to the cloud",
    b.queue.length === 130 && a.queue.length === 0,
  );

  r = await sync(a, b);
  ok(
    "syncing again when nothing changed sends nothing and takes only a few messages",
    value(r.a).sent === 0 && value(r.b).sent === 0 && r.l.wire.frames <= 14,
    `${r.l.wire.frames} messages`,
  );

  a = phone({
    patients: [rec("only-a", NOW - 1000)],
    guardians: [rec("g1", NOW - 1000)],
  });
  b = phone({
    patients: [rec("only-b", NOW - 2000)],
    visits: [rec("v1", NOW - 500, { patientId: "only-b" })],
  });
  await sync(a, b);
  ok(
    "each phone has records the other lacks: both end with everything",
    same(a, b) &&
      a.count("patients") === 2 &&
      b.count("guardians") === 1 &&
      a.count("visits") === 1,
  );

  a = phone({
    patients: [
      rec("c1", NOW - 5000, { village: "A-old" }),
      rec("c2", NOW - 1000, { village: "A-new" }),
      rec("c3", NOW - 3000, { village: "same" }),
    ],
  });
  b = phone({
    patients: [
      rec("c1", NOW - 2000, { village: "B-new" }),
      rec("c2", NOW - 4000, { village: "B-old" }),
      rec("c3", NOW - 3000, { village: "same" }),
    ],
  });
  await sync(a, b);
  ok(
    "when both changed the same record, the newer change wins on both phones",
    a.get("patients", "c1")!.village === "B-new" &&
      b.get("patients", "c1")!.village === "B-new" &&
      a.get("patients", "c2")!.village === "A-new" &&
      b.get("patients", "c2")!.village === "A-new",
  );
  ok(
    "a record that is the same on both is not touched or queued",
    a.queue.every((q) => q.id !== "c3") &&
      b.queue.every((q) => q.id !== "c3") &&
      a.queue.length === 1 &&
      b.queue.length === 1,
  );

  const erased = rec("e1", NOW - 3000, {
    fullName: "[erased]",
    erasedAt: NOW - 3000,
  });
  a = phone({ patients: [erased] });
  b = phone({ patients: [rec("e1", NOW - 100, { fullName: "Ngozi Eze" })] });
  await sync(a, b);
  ok(
    "an erasure reaches the other phone even when its copy is newer",
    b.get("patients", "e1")!.erasedAt !== undefined &&
      b.get("patients", "e1")!.fullName === "[erased]" &&
      a.get("patients", "e1")!.fullName === "[erased]",
  );
  a = phone({ patients: [erased] });
  b = phone();
  await sync(a, b);
  const c = phone({
    patients: [rec("e1", NOW - 10, { fullName: "Ngozi Eze" })],
  });
  await sync(b, c);
  await sync(c, a);
  ok(
    "an old phone cannot bring an erased patient back, even after passing through others",
    [a, b, c].every(
      (p) =>
        p.get("patients", "e1")!.erasedAt !== undefined &&
        p.get("patients", "e1")!.fullName === "[erased]",
    ),
  );

  const mk = (n: number, tag: string) =>
    Array.from({ length: n }, (_, i) => rec(`${tag}${i}`, NOW - 1000 - i));
  const A = phone({ patients: mk(30, "A") }),
    B = phone({ patients: mk(30, "B") }),
    C = phone({ patients: mk(30, "C") });
  await sync(A, B);
  await sync(B, C);
  await sync(A, B);
  ok(
    "three phones passing records along a chain end up identical",
    same(A, B) && same(B, C) && A.count("patients") === 90,
  );
  ok(
    "records that came through a middle phone are queued on it for the cloud",
    B.queue.filter((q) => q.id.startsWith("A")).length === 30 &&
      B.queue.filter((q) => q.id.startsWith("C")).length === 30,
  );

  /* ---- a bigger clinic ---- */
  const big = phone({
    patients: Array.from({ length: 6000 }, (_, i) =>
      rec(`bp${i}-${crypto.randomUUID()}`, NOW - 60_000 - i),
    ),
    visits: Array.from({ length: 24_000 }, (_, i) =>
      rec(`bv${i}-${crypto.randomUUID()}`, NOW - 50_000 - i, {
        patientId: "x",
        complaints: "Fever and headache for three days",
      }),
    ),
  });
  const some = phone({
    patients: [...big.tables.get("patients")!.values()]
      .slice(0, 3000)
      .map((x) => structuredClone(x)),
  });
  const t0 = Date.now();
  const rb2 = await sync(big, some);
  const ms = Date.now() - t0;
  ok(
    "a clinic with 30,000 records syncs correctly",
    code(rb2.a) === "ok" &&
      same(big, some) &&
      some.count("visits") === 24_000 &&
      some.count("patients") === 6000,
    `${ms} ms, ${(rb2.l.wire.bytes / 1_000_000).toFixed(1)} MB`,
  );
  ok(
    "no message is bigger than the agreed size",
    rb2.l.wire.sent.every((t) => t.length < PEER_LIMITS.chunk + 6000),
    `largest ${Math.max(...rb2.l.wire.sent.map((t) => t.length))}`,
  );
  const small = phone({
    patients: [...big.tables.get("patients")!.values()].map((x) =>
      structuredClone(x),
    ),
    visits: [...big.tables.get("visits")!.values()].map((x) =>
      structuredClone(x),
    ),
  });
  const tweak = [...small.tables.get("patients")!.values()][17];
  tweak.updatedAt += 5000;
  tweak.village = "Changed";
  const rs = await sync(big, small);
  ok(
    "when two big phones differ by one record, only that record travels",
    value(rs.a).sent + value(rs.b).sent === 1 && rs.l.wire.bytes < 120_000,
    `${(rs.l.wire.bytes / 1000).toFixed(0)} KB for 30,000 records`,
  );

  /* ---- who is allowed in ---- */
  r = await sync(phone({ patients: [rec("s1", NOW - 1000)] }), phone(), {
    y: { key: randomToken(32) },
  });
  ok(
    "a phone with another clinic key is refused on both sides, and nothing is sent",
    code(r.a) === "auth" &&
      code(r.b) === "auth" &&
      !r.l.wire.sent.some((t) => t.includes('"records"')),
  );
  r = await sync(phone(), phone(), {
    binding: ["session|fpH|fpG", "session|fpH|OTHER"],
  });
  ok(
    "a link that is not the one the codes described is refused (no man in the middle)",
    code(r.a) === "auth" && code(r.b) === "auth",
  );
  r = await sync(phone(), phone(), { y: { fac: "99999999" } });
  ok(
    "a phone from another clinic is refused straight away",
    code(r.a) === "facility" && code(r.b) === "facility",
  );
  r = await sync(phone(), phone(), { x: { kv: 5 }, y: { kv: 3 } });
  ok(
    "a newer key on one side: the phone with the older key is told it is the one to update",
    code(r.a) === "key-there" && code(r.b) === "key-here",
  );
  r = await sync(phone(), phone(), { x: { kv: 3 }, y: { kv: 5 } });
  ok(
    "and the same the other way round",
    code(r.a) === "key-here" && code(r.b) === "key-there",
  );

  const skewed = async (minutes: number) => {
    const l = linkPair();
    const x = runPeerSync(l.a, phone().store, {
      role: "host",
      self: me("Ada"),
      binding: "s",
      now: () => Date.now(),
    });
    const y = runPeerSync(l.b, phone().store, {
      role: "guest",
      self: me("Bola"),
      binding: "s",
      now: () => Date.now() + minutes * 60_000,
    });
    return Promise.allSettled([x, y]);
  };
  let [sa, sb] = await skewed(11);
  ok(
    "clocks 11 minutes apart: refused on both phones, with the difference",
    code(sa) === "clock" &&
      code(sb) === "clock" &&
      (sa as PromiseRejectedResult).reason.detail > 10 * 60_000,
  );
  [sa, sb] = await skewed(9);
  ok("clocks 9 minutes apart: allowed", code(sa) === "ok" && code(sb) === "ok");

  /* ---- a phone that cheats ---- */
  const cheat = await (async () => {
    const l = linkPair();
    const x = runPeerSync(
      l.a,
      phone({ patients: [rec("t1", NOW - 1000)] }).store,
      { role: "host", self: me("Ada"), binding: "s" },
    );
    // the other side never learns the key, but copies the host's proof back as its own
    let echoed = "";
    l.b.onMessage((t) => {
      const m = JSON.parse(t);
      if (m.t === "hello")
        void l.b.send(
          JSON.stringify({
            t: "hello",
            v: 1,
            dev: "x",
            name: "x",
            user: "x",
            fac: "abcd1234",
            kv: 3,
            now: Date.now(),
            nonce: "abcdefgh12345",
          }),
        );
      if (m.t === "auth") {
        echoed = m.proof;
        void l.b.send(JSON.stringify({ t: "auth", proof: echoed }));
      }
    });
    return Promise.allSettled([x]);
  })();
  ok(
    "a phone that copies the host's own proof back is refused",
    code(cheat[0]) === "auth",
  );

  const hostile = phone({
    patients: [
      rec("ok1", NOW - 100),
      { ...rec("bad1", NOW - 100), facilityId: "other-clinic" },
      rec("bad2", NOW + 10 * MAX_AHEAD),
      { ...rec("bad3", NOW - 100), nested: { a: 1 } } as Rec,
    ],
  });
  const victim = phone({
    patients: [rec("mine", NOW - 100, { village: "Safe" })],
  });
  const rh = await sync(hostile, victim);
  ok(
    "a phone with the right key still cannot sneak in records from another clinic, from the future, or with odd fields",
    value(rh.b).received.added === 1 &&
      value(rh.b).received.rejected === 3 &&
      victim.count("patients") === 2 &&
      !victim.get("patients", "bad1") &&
      !victim.get("patients", "bad2") &&
      victim.get("patients", "mine")!.village === "Safe",
  );

  /* ---- broken conversations ---- */
  const garble = (n: number): Wire => {
    let i = 0;
    return {
      bytes: 0,
      frames: 0,
      sent: [],
      onSend: (from, t) => (from === "a" && ++i === n ? "{not json" : t),
    };
  };
  r = await sync(phone(), phone(), { wire: garble(3) });
  ok(
    "a message that is not readable ends the sync with a clear reason",
    code(r.b) === "protocol",
  );
  const wrongOrder: Wire = {
    bytes: 0,
    frames: 0,
    sent: [],
    onSend: (from, t) =>
      from === "a" && JSON.parse(t).t === "digest"
        ? JSON.stringify({ t: "records", table: "patients", items: [] })
        : t,
  };
  r = await sync(phone(), phone(), { wire: wrongOrder });
  ok("a message at the wrong moment ends the sync", code(r.b) === "protocol");
  const huge: Wire = {
    bytes: 0,
    frames: 0,
    sent: [],
    onSend: (from, t) =>
      from === "a" && JSON.parse(t).t === "digest"
        ? "x".repeat(PEER_LIMITS.frame + 1)
        : t,
  };
  r = await sync(phone(), phone(), { wire: huge });
  ok("a message bigger than allowed ends the sync", code(r.b) === "too-big");
  let spoken = 0;
  const dropped: Wire = {
    bytes: 0,
    frames: 0,
    sent: [],
    onSend: (from, t) => (from === "a" && ++spoken > 2 ? null : t),
  }; // says hello and proves itself, then goes quiet
  r = await sync(phone(), phone(), { wire: dropped, idleMs: 300 });
  ok(
    "a phone that goes quiet in the middle is given up on, and the waiting phone says why",
    code(r.b) === "timeout",
    `host: ${code(r.a)}, guest: ${code(r.b)}`,
  );
  const ctl = new AbortController();
  const slow = sync(phone({ patients: mk(10, "z") }), phone(), {
    xSignal: ctl.signal,
    wire: {
      bytes: 0,
      frames: 0,
      sent: [],
      onSend: (_f, t) => (JSON.parse(t).t === "digest" ? null : t),
    },
    idleMs: 5000,
  });
  setTimeout(() => ctl.abort(), 100);
  r = await slow;
  ok("pressing Cancel stops it at once", code(r.a) === "cancelled");

  /* ---- a link that drops, then a second try ---- */
  const src = phone({
    patients: Array.from({ length: 3000 }, (_, i) =>
      rec(`d${i}`, NOW - 1000 - i, { note: "x".repeat(300) }),
    ),
  });
  const dst = phone();
  let count = 0;
  const cut = linkPair({
    bytes: 0,
    frames: 0,
    sent: [],
    onSend: (from, t) =>
      from === "a" && JSON.parse(t).t === "records" && ++count === 6 ? null : t,
  });
  const half = Promise.allSettled([
    runPeerSync(cut.a, src.store, {
      role: "host",
      self: me("Ada"),
      binding: "s",
      idleMs: 500,
    }),
    runPeerSync(cut.b, dst.store, {
      role: "guest",
      self: me("Bola"),
      binding: "s",
      idleMs: 500,
    }),
  ]);
  const [h1, h2] = await half;
  const partial = dst.count("patients");
  ok(
    "a sync that is cut half way keeps what had already arrived",
    code(h2) !== "ok" && partial > 0 && partial < 3000,
    `${partial} of 3000 arrived`,
  );
  r = await sync(src, dst);
  ok(
    "trying again finishes the job, and sends only what is still missing",
    code(r.a) === "ok" &&
      dst.count("patients") === 3000 &&
      value(r.a).sent === 3000 - partial &&
      same(src, dst),
    `${value(r.a).sent} sent the second time`,
  );
  void h1;

  console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
  process.exit(failed ? 1 : 0);
})();
