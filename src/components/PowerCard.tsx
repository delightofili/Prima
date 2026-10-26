import { BatteryLow } from "lucide-react";
import { setPowerMode, usePower, type PowerMode } from "../lib/power";
import { SectionTitle } from "./FormBits";

const CHOICES: { id: PowerMode; label: string; help: string }[] = [
  {
    id: "auto",
    label: "Automatic",
    help: "Turns on at 20% battery and off again at 30%, or when charging",
  },
  {
    id: "on",
    label: "Always on",
    help: "Use this when you will not be able to charge for a long time",
  },
  { id: "off", label: "Off", help: "Never switch it on by itself" },
];

export function PowerCard() {
  const power = usePower();

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={BatteryLow} title="Low Battery Mode" />
      <p className="text-subtext">
        When it is on, Prima stops syncing in the background, uses dark colours
        and no animations. Everything you register is still saved on this phone
        at once. Syncing waits until you tap Sync now, plug in, or switch it
        off.
      </p>

      <div
        role="radiogroup"
        aria-label="Low Battery Mode"
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
              <span className="block font-semibold">{c.label}</span>
              <span className="block text-sm text-subtext">{c.help}</span>
            </span>
          </label>
        ))}
      </div>

      <p className="text-sm text-subtext">
        {power.supported && power.level !== null
          ? `Battery now: ${Math.round(power.level * 100)}%${power.charging ? ", charging" : ""}. ${power.active ? "Low Battery Mode is on." : "Low Battery Mode is off."}`
          : "This phone's browser does not report the battery, so Automatic cannot switch it on. Use Always on when the battery is low."}
      </p>
      <p className="text-sm text-subtext">
        Dark colours save a little power only on phones with an OLED screen. The
        biggest saving is your phone's own brightness: turn it down.
      </p>
    </section>
  );
}
