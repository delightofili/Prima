import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useLock } from "../hooks/useLock";
import { AUTOLOCK_CHOICES } from "../lib/pin";
import { ChangePinDialog } from "./LockScreens";
import { SectionTitle } from "./FormBits";
import { useI18n } from "../i18n";

export function SecurityCard() {
  const { lockNow, minutes, setMinutes, pin, savePin } = useLock();
  const { account } = useAuth();
  const { t, tp } = useI18n();
  const [changing, setChanging] = useState(false);

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={Lock} title={t("security.title")} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn btn-primary sm:w-48"
          onClick={lockNow}
        >
          <Lock size={20} className="mr-2" /> {t("security.lockNow")}
        </button>
        <button
          type="button"
          className="btn btn-secondary sm:w-48"
          onClick={() => setChanging(true)}
        >
          {t("security.changePin")}
        </button>
      </div>
      <label className="block space-y-1">
        <span className="text-base font-semibold">
          {t("security.autoLock")}
        </span>
        <select
          className="input sm:max-w-xs"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        >
          {AUTOLOCK_CHOICES.map((m) => (
            <option key={m} value={m}>
              {tp("security.minutes", m)}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-subtext">{t("security.note")}</p>
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
