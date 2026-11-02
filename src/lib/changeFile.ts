// A file of changes, for two phones that cannot reach each other over Wi-Fi (some routers stop phones from talking).
// It is sent any way you like: WhatsApp, Bluetooth, a cable, a memory stick. Nobody who gets the file by accident can
// read it: it is locked with the clinic key, and opening it needs the same key, so only phones of this clinic can.
//
//   "PRIMASYNC1\n"  the marker
//   2 bytes         length of the header
//   header          plain text (JSON): which clinic (a short tag), which key version, when, how many records
//   16 bytes        a random salt for this file
//   12 bytes        a random number used once for the lock
//   the rest        the records, compressed and then locked (AES-GCM). The header is part of what is checked, so
//                   changing the header, or anything else in the file, makes it refuse to open.
import { fromB64 } from "./peerAuth";
import type { ApplyResult, Rec, Store, TableName } from "./peerProtocol";
import { TABLES } from "./peerValidate";

export const FILE_MAGIC = "PRIMASYNC1\n";
export const FILE_EXT = ".primasync";
export const FILE_MAX_BYTES = 40 * 1024 * 1024; // the biggest file accepted
const MAX_PLAIN = 100 * 1024 * 1024; // the most it may unpack to
export const MAX_FILE_RECORDS = 500_000;

const enc = new TextEncoder();
const dec = new TextDecoder();
const MAGIC = enc.encode(FILE_MAGIC);

export interface FileHeader {
  v: 1;
  fac: string; // a short tag of the clinic
  kv: number; // the version of the clinic key that locked the file
  at: number; // when the file was made (the maker's clock)
  n: number; // how many records
}

export type Tables = Record<TableName, Rec[]>;
export type Period = "7d" | "30d" | "all";
export const PERIOD_MS: Record<Period, number | null> = {
  "7d": 7 * 86_400_000,
  "30d": 30 * 86_400_000,
  all: null,
};

/* ---------- compression, with a limit on how much it may unpack to ---------- */

async function gzip(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(
  bytes: Uint8Array<ArrayBuffer>,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const reader = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) {
      await reader.cancel();
      throw new Error("too big");
    }
    parts.push(value);
  }
  const all = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    all.set(p, at);
    at += p.length;
  }
  return all;
}

/* ---------- the lock ---------- */

async function lockKey(
  clinicKey: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    fromB64(clinicKey),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info: enc.encode("prima-changes-v1"),
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

const be16 = (n: number) => new Uint8Array([n >> 8, n & 255]);

export interface SealContext {
  key: string; // the clinic key
  kv: number;
  fac: string;
  now: number;
}

// Packs bytes into a locked file (used by sealChanges, and by the tests for odd contents)
export async function sealBytes(
  plain: Uint8Array<ArrayBuffer>,
  n: number,
  ctx: SealContext,
): Promise<Uint8Array<ArrayBuffer>> {
  const header: FileHeader = { v: 1, fac: ctx.fac, kv: ctx.kv, at: ctx.now, n };
  const headerBytes = enc.encode(JSON.stringify(header));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aad = new Uint8Array([...MAGIC, ...headerBytes]);
  const locked = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad },
      await lockKey(ctx.key, salt),
      await gzip(plain),
    ),
  );
  const out = new Uint8Array(
    MAGIC.length + 2 + headerBytes.length + 16 + 12 + locked.length,
  );
  let at = 0;
  for (const part of [
    MAGIC,
    be16(headerBytes.length),
    headerBytes,
    salt,
    iv,
    locked,
  ]) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

export async function sealChanges(
  tables: Tables,
  ctx: SealContext,
): Promise<Uint8Array<ArrayBuffer>> {
  const n = TABLES.reduce((sum, t) => sum + tables[t].length, 0);
  return sealBytes(enc.encode(JSON.stringify(tables)), n, ctx);
}

/* ---------- reading what to put in the file ---------- */

// Everything changed since `since` (or everything, when null). Erasures are always included, however old,
// because an erasure that did not travel would leave a patient's data alive on the other phone.
export async function collectChanges(
  store: Store,
  since: number | null,
): Promise<Tables> {
  const out = Object.fromEntries(
    TABLES.map((t) => [t, [] as Rec[]]),
  ) as unknown as Tables;
  for (const table of TABLES) {
    const ids = (await store.index(table))
      .filter((e) => since === null || e[1] >= since || e[2] === 1)
      .map((e) => e[0]);
    for (let i = 0; i < ids.length; i += 200)
      out[table].push(...(await store.read(table, ids.slice(i, i + 200))));
  }
  return out;
}

