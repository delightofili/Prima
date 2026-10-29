import { BatteryLow } from "lucide-react";
import { useI18n, type Key } from "../i18n";
import { setPowerMode, usePower, type PowerMode } from "../lib/power";
import { SectionTitle } from "./FormBits";

const CHOICES: { id: PowerMode; label: Key; help: Key }[] = [
  { id: "auto", label: "power.auto", help: "power.autoHelp" },
  { id: "on", label: "power.on", help: "power.onHelp" },
  { id: "off", label: "power.off", help: "power.offHelp" },
];

export function PowerCard() {
  const power = usePower();
  const { t } = useI18n();
  const percent = power.level === null ? 0 : Math.round(power.level * 100);

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={BatteryLow} title={t("power.title")} />
      <p className="text-subtext">{t("power.explain")}</p>

      <div
        role="radiogroup"
        aria-label={t("power.title")}
        className="space-y-2"
      >
        {CHOICES.map((c) => (
          <label
            key={c.id}
            className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${power.mode === c.id ? "border-prima-500 bg-prima-50" : "border-line bg-white"}`}
          >
            <input
              type="radio"
              name="power"
              className="mt-1 size-6 accent-prima-500"
              checked={power.mode === c.id}
              onChange={() => setPowerMode(c.id)}
            />
            <span>
              <span className="block font-semibold">{t(c.label)}</span>
              <span className="block text-sm text-subtext">{t(c.help)}</span>
            </span>
          </label>
        ))}
      </div>

      <p className="text-sm text-subtext">
        {power.supported && power.level !== null
          ? `${t(power.charging ? "power.batteryNowCharging" : "power.batteryNow", { percent })} ${t(power.active ? "power.isOn" : "power.isOff")}`
          : t("power.unsupported")}
      </p>
      <p className="text-sm text-subtext">{t("power.oledNote")}</p>
    </section>
  );
}
