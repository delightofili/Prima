import { useEffect, useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Archive, ArchiveRestore, HardDrive, Share2 } from "lucide-react";
import { db } from "../db";
import { useToast } from "../hooks/useToast";
import { useI18n, type Key } from "../i18n";
import {
  BackupError,
  createBackup,
  openBackup,
  previewRestore,
  restoreBackup,
  type BackupData,
  type RestorePreview,
  type RestoreRow,
} from "../lib/backup";
import { downloadBlob } from "../lib/download";
import { isPersistent, megabytes, storageEstimate } from "../lib/storage";
import { Field, SectionTitle } from "./FormBits";
import { Modal } from "./Modal";

// The words for each kind of record in the "what will be restored" table
const ROW_LABEL = {
  guardians: "bak.rowGuardians",
  patients: "bak.rowPatients",
  visits: "bak.rowVisits",
  vaccines: "bak.rowVaccines",
  reminders: "bak.rowReminders",
} as const satisfies Record<RestoreRow["key"], Key>;

// Whole days since a moment. Kept outside the screen, so the clock is not read while the screen is being drawn.
const daysSince = (ms: number) => Math.floor((Date.now() - ms) / 86_400_000);

function BackupDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [pass, setPass] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<File | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pass !== again) return setError(t("authMail.errMismatch"));
    setBusy(true);
    try {
      const { file } = await createBackup(pass);
      downloadBlob(file.name, file);
      setMade(file);
      toast(t("bak.saved"));
    } catch (err) {
      // BackupError messages are already in the language on screen
      setError(err instanceof BackupError ? err.message : t("bak.errCreate"));
    } finally {
      setBusy(false);
    }
  };

  const canShare =
    !!made &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [made] });
  const share = async () => {
    if (!made) return;
    try {
      await navigator.share({ files: [made], title: "Prima backup" });
    } catch {
      /* the person closed the share sheet */
    }
  };

  return (
    <Modal title={t("bak.dialogTitle")} onClose={onClose}>
      {made ? (
        <div className="space-y-4">
          <p className="font-semibold">{t("bak.done", { name: made.name })}</p>
          <p className="text-subtext">{t("bak.keepSafe")}</p>
          {canShare && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void share()}
            >
              <Share2 size={20} className="mr-2" /> {t("bak.share")}
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-subtext">{t("bak.intro")}</p>
          <Field label={t("bak.password")}>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </Field>
          <Field label={t("bak.repeat")}>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={again}
              onChange={(e) => setAgain(e.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="font-medium text-danger">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t("bak.locking") : t("bak.create")}
          </button>
        </form>
      )}
    </Modal>
  );
}

function RestoreDialog({ onClose }: { onClose: () => void }) {
  const { t, tp, date } = useI18n();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [pass, setPass] = useState("");
  const [data, setData] = useState<BackupData | null>(null);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError(t("bak.chooseFirst"));
    setBusy(true);
    try {
      const opened = await openBackup(file, pass);
      setData(opened);
      setPreview(await previewRestore(opened));
    } catch (err) {
      setError(err instanceof BackupError ? err.message : t("bak.errRead"));
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!data) return;
    setBusy(true);
    try {
      await restoreBackup(data);
      toast(t("bak.restored"));
      onClose();
    } catch {
      setError(t("bak.errRestore"));
      setBusy(false);
    }
  };

  const nothing = preview
    ? preview.rows.every((r) => r.add + r.update === 0)
    : false;

  return (
    <Modal title={t("bak.restoreTitle")} onClose={onClose}>
      {!preview ? (
        <form onSubmit={check} className="space-y-4" noValidate>
          <p className="text-subtext">{t("bak.restoreHelp")}</p>
          <Field label={t("bak.file")}>
            <input
              className="input h-auto py-3"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field label={t("bak.filePassword")}>
            <input
              className="input"
              type="password"
              autoComplete="off"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="font-medium text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !file}
          >
            {busy ? t("clock.checking") : t("bak.check")}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="font-semibold">
            {preview.createdAt
              ? t("bak.madeOn", {
                  name: preview.facilityName,
                  date: date(new Date(preview.createdAt)),
                })
              : preview.facilityName}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-line text-sm text-subtext">
                  <th className="py-2 pr-3 font-semibold">
                    {t("bak.colRecords")}
                  </th>
                  <th className="py-2 pr-3 text-right font-semibold">
                    {t("bak.colAdded")}
                  </th>
                  <th className="py-2 pr-3 text-right font-semibold">
                    {t("bak.colUpdated")}
                  </th>
                  <th className="py-2 text-right font-semibold">
                    {t("bak.colKept")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr
                    key={r.key}
                    className="border-b border-line last:border-0"
                  >
                    <td className="py-2 pr-3">{t(ROW_LABEL[r.key])}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {r.add}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {r.update}
                    </td>
                    <td className="py-2 text-right tabular-nums">{r.keep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.erasedSkipped > 0 && (
            <p className="text-sm text-subtext">
              {tp("bak.erased", preview.erasedSkipped)}
            </p>
          )}
          {error && (
            <p role="alert" className="font-medium text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
            <button
              type="button"
              className="btn btn-secondary md:w-36"
              onClick={onClose}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="btn btn-primary md:w-48"
              disabled={busy || nothing}
              onClick={() => void restore()}
            >
              {nothing
                ? t("bak.nothing")
                : busy
                  ? t("bak.restoring")
                  : t("bak.restoreNow")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function StorageLine() {
  const { t } = useI18n();
  const [info, setInfo] = useState<{
    used: number;
    quota: number;
    kept: boolean;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [est, kept] = await Promise.all([
        storageEstimate(),
        isPersistent(),
      ]);
      if (alive && est) setInfo({ ...est, kept });
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!info) return null;
  return (
    <p className="flex items-start gap-2 text-sm text-subtext">
      <HardDrive size={18} className="mt-0.5 shrink-0" />
      <span>
        {t("bak.storageUsed", { size: megabytes(info.used) })}{" "}
        {t(info.kept ? "bak.storageKept" : "bak.storageRisk")}
      </span>
    </p>
  );
}

export function BackupCard() {
  const { t, tp } = useI18n();
  const last = useLiveQuery(() => db.meta.get("lastBackup"), []);
  const [dialog, setDialog] = useState<"backup" | "restore" | null>(null);
  const lastAt = last ? Number(last.value) : null;

  // "today", "yesterday", or "3 days ago", in the language on screen
  const when = (ms: number) => {
    const d = daysSince(ms);
    return d <= 0
      ? t("bak.today")
      : d === 1
        ? t("bak.yesterday")
        : tp("bak.daysAgo", d);
  };

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={Archive} title={t("bak.title")} />
      <p
        className={
          lastAt ? "text-subtext" : "rounded-xl bg-accent-50 p-3 font-medium"
        }
      >
        {lastAt ? t("bak.last", { when: when(lastAt) }) : t("bak.never")}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn btn-primary sm:w-52"
          onClick={() => setDialog("backup")}
        >
          <Archive size={20} className="mr-2" /> {t("bak.backupNow")}
        </button>
        <button
          type="button"
          className="btn btn-secondary sm:w-52"
          onClick={() => setDialog("restore")}
        >
          <ArchiveRestore size={20} className="mr-2" /> {t("bak.restore")}
        </button>
      </div>
      <StorageLine />
      {dialog === "backup" && <BackupDialog onClose={() => setDialog(null)} />}
      {dialog === "restore" && (
        <RestoreDialog onClose={() => setDialog(null)} />
      )}
    </section>
  );
}
