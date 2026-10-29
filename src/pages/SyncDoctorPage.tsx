import { useState } from "react";
import { Copy, Stethoscope } from "lucide-react";
import { SectionTitle } from "../components/FormBits";
import { useSyncState } from "../hooks/useSyncState";
import { PageHeader } from "../components/PageHeader";
import { usePageTitle } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useI18n } from "../i18n";
import {
  buildReport,
  checkCloud,
  discardItem,
  forgetDownloadProgress,
  requeueAll,
  type Check,
} from "../lib/syncDoctor";
import { getSyncHealth } from "../lib/syncHealth";
import { pullChanges, retryFailed, syncNow } from "../lib/syncService";

export function SyncDoctorPage() {
  usePageTitle("Sync Doctor");
  const toast = useToast();
  const { role } = useAuth();
  const { state, items, counts } = useSyncState();
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { tm } = useI18n();

  if (role !== "admin") {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-lg font-semibold">
          Only a facility admin can open the Sync Doctor.
        </p>
      </div>
    );
  }

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const health = getSyncHealth();

  return (
    <>
      <PageHeader
        title="Sync Doctor"
        subtitle="Finds out why records are not uploading, and fixes what can be fixed here."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-3">
          <SectionTitle icon={Stethoscope} title="What is happening" />
          <p className="text-lg font-semibold">{tm(state.label)}</p>
          <p className="text-subtext">{tm(state.detail)}</p>
          <ul className="space-y-1 text-sm">
            <li>Waiting to upload: {counts.waiting}</li>
            <li>Need attention: {counts.failed}</li>
            <li>Network failures in a row: {health.failures}</li>
            <li>
              Last success:{" "}
              {health.lastOkAt
                ? new Date(health.lastOkAt).toLocaleTimeString("en-NG")
                : "not yet"}
            </li>
            <li>
              A request gave up waiting:{" "}
              {health.stalledAt
                ? new Date(health.stalledAt).toLocaleTimeString("en-NG")
                : "no"}
            </li>
            <li>Cloud database problem: {health.schemaProblem ?? "none"}</li>
            {health.problem && (
              <li className="break-words">
                Latest trouble: {health.problem.kind} in {health.problem.where}:{" "}
                {health.problem.message}
              </li>
            )}
          </ul>
        </section>

        <section className="card space-y-3">
          <h2 className="text-lg font-bold">Check the cloud</h2>
          <p className="text-subtext">
            Tests the connection, the sign-in, and that the cloud database has
            everything this version of Prima needs.
          </p>
          <button
            type="button"
            className="btn btn-primary sm:w-56"
            disabled={busy !== null}
            onClick={() =>
              void run("check", async () => setChecks(await checkCloud()))
            }
          >
            {busy === "check" ? "Checking…" : "Run the checks"}
          </button>
          {checks && (
            <ul className="space-y-2">
              {checks.map((c) => (
                <li
                  key={c.name}
                  className={`rounded-xl p-3 text-sm ${c.ok ? "bg-page" : "bg-accent-50"}`}
                >
                  <p className="font-semibold">
                    {c.ok ? "OK" : "Problem"}: {c.name}
                  </p>
                  <p className="break-words text-subtext">{c.detail}</p>
                  {c.fix && <p className="break-words font-medium">{c.fix}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card space-y-3 lg:col-span-2">
          <h2 className="text-lg font-bold">Tools</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null}
              onClick={() => void run("sync", () => syncNow(true))}
            >
              Sync now
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null || counts.failed === 0}
              onClick={() => void run("retry", () => retryFailed())}
            >
              Retry the failed
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null}
              onClick={() =>
                void run("again", async () => {
                  const n = await requeueAll();
                  toast(`${n} records queued to upload again`);
                  await syncNow(true);
                })
              }
            >
              Upload everything again
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null}
              onClick={() =>
                void run("download", async () => {
                  await forgetDownloadProgress();
                  await pullChanges(true);
                  toast("Downloaded everything again");
                })
              }
            >
              Download everything again
            </button>
          </div>
          <p className="text-sm text-subtext">
            Uploading again is safe: records are updated, never doubled. Nothing
            here deletes a patient or a visit.
          </p>
          <button
            type="button"
            className="btn btn-secondary sm:w-56"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  await buildReport(checks ?? []),
                );
                toast("Report copied");
              } catch {
                toast(
                  "Could not copy. Select the text and copy it by hand.",
                  "error",
                );
              }
            }}
          >
            <Copy size={20} className="mr-2" /> Copy report
          </button>
        </section>

        <section className="card space-y-3 lg:col-span-2">
          <h2 className="text-lg font-bold">The queue ({items.length})</h2>
          {items.length === 0 ? (
            <p className="text-subtext">Nothing is waiting.</p>
          ) : (
            <ul className="space-y-2">
              {items.slice(0, 100).map((i) => (
                <li
                  key={i.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-page p-3 text-sm"
                >
                  <span className="min-w-0 break-words">
                    <span className="block font-semibold">
                      #{i.id} {i.table} {i.recordId.slice(0, 8)} ·{" "}
                      {i.status === "failed" ? "needs attention" : "waiting"} ·{" "}
                      {i.attempts} {i.attempts === 1 ? "try" : "tries"}
                    </span>
                    <span className="block text-subtext">
                      {i.lastError ?? "No error recorded"}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="min-h-11 shrink-0 px-3 font-semibold text-danger"
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Remove this from the upload queue? The record stays on this phone and uploads again the next time it is edited, or with Upload everything again.",
                        )
                      ) {
                        await discardItem(i.id!);
                      }
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
