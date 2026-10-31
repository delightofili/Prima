// Proving that two phones belong to the same clinic, without sending the clinic's secret key across.
// Each phone sends a proof: a keyed fingerprint (HMAC) of who it is, which codes were scanned and two fresh random
// numbers. A phone without the key cannot make one, and a proof cannot be replayed in another session.

const enc = new TextEncoder();

export const toB64 = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const fromB64 = (text: string) => {
  const std = text.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(std + "=".repeat((4 - (std.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

export const randomToken = (bytes = 16) =>
  toB64(crypto.getRandomValues(new Uint8Array(bytes)));

const importKey = (keyText: string) =>
  crypto.subtle.importKey(
    "raw",
    fromB64(keyText),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

export type Role = "host" | "guest";

// The proof covers: the sender's role (so a phone cannot echo the other's proof back), the two scanned codes
// (the binding), and both random numbers (so an old proof means nothing).
const message = (
  role: Role,
  binding: string,
  nonceHost: string,
  nonceGuest: string,
) =>
  enc.encode(
    ["prima-peer-v1", role, binding, nonceHost, nonceGuest].join("\n"),
  );

export async function makeProof(
  keyText: string,
  role: Role,
  binding: string,
  nonceHost: string,
  nonceGuest: string,
): Promise<string> {
  const key = await importKey(keyText);
  return toB64(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        message(role, binding, nonceHost, nonceGuest),
      ),
    ),
  );
}

// crypto.subtle.verify compares in constant time, so the answer does not leak how much of a guess was right
export async function checkProof(
  keyText: string,
  proof: string,
  role: Role,
  binding: string,
  nonceHost: string,
  nonceGuest: string,
): Promise<boolean> {
  try {
    const key = await importKey(keyText);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      fromB64(proof),
      message(role, binding, nonceHost, nonceGuest),
    );
  } catch {
    return false;
  }
}
