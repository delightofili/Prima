import { useEffect, useState, useSyncExternalStore } from "react";
import { Clock } from "lucide-react";
import { useI18n } from "../i18n";
import {
  describe,
  getReading,
  isWrong,
  measureClock,
  subscribeClock,
} from "../lib/clock";
import { isDemo } from "../lib/demo";

// Tells the person when this phone's clock is wrong: a wrong clock puts wrong dates on visits and reminders, and a phone set
// far behind has its changes ignored by the cloud. The clock is checked against the server whenever there is a connection.
export function ClockBanner() {
  const { t, tp } = useI18n();
  const reading = useSyncExternalStore(subscribeClock, getReading, getReading);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (isDemo()) return; // practice mode has no server to ask
    const run = () => {
      if (navigator.onLine) void measureClock();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") run(); // coming back from the phone's Settings after fixing it
    };
    run();
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(run, 3_600_000);
    return () => {
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, []);

  if (isDemo() || !reading || !isWrong(reading.skewMs)) return null;
  const d = describe(reading.skewMs);
  const amount =
    d.unit === "minutes"
      ? tp("clock.minutes", d.n)
      : d.unit === "hours"
        ? tp("clock.hours", d.n)
        : tp("clock.days", d.n);
  return (
    <div
      role="alert"
      className="mb-4 space-y-2 rounded-2xl border-2 border-accent-500 bg-accent-50 p-3"
    >
      <p className="flex items-start gap-2 font-semibold">
        <Clock size={22} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          {t(d.direction === "ahead" ? "clock.ahead" : "clock.behind", {
            amount,
          })}
        </span>
      </p>
      <p>{t("clock.why")}</p>
      <p>{t("clock.fix")}</p>
      <button
        type="button"
        className="btn btn-secondary sm:w-56"
        disabled={checking || !navigator.onLine}
        onClick={async () => {
          setChecking(true);
          try {
            await measureClock({ force: true });
          } finally {
            setChecking(false);
          }
        }}
      >
        {checking ? t("clock.checking") : t("clock.check")}
      </button>
    </div>
  );
}
