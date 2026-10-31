import { useEffect, useState } from "react";
import {
  CircleCheck,
  KeyRound,
  Loader,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wifi,
} from "lucide-react";
import { useOnline } from "../hooks/common";
import {
  useClinicKey,
  usePeerSync,
  type KeyNote,
  type KeyStatus,
  type NearbyState,
} from "../hooks/usePeerSync";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useI18n, type Key } from "../i18n";
import { qrPath } from "../lib/qrPath";
import { QrScanner } from "./QrScanner";

// The connection code as a QR code. It is long, so the lighter error-correction level is used: fewer, bigger squares
// that an ordinary phone camera reads easily off a screen. Smooth (not crisp) edges on purpose: on a screen where the
// squares do not divide evenly into pixels, crisp edges make uneven squares that a reader cannot decode.
function CodeQr({ text }: { text: string }) {
  const { t } = useI18n();
  const [code, setCode] = useState<{ d: string; n: number } | null>(null);

  useEffect(() => {
    let alive = true;
    void import("qrcode").then((mod) => {
      if (!alive) return;
      const qr = mod.create(text, { errorCorrectionLevel: "L" });
      setCode({
        d: qrPath(qr.modules.size, (r, c) => qr.modules.get(r, c) === 1),
        n: qr.modules.size,
      });
    });
    return () => {
      alive = false;
    };
  }, [text]);

  if (!code)
    return (
      <div className="mx-auto aspect-square w-full max-w-md" aria-hidden />
    );
  return (
    <svg
      viewBox={`-4 -4 ${code.n + 8} ${code.n + 8}`}
      role="img"
      aria-label={t("scan.qrAria")}
      className="mx-auto w-full max-w-md rounded-xl border-2 border-line"
    >
      <rect x="-4" y="-4" width={code.n + 8} height={code.n + 8} fill="#fff" />
      <path d={code.d} fill="#000" />
    </svg>
  );
}

// For a phone with no working camera: the code as text to copy, or a box to paste the other phone's code into
function TextCode({
  mode,
  code,
  onUse,
}: {
  mode: "show" | "take";
  code?: string;
  onUse?: (text: string) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [text, setText] = useState("");
  return (
    <details className="rounded-xl border-2 border-line bg-white">
      <summary className="flex min-h-12 cursor-pointer items-center px-3 font-semibold">
        {t("near.noCamera")}
      </summary>
      <div className="space-y-3 border-t-2 border-line p-3">
        {mode === "show" ? (
          <>
            <textarea
              readOnly
              rows={4}
              className="input w-full break-all font-mono text-xs"
              value={code}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="btn btn-secondary sm:w-56"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(code ?? "")
                  .then(() => toast(t("near.copied")));
              }}
            >
              {t("near.copy")}
            </button>
          </>
        ) : (
          <>
            <label className="block space-y-1">
              <span className="font-semibold">{t("near.paste")}</span>
              <textarea
                rows={4}
                className="input w-full break-all font-mono text-xs"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary sm:w-56"
              disabled={text.trim().length < 20}
              onClick={() => onUse?.(text)}
            >
              {t("near.use")}
            </button>
          </>
        )}
      </div>
    </details>
  );
}

const ERROR_TEXT: Record<string, Key> = {
  version: "near.err.version",
  facility: "near.err.facility",
  "key-here": "near.err.keyHere",
  "key-there": "near.err.keyThere",
  clock: "near.err.clock",
  auth: "near.err.auth",
  protocol: "near.err.protocol",
  "too-big": "near.err.tooBig",
  closed: "near.err.closed",
  timeout: "near.err.timeout",
  cancelled: "near.err.cancelled",
  link: "near.err.link",
  unsupported: "near.err.unsupported",
  "no-key": "near.keyMissing",
  code: "near.err.code",
};

function Steps({ n }: { n: 1 | 2 }) {
  const { t } = useI18n();
  return (
    <p className="text-sm font-semibold uppercase text-subtext">
      {t("near.step", { step: n })}
    </p>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-3 text-lg font-semibold" role="status">
      <Loader size={22} className="shrink-0 animate-spin text-prima-500" />{" "}
      {text}
    </p>
  );
}

export interface PanelProps {
  state: NearbyState;
  keyStatus: KeyStatus;
  keyNote: KeyNote;
  onHost: () => void;
  onGuest: () => void;
  onSubmit: (text: string) => void;
  onReset: () => void;
  onGetKey: () => void;
}

