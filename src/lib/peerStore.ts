// Reads records from this phone's database for another phone, and saves what another phone sends.
// It saves them the way the download from the cloud does (no "who did what" lines in the audit log: the
// person who really made the change is not the person holding this phone), but it also puts each saved
// record in the upload queue, so a phone with internet carries a phone without it.
import type { Table } from "dexie";
import { db, remoteTransaction } from "../db";
import type { ApplyResult, Store } from "./peerProtocol";
import {
  decide,
  validateRecord,
  type Entry,
  type Rec,
  type TableName,
} from "./peerValidate";

const tableOf = (table: TableName) =>
  db[table] as unknown as Table<Rec, string>;

export function makePeerStore(
  facilityId: string,
  now: () => number = Date.now,
): Store {
  return {
    async index(table) {
      const out: Entry[] = [];
      await tableOf(table).each((r) => {
        out.push([r.id, r.updatedAt, r.erasedAt ? 1 : 0]);
      });
      return out;
    },

    async read(table, ids) {
      return (await tableOf(table).bulkGet(ids)).filter((r): r is Rec => !!r);
    },

    async apply(table, items): Promise<ApplyResult> {
      const result: ApplyResult = {
        added: 0,
        updated: 0,
        skipped: 0,
        rejected: 0,
      };
      const clean: Rec[] = [];
      for (const raw of items) {
        const r = validateRecord(table, raw, { facilityId, now: now() });
        if (r) clean.push(r);
        else result.rejected++;
      }
      if (clean.length === 0) return result;

      const t = tableOf(table);
      await remoteTransaction([t, db.syncQueue], async () => {
        const locals = await t.bulkGet(clean.map((r) => r.id));
        for (let i = 0; i < clean.length; i++) {
          const r = clean[i];
          const d = decide(locals[i], r);
          if (d === "skip") {
            result.skipped++;
            continue;
          }
          try {
            await t.put(r);
          } catch (e) {
            // Two phones can each have given a different patient the same random card number. Neither is wrong,
            // so this one is left for the cloud to sort out (it gives one of them a new number).
            if ((e as { name?: string }).name === "ConstraintError") {
              result.skipped++;
              continue;
            }
            throw e;
          }
          await db.syncQueue.add({
            table,
            recordId: r.id,
            attempts: 0,
            status: "pending",
            createdAt: now(),
          });
          if (d === "add") result.added++;
          else result.updated++;
        }
      });
      return result;
    },
  };
}
