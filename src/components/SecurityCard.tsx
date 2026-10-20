import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useLock } from "../hooks/useLock";
import { AUTOLOCK_CHOICES } from "../lib/pin";
import { ChangePinDialog } from "./LockScreens";
import { SectionTitle } from "./FormBits";

export function SecurityCard() {
  const { lockNow, minutes, setMinutes, pin, savePin } = useLock();
  const { account } = useAuth();
  const [changing, setChanging] = useState(false);

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={Lock} title="Security" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn btn-primary sm:w-48"
          onClick={lockNow}
        >
          <Lock size={20} className="mr-2" /> Lock now
        </button>
        <button
          type="button"
          className="btn btn-secondary sm:w-48"
          onClick={() => setChanging(true)}
        >
          Change PIN
        </button>
      </div>
      <label className="block space-y-1">
        <span className="text-base font-semibold">
          Lock automatically after
        </span>
        <select
          className="input sm:max-w-xs"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        >
          {AUTOLOCK_CHOICES.map((m) => (
            <option key={m} value={m}>
              {m} {m === 1 ? "minute" : "minutes"} without use
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-subtext">
        The PIN keeps casual snoopers out. It is a lock, not a safe: also keep
        your phone's own screen lock on, and tell your admin at once if the
        phone is lost.
      </p>
      {changing && pin && account && (
        <ChangePinDialog
          pin={pin}
          userId={account.userId}
          onDone={(rec) => void savePin(rec)}
          onClose={() => setChanging(false)}
        />
      )}
    </section>
  );
}