// Everything on the screen, decided from the state alone, so every state can be shown and tested on its own
export function NearbyPanel({
  state,
  keyStatus,
  keyNote,
  onHost,
  onGuest,
  onSubmit,
  onReset,
  onGetKey,
}: PanelProps) {
  const { t, tp } = useI18n();
  const online = useOnline();
  // The first phone: the code it has moved on from (to scan the other phone's code). Tied to that one code, so a new code always starts at step 1.
  const [scanFor, setScanFor] = useState<string | null>(null);

  let body;
  switch (state.step) {
    case "idle":
      body =
        keyStatus === "missing" ? (
          <div className="space-y-3 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4">
            <p className="flex items-start gap-2 font-semibold">
              <KeyRound size={20} className="mt-0.5 shrink-0" />{" "}
              {t("near.keyMissing")}
            </p>
            {keyNote === "offline" && <p>{t("near.keyOffline")}</p>}
            {keyNote === "failed" && <p>{t("near.keyFailed")}</p>}
            <button
              type="button"
              className="btn btn-primary sm:w-64"
              disabled={keyNote === "getting" || !online}
              onClick={onGetKey}
            >
              {keyNote === "getting" ? t("near.keyGetting") : t("near.keyGet")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {keyNote === "got" && (
              <p className="rounded-xl bg-prima-50 p-3 font-medium">
                {t("near.keyGot")}
              </p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                className="card space-y-1 text-left hover:bg-prima-50"
                disabled={keyStatus === "checking"}
                onClick={onHost}
              >
                <span className="block text-lg font-bold text-prima-500">
                  {t("near.hostBtn")}
                </span>
                <span className="block text-subtext">{t("near.hostHelp")}</span>
              </button>
              <button
                type="button"
                className="card space-y-1 text-left hover:bg-prima-50"
                disabled={keyStatus === "checking"}
                onClick={onGuest}
              >
                <span className="block text-lg font-bold text-prima-500">
                  {t("near.guestBtn")}
                </span>
                <span className="block text-subtext">
                  {t("near.guestHelp")}
                </span>
              </button>
            </div>
          </div>
        );
      break;

    case "host-code": {
      const scanningThem = scanFor === state.code;
      body = scanningThem ? (
        <div className="space-y-3">
          <Steps n={2} />
          <p className="text-lg font-semibold">{t("near.hostScan")}</p>
          <QrScanner onResult={onSubmit} />
          <TextCode mode="take" onUse={onSubmit} />
          <button
            type="button"
            className="min-h-12 font-semibold text-prima-500 underline"
            onClick={() => setScanFor(null)}
          >
            {t("near.hostBtn")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Steps n={1} />
          <p className="text-lg font-semibold">{t("near.hostShow")}</p>
          <CodeQr text={state.code} />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setScanFor(state.code)}
          >
            {t("near.hostNext")}
          </button>
          <TextCode mode="show" code={state.code} />
        </div>
      );
      break;
    }

    case "guest-scan":
      body = (
        <div className="space-y-3">
          <Steps n={1} />
          <p className="text-lg font-semibold">{t("near.guestScan")}</p>
          <QrScanner onResult={onSubmit} />
          <TextCode mode="take" onUse={onSubmit} />
        </div>
      );
      break;

    case "guest-code":
      body = (
        <div className="space-y-3">
          <Steps n={2} />
          <p className="text-lg font-semibold">{t("near.guestShow")}</p>
          <CodeQr text={state.code} />
          <Spinner text={t("near.guestWait")} />
          <TextCode mode="show" code={state.code} />
        </div>
      );
      break;

    case "connecting":
      body = <Spinner text={t("near.connecting")} />;
      break;

    case "syncing": {
      const p = state.progress;
      body = (
        <div className="space-y-3">
          <Spinner
            text={
              p.phase === "hello" || p.phase === "auth"
                ? t("near.connecting")
                : p.phase === "compare"
                  ? t("near.compare")
                  : t("near.progress", { sent: p.sent, received: p.received })
            }
          />
          <p className="text-subtext">{t("near.keepClose")}</p>
        </div>
      );
      break;
    }

    case "done": {
      const { summary, waiting } = state;
      const got = summary.received.added + summary.received.updated;
      body = (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-xl font-bold text-ok">
            <CircleCheck size={26} /> {t("near.done")}
          </p>
          <p className="text-lg">
            {summary.sent + got === 0
              ? t("near.doneSame")
              : t("near.doneSummary", {
                  sent: summary.sent,
                  received: got,
                  name: summary.peer.name,
                })}
          </p>
          {waiting > 0 && (
            <p className="rounded-xl bg-accent-50 p-3 font-medium">
              {tp("near.doneUpload", waiting)}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn btn-secondary sm:w-48"
              onClick={onReset}
            >
              <RefreshCw size={18} className="mr-2" /> {t("near.again")}
            </button>
          </div>
        </div>
      );
      break;
    }

    case "error": {
      const key = ERROR_TEXT[state.code] ?? "near.err.protocol";
      body = (
        <div className="space-y-4">
          <p
            role="alert"
            className="flex items-start gap-2 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4 font-medium"
          >
            <TriangleAlert size={22} className="mt-0.5 shrink-0" />
            <span>
              {t(key, {
                minutes: Math.max(1, Math.ceil((state.detail ?? 0) / 60_000)),
              })}
            </span>
          </p>
          <button
            type="button"
            className="btn btn-primary sm:w-56"
            onClick={onReset}
          >
            {t("common.tryAgain")}
          </button>
        </div>
      );
      break;
    }
  }

  const running =
    state.step !== "idle" && state.step !== "done" && state.step !== "error";
  return (
    <div className="space-y-5">
      <section className="card space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Wifi size={20} className="text-prima-500" /> {t("near.title")}
        </h2>
        <p className="text-subtext">{t("near.help")}</p>
        <p className="flex items-start gap-2 text-sm text-subtext">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" /> {t("near.safe")}
        </p>
      </section>
      <section className="card space-y-4">{body}</section>
      {running && (
        <button
          type="button"
          className="min-h-12 font-semibold text-subtext underline"
          onClick={onReset}
        >
          {t("common.cancel")}
        </button>
      )}
    </div>
  );
}

export function NearbyView() {
  const { facility } = useAuth();
  const { state, startAsHost, startAsGuest, submit, reset } = usePeerSync();
  const key = useClinicKey(facility?.id ?? "");
  return (
    <NearbyPanel
      state={state}
      keyStatus={key.status}
      keyNote={key.note}
      onHost={() => void startAsHost()}
      onGuest={() => void startAsGuest()}
      onSubmit={(text) => void submit(text)}
      onReset={reset}
      onGetKey={() => void key.get()}
    />
  );
}