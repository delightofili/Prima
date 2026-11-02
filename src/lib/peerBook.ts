// The phones this one has synced with: who, when, and how much. Kept on the phone, so it works with no internet.
// A browser cannot look around the Wi-Fi for other phones, so "nearby" means "phones you have met".

export interface PeerEntry {
  dev: string; // the other phone's own id
  name: string; // what it calls itself ("Android · Chrome 129 · 7F3A")
  user: string; // who was using it
  at: number; // the last time they synced (this phone's clock)
  sent: number; // records sent to it, in total
  received: number; // records received from it, in total
  rounds: number; // how many times they have synced
}

export const BOOK_KEY = "peerBook";
export const BOOK_MAX = 12; // the oldest are forgotten beyond this
export const STALE_AFTER = 3 * 86_400_000; // "not synced for days" starts here

const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;

// Whatever is stored, a damaged value gives an empty book rather than a crash
export function parseBook(text: string | undefined | null): PeerEntry[] {
  if (!text) return [];
  try {
    const raw = JSON.parse(text) as unknown;
    if (!Array.isArray(raw)) return [];
    const out: PeerEntry[] = [];
    for (const e of raw as Record<string, unknown>[]) {
      if (typeof e?.dev !== "string" || e.dev.length === 0 || e.dev.length > 80)
        continue;
      out.push({
        dev: e.dev,
        name: typeof e.name === "string" ? e.name.slice(0, 40) : "",
        user: typeof e.user === "string" ? e.user.slice(0, 40) : "",
        at: num(e.at),
        sent: num(e.sent),
        received: num(e.received),
        rounds: num(e.rounds),
      });
    }
    return out.slice(0, BOOK_MAX);
  } catch {
    return [];
  }
}

// After a sync: the phone moves to the top with its totals updated. A phone met for the first time is added.
export function noteSync(
  book: PeerEntry[],
  peer: { dev: string; name: string; user: string },
  sent: number,
  received: number,
  now: number,
): PeerEntry[] {
  const before = book.find((e) => e.dev === peer.dev);
  const entry: PeerEntry = {
    dev: peer.dev,
    name: peer.name || before?.name || "",
    user: peer.user || before?.user || "",
    at: now,
    sent: (before?.sent ?? 0) + sent,
    received: (before?.received ?? 0) + received,
    rounds: (before?.rounds ?? 0) + 1,
  };
  return [entry, ...book.filter((e) => e.dev !== peer.dev)].slice(0, BOOK_MAX);
}

export const isStale = (e: PeerEntry, now: number) => now - e.at > STALE_AFTER;
