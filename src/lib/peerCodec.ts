// Turns a connection offer or answer into a short piece of text for a QR code, and back.
// The text holds no secret: only what two phones need to find each other. What proves they belong to the same
// clinic is checked afterwards, inside the connection (see peerAuth.ts and peerProtocol.ts).

export const SIGNAL_PREFIX = "PS1.";
export const MAX_SIGNAL_CHARS = 3500; // a QR code holding more than this cannot be read reliably off a phone screen
const MAX_INFLATED = 20_000; // a code that unpacks to more than this is refused

export interface Signal {
  v: 1;
  kind: "offer" | "answer";
  sid: string; // the session: chosen by the phone that makes the offer, repeated in the answer
  fac: string; // a short tag of the facility, so a code from another clinic is refused straight away
  sdp: string; // the connection details the browser produced
}

export class SignalError extends Error {
  constructor() {
    super("That is not a Prima code");
    this.name = "SignalError";
  }
}

const toB64u = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromB64u = (text: string) => {
  const std = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(std + "=".repeat((4 - (std.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

export async function zip(text: string): Promise<string> {
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return toB64u(new Uint8Array(await new Response(stream).arrayBuffer()));
}

// Reads at most `limit` bytes, so a tiny code cannot unpack into something huge
export async function unzip(
  text: string,
  limit = MAX_INFLATED,
): Promise<string> {
  const stream = new Blob([fromB64u(text)])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
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
  return new TextDecoder().decode(all);
}

// Tcp candidates make the code longer and are never needed on a clinic Wi-Fi
export const stripSdp = (sdp: string) =>
  sdp
    .split(/\r?\n/)
    .filter((l) => l !== "" && !l.includes("tcptype"))
    .join("\r\n") + "\r\n";

// The certificate fingerprint inside a connection description: what the encrypted link is tied to
export function sdpFingerprint(sdp: string): string | null {
  const m = /^a=fingerprint:(\S+) ([0-9A-Fa-f:]+)\s*$/m.exec(sdp);
  return m ? `${m[1].toLowerCase()} ${m[2].toUpperCase()}` : null;
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
  );
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const facilityTag = async (facilityId: string) =>
  (await sha256Hex(`prima-facility:${facilityId}`)).slice(0, 8);

export const randomSid = () =>
  toB64u(crypto.getRandomValues(new Uint8Array(9)));

export async function encodeSignal(s: Signal): Promise<string> {
  const text = SIGNAL_PREFIX + (await zip(JSON.stringify(s)));
  if (text.length > MAX_SIGNAL_CHARS) throw new Error("The code is too long");
  return text;
}

// Anything can end up in the scanner or the paste box, so every field is checked
export async function decodeSignal(raw: string): Promise<Signal> {
  const text = raw.replace(/\s+/g, "");
  if (!text.startsWith(SIGNAL_PREFIX) || text.length > MAX_SIGNAL_CHARS)
    throw new SignalError();
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(await unzip(text.slice(SIGNAL_PREFIX.length)));
  } catch {
    throw new SignalError();
  }
  const { v, kind, sid, fac, sdp } = obj ?? {};
  if (
    v !== 1 ||
    (kind !== "offer" && kind !== "answer") ||
    typeof sid !== "string" ||
    !/^[A-Za-z0-9_-]{8,32}$/.test(sid) ||
    typeof fac !== "string" ||
    !/^[0-9a-f]{8}$/.test(fac) ||
    typeof sdp !== "string" ||
    sdp.length > 8000 ||
    !sdp.startsWith("v=0")
  ) {
    throw new SignalError();
  }
  return { v, kind, sid, fac, sdp };
}
