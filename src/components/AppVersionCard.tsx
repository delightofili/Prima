import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  checkVersion,
  reloadLatest,
  type VersionInfo,
} from "../lib/appVersion";
import { useI18n } from "../i18n";
import { SectionTitle } from "./FormBits";

// Which version of Prima is this phone running, and is there a newer one? Also a safe way to get the newest one.
export function AppVersionCard() {
  const { t } = useI18n();
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
      <SectionTitle icon={RefreshCw} title={t("appv.title")} />
      <p className="font-medium">
        {t("appv.running", { build: info?.running ?? "…" })}
      </p>
      {info && info.latest === null && (
        <p className="text-subtext">{t("appv.noServer")}</p>
      )}
      {info?.latest && !info.newer && (
        <p className="font-medium text-ok">{t("appv.newest")}</p>
      )}
      {info?.newer && (
        <p className="rounded-xl bg-accent-50 p-3 font-medium">
          {t("appv.newer", { latest: info.latest ?? "" })}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn btn-secondary sm:w-56"
          disabled={busy}
          onClick={() => void check()}
        >
          {busy ? t("clock.checking") : t("appv.check")}
        </button>
        <button
          type="button"
          className="btn btn-primary sm:w-64"
          onClick={() => void reloadLatest()}
        >
          {t("appv.reload")}
        </button>
      </div>
      <p className="text-sm text-subtext">{t("appv.reloadHelp")}</p>
    </section>
  );
}
