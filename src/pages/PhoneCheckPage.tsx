import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Copy, Play } from "lucide-react";
import { db } from "../db";
import { Field } from "../components/FormBits";
import { GloveToggle } from "../components/GloveToggle";
import { PageHeader } from "../components/PageHeader";
import { usePageTitle } from "../hooks/common";
import { useGloveMode } from "../hooks/useGloveMode";
import { useToast } from "../hooks/useToast";
import { createPin } from "../lib/pin";
import { isPersistent, megabytes, storageEstimate } from "../lib/storage";
import type { Patient } from "../types";

const TRIALS = 20;
const SIZES = [40, 48, 56, 64, 72];

type Row = [string, string];

interface Run {
  label: string;
  size: number;
  glove: boolean;
  onTarget: number; // 0 to 1
  medianMs: number;
  ghost: number; // finger touched the glass but the phone never registered a tap
}

const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
};

async function collectEnv(glove: boolean): Promise<Row[]> {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    standalone?: boolean;
  };
  const est = await storageEstimate();
  return [
    ["Build", __BUILD__],
    [
      "Secure page (needed for PIN, install, offline)",
      String(window.isSecureContext),
    ],
    [
      "Installed",
      String(
        matchMedia("(display-mode: standalone)").matches ||
          nav.standalone === true,
      ),
    ],
    ["Offline engine running", String(!!navigator.serviceWorker?.controller)],
    ["Online now", String(navigator.onLine)],
    ["Storage protected from clean-up", String(await isPersistent())],
    [
      "Storage used",
      est ? `${megabytes(est.used)} of ${megabytes(est.quota)}` : "unknown",
    ],
    [
      "Screen",
      `${screen.width} x ${screen.height} at ${window.devicePixelRatio}x`,
    ],
    ["Window", `${window.innerWidth} x ${window.innerHeight}`],
    ["Touch points", String(navigator.maxTouchPoints)],
    [
      "Memory in GB (approximate)",
      nav.deviceMemory ? String(nav.deviceMemory) : "unknown",
    ],
    ["CPU cores", String(navigator.hardwareConcurrency ?? "unknown")],
    ["Glove mode", glove ? "on" : "off"],
    ["Browser", navigator.userAgent],
  ];
}

function TapTest({
  glove,
  onDone,
}: {
  glove: boolean;
  onDone: (run: Run) => void;
}) {
  const [size, setSize] = useState(48);
  const [label, setLabel] = useState("Bare finger");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [count, setCount] = useState(0);
  const area = useRef<HTMLDivElement>(null);
  const stats = useRef({
    hits: 0,
    misses: 0,
    downs: 0,
    clicks: 0,
    times: [] as number[],
    shownAt: 0,
  });

  const place = () => {
    const box = area.current!.getBoundingClientRect();
    setPos({
      x: Math.random() * (box.width - size),
      y: Math.random() * (box.height - size),
    });
    stats.current.shownAt = performance.now();
  };

  const start = () => {
    stats.current = {
      hits: 0,
      misses: 0,
      downs: 0,
      clicks: 0,
      times: [],
      shownAt: 0,
    };
    setCount(0);
    place();
  };

  const finish = () => {
    const s = stats.current;
    onDone({
      label,
      size,
      glove,
      onTarget: s.hits / (s.hits + s.misses),
      medianMs: median(s.times),
      ghost: Math.max(0, s.downs - s.clicks),
    });
    setPos(null);
  };

  const hit = (e: MouseEvent) => {
    e.stopPropagation(); // a hit must not also count as a miss on the area behind it
    const s = stats.current;
    s.clicks++;
    s.hits++;
    s.times.push(performance.now() - s.shownAt);
    setCount(s.hits);
    if (s.hits >= TRIALS) finish();
    else place();
  };

  const miss = () => {
    if (!pos) return;
    stats.current.clicks++;
    stats.current.misses++;
  };

  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-bold">Tap test</h2>
      <p className="text-subtext">
        Tap the teal square each time it appears ({TRIALS} taps). Run it once
        bare-handed and again with gloves, at a few sizes.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Who is tapping?">
          <input
            className="input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={!!pos}
          />
        </Field>
        <Field label="Square size">
          <select
            className="input"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            disabled={!!pos}
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s} px {s === 48 ? "(Prima's normal button)" : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div
        ref={area}
        aria-label="Tap area"
        onPointerDown={() => {
          if (pos) stats.current.downs++;
        }}
        onClick={miss}
        className="relative h-80 rounded-xl border-2 border-dashed border-line bg-page"
      >
        {pos && (
          <button
            type="button"
            aria-label="Tap here"
            onClick={hit}
            style={{ left: pos.x, top: pos.y, width: size, height: size }}
            className="absolute rounded-lg bg-prima-500"
          />
        )}
      </div>
      {pos ? (
        <p className="font-semibold">
          {count} of {TRIALS}
        </p>
      ) : (
        <button
          type="button"
          className="btn btn-primary sm:w-48"
          onClick={start}
        >
          <Play size={20} className="mr-2" /> Start
        </button>
      )}
    </section>
  );
}

