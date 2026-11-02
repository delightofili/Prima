import { db } from "../db";
import { BOOK_KEY, parseBook, type PeerEntry } from "./peerBook";

export async function readBook(): Promise<PeerEntry[]> {
  return parseBook((await db.meta.get(BOOK_KEY))?.value);
}

export async function writeBook(book: PeerEntry[]): Promise<void> {
  await db.meta.put({ key: BOOK_KEY, value: JSON.stringify(book) });
}