/* ---------- opening a file ---------- */

export type OpenFailure =
  | "notPrima" // not one of our files, or cut short
  | "tooBig"
  | "facility" // made by another clinic
  | "keyHere" // this phone's clinic key is older than the file's: connect to the internet once
  | "keyThere" // the file was made with an older key: its maker must connect once and make it again
  | "corrupt"; // changed on the way, or locked with another key

export type Opened =
  | { ok: true; header: FileHeader; tables: Record<TableName, unknown[]> }
  | { ok: false; reason: OpenFailure };

export interface OpenContext {
  key: string;
  kv: number;
  fac: string;
}

export async function openChanges(
  bytes: Uint8Array<ArrayBuffer>,
  ctx: OpenContext,
): Promise<Opened> {
  const no = (reason: OpenFailure): Opened => ({ ok: false, reason });
  if (bytes.length > FILE_MAX_BYTES) return no("tooBig");
  const fixed = MAGIC.length + 2;
  if (bytes.length < fixed + 2 + 16 + 12 + 16) return no("notPrima");
  for (let i = 0; i < MAGIC.length; i++)
    if (bytes[i] !== MAGIC[i]) return no("notPrima");

  const headerLen = (bytes[MAGIC.length] << 8) | bytes[MAGIC.length + 1];
  if (
    headerLen < 10 ||
    headerLen > 400 ||
    fixed + headerLen + 16 + 12 + 16 > bytes.length
  )
    return no("notPrima");
  const headerBytes = bytes.slice(fixed, fixed + headerLen);
  let header: FileHeader;
  try {
    const h = JSON.parse(dec.decode(headerBytes)) as Partial<FileHeader>;
    if (
      h.v !== 1 ||
      typeof h.fac !== "string" ||
      !/^[0-9a-f]{8}$/.test(h.fac) ||
      !Number.isInteger(h.kv) ||
      typeof h.at !== "number" ||
      !Number.isInteger(h.n)
    )
      return no("notPrima");
    header = h as FileHeader;
  } catch {
    return no("notPrima");
  }
  if (header.fac !== ctx.fac) return no("facility");
  if (header.kv > ctx.kv) return no("keyHere");
  if (header.kv < ctx.kv) return no("keyThere");

  const at = fixed + headerLen;
  const salt = bytes.slice(at, at + 16);
  const iv = bytes.slice(at + 16, at + 28);
  const locked = bytes.slice(at + 28);
  const aad = new Uint8Array([...MAGIC, ...headerBytes]);
  let plain: Uint8Array<ArrayBuffer>;
  try {
    const unlocked = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, additionalData: aad },
        await lockKey(ctx.key, salt),
        locked,
      ),
    );
    plain = await gunzip(unlocked, MAX_PLAIN);
  } catch (e) {
    return no((e as Error).message === "too big" ? "tooBig" : "corrupt");
  }
  try {
    const parsed = JSON.parse(dec.decode(plain)) as Record<string, unknown>;
    const tables = {} as Record<TableName, unknown[]>;
    let n = 0;
    for (const t of TABLES) {
      const rows = parsed[t];
      if (!Array.isArray(rows)) return no("corrupt");
      n += rows.length;
      tables[t] = rows;
    }
    if (n > MAX_FILE_RECORDS) return no("tooBig");
    return { ok: true, header, tables };
  } catch {
    return no("corrupt");
  }
}

export interface ImportResult extends ApplyResult {
  byTable: Record<TableName, number>;
}

// Saves what a file holds, with the same checks and the same "newest wins" rule as syncing with a phone
export async function importChanges(
  store: Store,
  tables: Record<TableName, unknown[]>,
): Promise<ImportResult> {
  const total: ImportResult = {
    added: 0,
    updated: 0,
    skipped: 0,
    rejected: 0,
    byTable: Object.fromEntries(TABLES.map((t) => [t, 0])) as Record<
      TableName,
      number
    >,
  };
  for (const table of TABLES) {
    const rows = tables[table];
    for (let i = 0; i < rows.length; i += 1000) {
      const r = await store.apply(table, rows.slice(i, i + 1000));
      total.added += r.added;
      total.updated += r.updated;
      total.skipped += r.skipped;
      total.rejected += r.rejected;
      total.byTable[table] += r.added + r.updated;
    }
  }
  return total;
}

export const fileName = (now: number) => {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, "0");
  return `prima-changes-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${FILE_EXT}`;
};