export function PhoneCheckPage() {
  usePageTitle("Phone check");
  const toast = useToast();
  const [glove] = useGloveMode();
  const [env, setEnv] = useState<Row[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [speed, setSpeed] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void collectEnv(glove).then((rows) => {
      if (alive) setEnv(rows);
    });
    return () => {
      alive = false;
    };
  }, [glove]);

  const runSpeed = async () => {
    setBusy(true);
    const lines: string[] = [];
    lines.push(`Patients on this phone: ${await db.patients.count()}`);

    let t0 = performance.now();
    const all: Patient[] = await db.patients.toArray();
    lines.push(`Load every patient: ${Math.round(performance.now() - t0)} ms`);

    t0 = performance.now();
    const matches = all.filter((p) =>
      p.fullName.toLowerCase().includes("a"),
    ).length;
    lines.push(
      `Search every name: ${Math.round(performance.now() - t0)} ms (${matches} matches)`,
    );

    t0 = performance.now();
    await createPin("123456", "speed-test"); // the same work as one PIN unlock
    lines.push(
      `Unlock check (PIN hash): ${Math.round(performance.now() - t0)} ms`,
    );

    setSpeed(lines);
    setBusy(false);
  };

  const report = () =>
    [
      `Prima phone check, ${new Date().toLocaleString("en-NG")}`,
      "",
      ...env.map(([k, v]) => `${k}: ${v}`),
      "",
      ...runs.map(
        (r) =>
          `Tap test, ${r.label}, ${r.size} px, glove mode ${r.glove ? "on" : "off"}: ${Math.round(r.onTarget * 100)}% on target, median ${r.medianMs} ms, ${r.ghost} taps not registered`,
      ),
      "",
      ...speed,
    ].join("\n");

  const copy = async () => {
    const text = report();
    try {
      await navigator.clipboard.writeText(text);
      toast("Report copied");
    } catch {
      try {
        await navigator.share({ text });
      } catch {
        toast("Could not copy. Select the text and copy it by hand.", "error");
      }
    }
  };

  return (
    <>
      <PageHeader
        title="Phone check"
        subtitle="How well does this phone suit Prima? Nothing here uses patient details."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-3">
          <h2 className="text-lg font-bold">This phone</h2>
          <dl className="space-y-2">
            {env.map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-subtext">{k}</dt>
                <dd className="break-words font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <GloveToggle />
        </section>

        <div className="space-y-4">
          <TapTest
            glove={glove}
            onDone={(r) => setRuns((prev) => [...prev, r])}
          />

          {runs.length > 0 && (
            <section className="card space-y-2">
              <h2 className="text-lg font-bold">Tap results</h2>
              <ul className="space-y-2">
                {runs.map((r, i) => (
                  <li key={i} className="rounded-xl bg-page p-3">
                    <p className="font-semibold">
                      {r.label}, {r.size} px, glove mode{" "}
                      {r.glove ? "on" : "off"}
                    </p>
                    <p className="text-subtext">
                      {Math.round(r.onTarget * 100)}% on target · median{" "}
                      {r.medianMs} ms · {r.ghost} taps not registered
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card space-y-3">
            <h2 className="text-lg font-bold">Speed check</h2>
            <button
              type="button"
              className="btn btn-secondary sm:w-56"
              disabled={busy}
              onClick={() => void runSpeed()}
            >
              {busy ? "Measuring…" : "Run speed check"}
            </button>
            {speed.length > 0 && (
              <ul className="space-y-1">
                {speed.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="card space-y-3">
            <h2 className="text-lg font-bold">Keyboard check</h2>
            <p className="text-subtext">
              Tap each box. Does the right keyboard appear?
            </p>
            <Field label="Phone number (number pad expected)">
              <input className="input" type="tel" inputMode="tel" />
            </Field>
            <Field label="Blood pressure, top number (number pad expected)">
              <input className="input" inputMode="numeric" pattern="[0-9]*" />
            </Field>
            <Field label="Date (date picker expected)">
              <input className="input" type="date" />
            </Field>
          </section>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void copy()}
          >
            <Copy size={20} className="mr-2" /> Copy report
          </button>
        </div>
      </div>
    </>
  );
}
