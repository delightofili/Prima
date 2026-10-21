import { useEffect, useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Archive, ArchiveRestore, HardDrive, Share2 } from "lucide-react";
import { db } from "../db";
import { useToast } from "../hooks/useToast";
import {
  BackupError,
  createBackup,
  openBackup,
  previewRestore,
  restoreBackup,
  type BackupData,
  type RestorePreview,
} from "../lib/backup";
import { downloadBlob } from "../lib/download";
import { isPersistent, megabytes, storageEstimate } from "../lib/storage";
import { Field, SectionTitle } from "./FormBits";
import { Modal } from "./Modal";

const ago = (ms: number) => {
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

function BackupDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [pass, setPass] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<File | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pass !== again) return setError("The two passwords are different.");
    setBusy(true);
    try {
      const { file } = await createBackup(pass);
      downloadBlob(file.name, file);
      setMade(file);
      toast("Backup saved to your downloads");
    } catch (err) {
      setError(
        err instanceof BackupError
          ? err.message
          : "Could not create the backup. Please try again.",
      );
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
    <Modal title="Back up this register" onClose={onClose}>
      {made ? (
        <div className="space-y-4">
          <p className="font-semibold">Done: {made.name}</p>
          <p className="text-subtext">
            Keep it somewhere safe, like your own email or Google Drive. It is
            locked with your password. If you forget the password, nobody can
            open it.
          </p>
          {canShare && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void share()}
            >
              <Share2 size={20} className="mr-2" /> Share the file
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-subtext">
            This makes one file with every patient, visit and vaccine on this
            phone, locked with a password you choose.
          </p>
          <Field label="Password (8 or more characters)">
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </Field>
          <Field label="Repeat the password">
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
            {busy ? "Locking the file…" : "Create backup"}
          </button>
        </form>
      )}
    </Modal>
  );
}

function RestoreDialog({ onClose }: { onClose: () => void }) {
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
    if (!file) return setError("Choose the backup file first.");
    setBusy(true);
    try {
      const opened = await openBackup(file, pass);
      setData(opened);
      setPreview(await previewRestore(opened));
    } catch (err) {
      setError(
        err instanceof BackupError ? err.message : "Could not read the backup.",
      );
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!data) return;
    setBusy(true);
    try {
      await restoreBackup(data);
      toast("Backup restored. Uploading in the background.");
      onClose();
    } catch {
      setError("Could not restore the backup. Nothing was changed.");
      setBusy(false);
    }
  };

  const nothing = preview
    ? preview.rows.every((r) => r.add + r.update === 0)
    : false;

  return (
    <Modal title="Restore from a backup" onClose={onClose}>
      {!preview ? (
        <form onSubmit={check} className="space-y-4" noValidate>
          <p className="text-subtext">
            Restoring adds anything missing and keeps whichever copy is newer.
            It never deletes anything on this phone.
          </p>
          <Field label="Backup file">
            <input
              className="input h-auto py-3"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field label="Backup password">
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
            {busy ? "Checking…" : "Check the backup"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="font-semibold">
            {preview.facilityName}
            {preview.createdAt &&
              `, made ${new Date(preview.createdAt).toLocaleDateString("en-NG")}`}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-line text-sm text-subtext">
                  <th className="py-2 pr-3 font-semibold">Records</th>
                  <th className="py-2 pr-3 text-right font-semibold">Added</th>
                  <th className="py-2 pr-3 text-right font-semibold">
                    Updated
                  </th>
                  <th className="py-2 text-right font-semibold">Kept as is</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr
                    key={r.label}
                    className="border-b border-line last:border-0"
                  >
                    <td className="py-2 pr-3">{r.label}</td>
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
              {preview.erasedSkipped} erased{" "}
              {preview.erasedSkipped === 1 ? "patient is" : "patients are"} not
              restored.
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
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary md:w-48"
              disabled={busy || nothing}
              onClick={() => void restore()}
            >
              {nothing
                ? "Nothing to restore"
                : busy
                  ? "Restoring…"
                  : "Restore now"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function StorageLine() {
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
        {megabytes(info.used)} used on this phone.{" "}
        {info.kept
          ? "The browser will not clear Prima's data automatically."
          : "The browser could clear Prima's data if the phone runs very low on space, so back up regularly."}
      </span>
    </p>
  );
}

export function BackupCard() {
  const last = useLiveQuery(() => db.meta.get("lastBackup"), []);
  const [dialog, setDialog] = useState<"backup" | "restore" | null>(null);
  const lastAt = last ? Number(last.value) : null;

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={Archive} title="Backup and restore" />
      <p
        className={
          lastAt ? "text-subtext" : "rounded-xl bg-accent-50 p-3 font-medium"
        }
      >
        {lastAt
          ? `Last backup from this phone: ${ago(lastAt)}.`
          : "No backup made from this phone yet."}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn btn-primary sm:w-52"
          onClick={() => setDialog("backup")}
        >
          <Archive size={20} className="mr-2" /> Back up now
        </button>
        <button
          type="button"
          className="btn btn-secondary sm:w-52"
          onClick={() => setDialog("restore")}
        >
          <ArchiveRestore size={20} className="mr-2" /> Restore
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
