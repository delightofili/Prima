import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Check, RefreshCw } from "lucide-react";
import { isPowerSaving } from "../lib/power";

const HOUR = 60 * 60 * 1000;

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Look for a new version hourly, and whenever the app comes back to the front
      const check = () => {
        if (
          navigator.onLine &&
          document.visibilityState === "visible" &&
          !isPowerSaving()
        )
          void registration.update();
      };
      setInterval(check, HOUR);
      document.addEventListener("visibilitychange", check);
    },
  });

  // The "ready offline" note goes away by itself
  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 6000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-28 z-[60] mx-auto max-w-md rounded-2xl border-2 border-prima-500 bg-white p-4 md:inset-x-auto md:bottom-4 md:right-4 md:mx-0"
    >
      {needRefresh ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2 font-semibold">
            <RefreshCw size={20} className="mt-0.5 shrink-0 text-prima-500" />
            <span>
              A new version of Prima is ready.
              <span className="block text-sm font-normal text-subtext">
                Finish anything you are saving first. Your records stay on this
                phone.
              </span>
            </span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void updateServiceWorker(true)}
            >
              Update now
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setNeedRefresh(false)}
            >
              Later
            </button>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 font-semibold">
          <Check size={20} className="shrink-0 text-prima-500" />
          Prima is ready to work without internet.
        </p>
      )}
    </div>
  );
}
