import { useCallback, useState } from "react";
import { db } from "../db";
import { logAudit } from "../lib/audit";
import {
  FILE_MAX_BYTES,
  PERIOD_MS,
  collectChanges,
  fileName,
  importChanges,
  openChanges,
  sealChanges,
  type OpenFailure,
  type Period,
} from "../lib/changeFile";
import { facilityTag } from "../lib/peerCodec";
import { TABLES } from "../lib/peerValidate";
import { makePeerStore } from "../lib/peerStore";
import { readClinicKey } from "../lib/syncKey";
import { pushPending } from "../lib/syncService";

export type FileNote =
  | null
  | { kind: "making" }
  | { kind: "opening" }
  | { kind: "made"; count: number; how: "shared" | "downloaded" }
  | {
      kind: "imported";
      added: number;
      updated: number;
      skipped: number;
      rejected: number;
      waiting: number;
    }
  | { kind: "error"; reason: OpenFailure | "failed" | "no-key" };

// Hands the file to the phone's share sheet (WhatsApp, Bluetooth, Drive...) or, where that is not possible, saves it
async function deliver(file: File): Promise<"shared" | "downloaded"> {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e; // the person closed the share sheet
      // any other refusal: fall through and save the file instead
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return "downloaded";
}

export function useChangeFile(facilityId: string) {
  const [note, setNote] = useState<FileNote>(null);

  const make = useCallback(
    async (period: Period) => {
      setNote({ kind: "making" });
      try {
        const key = await readClinicKey(facilityId);
        if (!key) return setNote({ kind: "error", reason: "no-key" });
        const now = Date.now();
        const span = PERIOD_MS[period];
        const tables = await collectChanges(
          makePeerStore(facilityId),
          span === null ? null : now - span,
        );
        const count = TABLES.reduce((n, t) => n + tables[t].length, 0);
        const bytes = await sealChanges(tables, {
          key: key.key,
          kv: key.version,
          fac: await facilityTag(facilityId),
          now,
        });
        const how = await deliver(
          new File([bytes], fileName(now), {
            type: "application/octet-stream",
          }),
        );
        setNote({ kind: "made", count, how });
      } catch (e) {
        setNote(
          (e as Error).name === "AbortError"
            ? null
            : { kind: "error", reason: "failed" },
        );
      }
    },
    [facilityId],
  );

  const open = useCallback(
    async (file: File) => {
      setNote({ kind: "opening" });
      try {
        if (file.size > FILE_MAX_BYTES)
          return setNote({ kind: "error", reason: "tooBig" });
        const key = await readClinicKey(facilityId);
        if (!key) return setNote({ kind: "error", reason: "no-key" });
        const opened = await openChanges(
          new Uint8Array(await file.arrayBuffer()),
          { key: key.key, kv: key.version, fac: await facilityTag(facilityId) },
        );
        if (!opened.ok)
          return setNote({ kind: "error", reason: opened.reason });
        const r = await importChanges(makePeerStore(facilityId), opened.tables);
        if (r.added + r.updated > 0) void pushPending();
        void logAudit(
          "sync.file",
          "facility",
          facilityId,
          `opened a changes file: added ${r.added}, updated ${r.updated}, ignored ${r.skipped}, refused ${r.rejected}`,
        );
        const waiting = await db.syncQueue
          .filter((i) => i.status !== "failed")
          .count();
        setNote({
          kind: "imported",
          added: r.added,
          updated: r.updated,
          skipped: r.skipped,
          rejected: r.rejected,
          waiting,
        });
      } catch {
        setNote({ kind: "error", reason: "failed" });
      }
    },
    [facilityId],
  );

  return { note, make, open, clear: useCallback(() => setNote(null), []) };
}
