import { randomToken } from "../src/lib/peerAuth";
import { facilityTag } from "../src/lib/peerCodec";
import {
  BOOK_MAX,
  isStale,
  noteSync,
  parseBook,
  STALE_AFTER,
  type PeerEntry,
} from "../src/lib/peerBook";
import {
  FILE_EXT,
  FILE_MAGIC,
  FILE_MAX_BYTES,
  PERIOD_MS,
  collectChanges,
  fileName,
  importChanges,
  openChanges,
  sealBytes,
  sealChanges,
  type SealContext,
} from "../src/lib/changeFile";
import {
  TABLES,
  type ApplyResult,
  type Rec,
  type Store,
  type TableName,
} from "../src/lib/peerProtocol";
import { decide, validateRecord, type Entry } from "../src/lib/peerValidate";

let failed = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
  if (!cond) failed++;
};

const NOW = Date.now();
const DAY = 86_400_000;
const FAC = "fac-1";
const rec = (
  id: string,
  updatedAt: number,
  extra: Record<string, unknown> = {},
): Rec => ({
  id,
  facilityId: FAC,
  createdAt: NOW - 100 * DAY,
  updatedAt,
  ...extra,
});

function phone(initial: Partial<Record<TableName, Rec[]>> = {}) {
  const tables = new Map<TableName, Map<string, Rec>>(
    TABLES.map((t) => [
      t,
      new Map((initial[t] ?? []).map((r) => [r.id, structuredClone(r)])),
    ]),
  );
  const queue: string[] = [];
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
        const r = validateRecord(t, raw, { facilityId: FAC, now: Date.now() });
        if (!r) {
          res.rejected++;
          continue;
        }
        const d = decide(tables.get(t)!.get(r.id), r);
        if (d === "skip") {
          res.skipped++;
          continue;
        }
        tables.get(t)!.set(r.id, r);
        queue.push(`${t}:${r.id}`);
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

const KEY = randomToken(32);
const tag = await facilityTag(FAC);
const ctx = (over: Partial<SealContext> = {}): SealContext => ({
  key: KEY,
  kv: 3,
  fac: tag,
  now: NOW,
  ...over,
});
const open = (
  bytes: Uint8Array<ArrayBuffer>,
  over: Partial<{ key: string; kv: number; fac: string }> = {},
) => openChanges(bytes, { key: KEY, kv: 3, fac: tag, ...over });
const reason = (r: Awaited<ReturnType<typeof open>>) =>
  r.ok ? "ok" : r.reason;

/* ---------- a file made on one phone and opened on another ---------- */
const a = phone({
  patients: [
    rec("p1", NOW - 1 * DAY, {
      fullName: "Ngozi Chidinma Eze",
      village: "Ugwuoba",
    }),
    rec("p2", NOW - 20 * DAY, { fullName: "Old Record" }),
    rec("gone", NOW - 90 * DAY, {
      fullName: "[erased]",
      erasedAt: NOW - 90 * DAY,
    }),
  ],
  visits: [
    rec("v1", NOW - 1 * DAY, {
      patientId: "p1",
      complaints: "Fever and headache",
    }),
  ],
  guardians: [rec("g1", NOW - 10 * DAY, { fullName: "Mama Eze" })],
});
const everything = await collectChanges(a.store, PERIOD_MS.all);
const file = await sealChanges(everything, ctx());
ok(
  "a file starts with the Prima marker and has the agreed ending in its name",
  new TextDecoder().decode(file.slice(0, FILE_MAGIC.length)) === FILE_MAGIC &&
    fileName(NOW).endsWith(FILE_EXT) &&
    /^prima-changes-\d{4}-\d{2}-\d{2}-\d{4}\.primasync$/.test(fileName(NOW)),
);
const text = new TextDecoder("latin1").decode(file);
ok(
  "nothing readable is in the file: no names, villages or complaints",
  !/Ngozi|Ugwuoba|Fever|Mama Eze|fullName|patients/.test(text),
);
const header = JSON.parse(
  new TextDecoder().decode(
    file.slice(
      FILE_MAGIC.length + 2,
      FILE_MAGIC.length +
        2 +
        ((file[FILE_MAGIC.length] << 8) | file[FILE_MAGIC.length + 1]),
    ),
  ),
);
ok(
  "the only things visible are the clinic tag, the key version, the time and a count",
  JSON.stringify(Object.keys(header).sort()) ===
    JSON.stringify(["at", "fac", "kv", "n", "v"]) &&
    header.n === 5 &&
    header.fac === tag,
);
ok(
  "two files of the same data are different (a fresh lock each time)",
  Buffer.compare(
    Buffer.from(file),
    Buffer.from(await sealChanges(everything, ctx())),
  ) !== 0,
);

const opened = await open(file);
ok(
  "a phone of the same clinic opens it",
  opened.ok &&
    opened.header.n === 5 &&
    opened.tables.patients.length === 3 &&
    opened.tables.visits.length === 1,
);

const b = phone();
const imp = await importChanges(
  b.store,
  opened.ok ? opened.tables : ({} as never),
);
ok(
  "importing saves everything, queues it for upload, and says how many",
  imp.added === 5 &&
    imp.updated === 0 &&
    imp.rejected === 0 &&
    b.queue.length === 5 &&
    imp.byTable.patients === 3 &&
    imp.byTable.visits === 1,
);
ok(
  "the contents are the same on the second phone",
  b.get("patients", "p1")!.fullName === "Ngozi Chidinma Eze" &&
    b.get("visits", "v1")!.complaints === "Fever and headache" &&
    b.get("patients", "gone")!.erasedAt !== undefined,
);
const again = await importChanges(
  b.store,
  opened.ok ? opened.tables : ({} as never),
);
ok(
  "opening the same file a second time changes nothing and queues nothing",
  again.added === 0 &&
    again.updated === 0 &&
    again.skipped === 5 &&
    b.queue.length === 5,
);

/* ---------- who can open it ---------- */
ok(
  "a phone with another clinic key cannot open it",
  reason(await open(file, { key: randomToken(32) })) === "corrupt",
);
ok(
  "a phone of another clinic is told it is from another clinic",
  reason(await open(file, { fac: "deadbeef" })) === "facility",
);
ok(
  "a phone with an older clinic key is told to connect to the internet",
  reason(await open(file, { kv: 2 })) === "keyHere",
);
ok(
  "which side is old is said the right way round: a newer file means this phone must update, an older file means its maker must",
  reason(await open(file, { kv: 2 })) === "keyHere" &&
    reason(await open(await sealChanges(everything, ctx({ kv: 2 })))) ===
      "keyThere",
);

/* ---------- tampering and damage ---------- */
const flip = (bytes: Uint8Array<ArrayBuffer>, at: number) => {
  const c = bytes.slice();
  c[at] ^= 0x55;
  return c;
};
ok(
  "changing one byte of the records makes it refuse to open",
  reason(await open(flip(file, file.length - 20))) === "corrupt" &&
    reason(await open(flip(file, file.length - 1))) === "corrupt",
);
ok(
  "changing the header (the time, or the count) makes it refuse to open",
  reason(await open(flip(file, FILE_MAGIC.length + 2 + 30))) !== "ok",
);
ok(
  "changing the lock's own numbers makes it refuse to open",
  reason(await open(flip(file, FILE_MAGIC.length + 2 + 60))) !== "ok",
);
ok(
  "a file cut short is refused",
  reason(await open(file.slice(0, file.length - 30))) === "corrupt" &&
    reason(await open(file.slice(0, 40))) === "notPrima",
);
ok(
  "an empty file, random bytes, a text file and another kind of file are refused",
  (
    await Promise.all(
      [
        new Uint8Array(0),
        crypto.getRandomValues(new Uint8Array(500)),
        new TextEncoder().encode(
          "hello, this is not a changes file at all, it is just some words.",
        ),
        new Uint8Array([0x50, 0x4b, 3, 4, ...new Uint8Array(200)]),
      ].map((x) => open(x as Uint8Array<ArrayBuffer>)),
    )
  ).every((r) => !r.ok && r.reason === "notPrima"),
);
ok(
  "a file bigger than allowed is refused before any work is done",
  reason(await open(new Uint8Array(FILE_MAX_BYTES + 1))) === "tooBig",
);
const bomb = await sealBytes(new Uint8Array(110 * 1024 * 1024), 0, ctx());
ok(
  "a small file that unpacks to something enormous is refused (a zip bomb)",
  bomb.length < 1_000_000 && reason(await open(bomb)) === "tooBig",
  `${(bomb.length / 1000).toFixed(0)} KB`,
);
const odd = await sealBytes(
  new TextEncoder().encode(JSON.stringify({ patients: "not a list" })),
  0,
  ctx(),
);
ok(
  "a file that opens but holds the wrong shape of data is refused",
  reason(await open(odd)) === "corrupt",
);

/* ---------- a file from someone with the key who tries something ---------- */
const cheat = await sealChanges(
  {
    ...Object.fromEntries(TABLES.map((t) => [t, []])),
    patients: [
      rec("ok1", NOW - DAY),
      { ...rec("bad1", NOW - DAY), facilityId: "other-clinic" },
      rec("bad2", NOW + 30 * DAY),
      { ...rec("bad3", NOW - DAY), nested: { a: 1 } },
    ],
  } as unknown as never,
  ctx(),
);
const victim = phone({
  patients: [rec("mine", NOW - DAY, { village: "Safe" })],
});
const cheated = await open(cheat);
const ci = await importChanges(
  victim.store,
  cheated.ok ? cheated.tables : ({} as never),
);
ok(
  "records from another clinic, from the future, or with odd fields are refused even from a valid file",
  ci.added === 1 &&
    ci.rejected === 3 &&
    victim.count("patients") === 2 &&
    victim.get("patients", "mine")!.village === "Safe",
);

/* ---------- old files and erasures ---------- */
const newer = phone({
  patients: [
    rec("p1", NOW - 1000, { fullName: "Newer name", village: "Newer" }),
  ],
});
await importChanges(newer.store, opened.ok ? opened.tables : ({} as never));
ok(
  "an old file never overwrites something newer already on the phone",
  newer.get("patients", "p1")!.fullName === "Newer name",
);
const alive = phone({
  patients: [rec("gone", NOW - 1000, { fullName: "Still alive here" })],
});
await importChanges(alive.store, opened.ok ? opened.tables : ({} as never));
ok(
  "an erasure inside a file is applied, even to a newer copy",
  alive.get("patients", "gone")!.erasedAt !== undefined,
);
const erasedHere = phone({
  patients: [
    rec("p1", NOW - 5000, { fullName: "[erased]", erasedAt: NOW - 5000 }),
  ],
});
await importChanges(
  erasedHere.store,
  opened.ok ? opened.tables : ({} as never),
);
ok(
  "an erased patient is not brought back by a file",
  erasedHere.get("patients", "p1")!.fullName === "[erased]",
);

/* ---------- choosing how far back ---------- */
const week = await collectChanges(a.store, NOW - PERIOD_MS["7d"]!);
const month = await collectChanges(a.store, NOW - PERIOD_MS["30d"]!);
const ids = (t: Awaited<ReturnType<typeof collectChanges>>) =>
  t.patients
    .map((r) => r.id)
    .sort()
    .join();
ok(
  "last 7 days: only recent records, plus every erasure however old",
  ids(week) === "gone,p1" &&
    week.visits.length === 1 &&
    week.guardians.length === 0,
);
ok(
  "last 30 days adds older records",
  ids(month) === "gone,p1,p2" && month.guardians.length === 1,
);
ok("everything has everything", ids(everything) === "gone,p1,p2");
ok(
  "a smaller period makes a smaller file",
  (await sealChanges(week, ctx())).length <
    (await sealChanges(everything, ctx())).length + 1,
);

/* ---------- a bigger clinic ---------- */
const big = phone({
  patients: Array.from({ length: 8000 }, (_, i) =>
    rec(`bp${i}-${crypto.randomUUID()}`, NOW - 1000 - i, {
      fullName: `Patient ${i} Okafor`,
      village: "Awka",
      phone: "08031234567",
      complaints: "Fever, cough and headache for three days",
    }),
  ),
});
const t0 = Date.now();
const bigFile = await sealChanges(await collectChanges(big.store, null), ctx());
const bigOpen = await open(bigFile);
const bigPhone = phone();
await importChanges(
  bigPhone.store,
  bigOpen.ok ? bigOpen.tables : ({} as never),
);
ok(
  "8,000 patients make a file small enough for WhatsApp, and open correctly",
  bigOpen.ok &&
    bigPhone.count("patients") === 8000 &&
    bigFile.length < 4_000_000,
  `${(bigFile.length / 1_000_000).toFixed(2)} MB, ${Date.now() - t0} ms`,
);

/* ---------- the book of phones you have synced with ---------- */
const peer = {
  dev: "dev-b",
  name: "Android · Chrome 129 · 7F3A",
  user: "Bola",
};
let book: PeerEntry[] = [];
book = noteSync(book, peer, 3, 5, NOW);
ok(
  "the first sync adds the phone with its numbers",
  book.length === 1 &&
    book[0].sent === 3 &&
    book[0].received === 5 &&
    book[0].rounds === 1 &&
    book[0].at === NOW,
);
book = noteSync(book, peer, 1, 0, NOW + 1000);
ok(
  "syncing again adds to the totals and updates the time, without a second entry",
  book.length === 1 &&
    book[0].sent === 4 &&
    book[0].received === 5 &&
    book[0].rounds === 2 &&
    book[0].at === NOW + 1000,
);
book = noteSync(
  book,
  { dev: "dev-c", name: "iPhone · Safari 17 · A1B2", user: "Chi" },
  0,
  2,
  NOW + 2000,
);
ok(
  "the phone synced with most recently comes first",
  book.map((e) => e.dev).join() === "dev-c,dev-b",
);
book = noteSync(book, { dev: "dev-b", name: "", user: "" }, 0, 0, NOW + 3000);
ok(
  "a sync where the other phone gave no name keeps the name already known",
  book[0].dev === "dev-b" &&
    book[0].name === peer.name &&
    book[0].user === "Bola",
);
let many: PeerEntry[] = [];
for (let i = 0; i < BOOK_MAX + 8; i++)
  many = noteSync(many, { dev: `d${i}`, name: "", user: "" }, 0, 0, NOW + i);
ok(
  "the book keeps only the most recent phones",
  many.length === BOOK_MAX && many[0].dev === `d${BOOK_MAX + 7}`,
);
ok(
  "it survives being saved and read back",
  JSON.stringify(parseBook(JSON.stringify(book))) === JSON.stringify(book),
);
ok(
  "damaged or odd saved data gives an empty or cleaned book, never a crash",
  parseBook(undefined).length === 0 &&
    parseBook("{not json").length === 0 &&
    parseBook('{"a":1}').length === 0 &&
    parseBook('[{"dev":""},{"dev":5},null,{"dev":"ok","sent":-4,"at":"x"}]')
      .length === 1 &&
    parseBook('[{"dev":"ok","sent":-4,"at":"x"}]')[0].sent === 0,
);
ok(
  "a phone not synced with for more than three days is called stale",
  !isStale({ ...book[0], at: NOW - STALE_AFTER + 1000 }, NOW) &&
    isStale({ ...book[0], at: NOW - STALE_AFTER - 1000 }, NOW),
);

console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
