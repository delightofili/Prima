import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Timer } from "lucide-react";
import { summarize, type TimingSummary } from "../lib/timing";
import {
  clearTimings,
  loadTimings,
  setTimingEnabled,
  timingEnabled,
} from "../lib/timingStore";

const row = (name: string, s: TimingSummary | null) =>
  s
    ? `${name}: ${s.count} ${s.count === 1 ? "registration" : "registrations"}, median ${s.seconds} seconds and ${s.taps} taps`
    : `${name}: none yet`;

// For a usability session: switch on, register a few patients, read the medians
export function TimingCard() {
  const [on, setOn] = useState(timingEnabled);
  const records = useLiveQuery(loadTimings, [on], []);
  const s = summarize(records ?? []);

  return (
    <section className="card space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Timer size={20} className="text-prima-500" /> Registration speed
      </h2>
      <p className="text-subtext">
        For a usability session. When on, Prima records how long each
        registration takes and how many taps it needs. It keeps no names and
        nothing else, and the numbers stay on this phone.
      </p>
      <label className="flex min-h-12 items-center gap-3 font-semibold">
        <input
          type="checkbox"
          className="size-6 accent-prima-500"
          checked={on}
          onChange={(e) => {
            setTimingEnabled(e.target.checked);
            setOn(e.target.checked);
          }}
        />
        Measure registrations
      </label>
      <ul className="space-y-1">
        <li>{row("Quick form", s.quick)}</li>
        <li>{row("Full form", s.full)}</li>
      </ul>
      <button
        type="button"
        className="btn btn-secondary sm:w-48"
        onClick={async () => {
          await clearTimings();
          setOn((v) => v); // refresh
        }}
      >
        Clear numbers
      </button>
      <p className="text-sm text-subtext">
        The page must be reloaded after switching on, so the next registration
        is measured.
      </p>
    </section>
  );
}
