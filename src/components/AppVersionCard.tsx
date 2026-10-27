import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  checkVersion,
  reloadLatest,
  type VersionInfo,
} from "../lib/appVersion";
import { SectionTitle } from "./FormBits";

// Which version of Prima is this phone running, and is there a newer one? Also a safe way to get the newest one.
export function AppVersionCard() {
  const [info, setInfo] = useState<VersionInfo | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update().catch(() => undefined);
    setInfo(await checkVersion());
    setBusy(false);
  };

  useEffect(() => {
    let alive = true;
    void checkVersion().then((v) => {
      if (alive) setInfo(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={RefreshCw} title="App version" />
      <p>
        This phone is running the version built{" "}
        <strong>{info?.running ?? "…"}</strong>.
      </p>
      {info && info.latest === null && (
        <p className="text-subtext">
          Could not ask the server for the newest version. Check the internet,
          or this server has no version file yet.
        </p>
      )}
      {info?.latest && !info.newer && (
        <p className="font-medium text-ok">You have the newest version.</p>
      )}
      {info?.newer && (
        <p className="rounded-xl bg-accent-50 p-3 font-medium">
          A newer version is available (built {info.latest}).
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn btn-secondary sm:w-56"
          disabled={busy}
          onClick={() => void check()}
        >
          {busy ? "Checking…" : "Check for updates"}
        </button>
        <button
          type="button"
          className="btn btn-primary sm:w-64"
          onClick={() => void reloadLatest()}
        >
          Reload the newest version
        </button>
      </div>
      <p className="text-sm text-subtext">
        Reloading fetches the newest app files. Your patients, visits and PIN
        stay on this phone. Do it while online, and sync first if you can.
      </p>
    </section>
  );
}
