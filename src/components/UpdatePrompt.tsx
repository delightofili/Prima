import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Check, RefreshCw } from "lucide-react";
import { useI18n } from "../i18n";
import { checkVersion, reloadLatest } from "../lib/appVersion";
import { isPowerSaving } from "../lib/power";

const HOUR = 60 * 60 * 1000;

export function UpdatePrompt() {
  const { t } = useI18n();
  // Two ways to learn about a new version. The offline worker finds out by itself (needRefresh). And the page also
  // asks the server which build is live, in case the worker's own update never arrives.
  const [newerOnServer, setNewerOnServer] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (
          !navigator.onLine ||
          document.visibilityState !== "visible" ||
          isPowerSaving()
        )
          return;
        void registration.update();
        void checkVersion().then((v) => {
          if (v.newer) setNewerOnServer(true);
        });
      };
      setInterval(check, HOUR);
      document.addEventListener("visibilitychange", check);
      check(); // and once right now, when the app opens
    },
  });

  // The "ready offline" note goes away by itself
  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), 6000);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  const update = needRefresh || newerOnServer;
  if (!update && !offlineReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-28 z-[60] mx-auto max-w-md rounded-2xl border-2 border-prima-500 bg-white p-4 md:inset-x-auto md:bottom-4 md:right-4 md:mx-0"
    >
      {update ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2 font-semibold">
            <RefreshCw size={20} className="mt-0.5 shrink-0 text-prima-500" />
            <span>
              {t("update.ready")}
              <span className="block text-sm font-normal text-subtext">
                {t("update.help")}
              </span>
            </span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                void (needRefresh ? updateServiceWorker(true) : reloadLatest())
              }
            >
              {t("update.now")}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setNeedRefresh(false);
                setNewerOnServer(false);
              }}
            >
              {t("common.later")}
            </button>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 font-semibold">
          <Check size={20} className="shrink-0 text-prima-500" />
          {t("update.offlineReady")}
        </p>
      )}
    </div>
  );
}
