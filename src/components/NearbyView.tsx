import { useEffect, useState } from "react";
import {
  CircleCheck,
  FileUp,
  KeyRound,
  Loader,
  RefreshCw,
  Share2,
  ShieldCheck,
  TriangleAlert,
  Wifi,
  Users,
} from "lucide-react";
import { useOnline } from "../hooks/common";
import { useClock } from "../hooks/useDevices";
import { useChangeFile, type FileNote } from "../hooks/useChangeFile";
import {
  useClinicKey,
  usePeerBook,
  usePeerSync,
  type KeyNote,
  type KeyStatus,
  type NearbyState,
} from "../hooks/usePeerSync";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useI18n, type Key } from "../i18n";
import type { Period } from "../lib/changeFile";
import { MINUTE, spanMsg } from "../lib/deviceHealth";
import { isStale, type PeerEntry } from "../lib/peerBook";
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

const FILE_ERROR: Record<string, Key> = {
  notPrima: "file.err.notPrima",
  tooBig: "file.err.tooBig",
  facility: "file.err.facility",
  keyHere: "file.err.keyHere",
  keyThere: "file.err.keyThere",
  corrupt: "file.err.corrupt",
  failed: "file.err.failed",
  "no-key": "near.keyMissing",
};

const ENDED: Record<"you" | "them" | "quiet", Key> = {
  you: "near.ended.you",
  them: "near.ended.them",
  quiet: "near.ended.quiet",
};

// "5 minutes ago", in the person's language, from a time and the clock
function Ago({
  at,
  now,
  nowKey,
  agoKey,
}: {
  at: number;
  now: number;
  nowKey: Key;
  agoKey: Key;
}) {
  const { t, tm } = useI18n();
  const age = Math.max(0, now - at);
  return (
    <>{age < MINUTE ? t(nowKey) : t(agoKey, { span: tm(spanMsg(age)) })}</>
  );
}

// The phones this one has synced with. A browser cannot look for phones on the Wi-Fi, so this is the list of the ones met.
function PeersCard({ book }: { book: PeerEntry[] }) {
  const { t, tm } = useI18n();
  const now = useClock();
  return (
    <section className="card space-y-3">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <Users size={20} className="text-prima-500" /> {t("peers.title")}
      </h3>
      {book.length === 0 ? (
        <p className="text-subtext">{t("peers.none")}</p>
      ) : (
        <ul className="space-y-3">
          {book.map((e) => (
            <li
              key={e.dev}
              className="space-y-0.5 rounded-xl border-2 border-line p-3"
            >
              <p className="break-words font-semibold">{e.name || e.dev}</p>
              {e.user && <p className="text-sm text-subtext">{e.user}</p>}
              <p className="text-sm">
                {now - e.at < MINUTE
                  ? t("peers.lastNow")
                  : t("peers.last", {
                      span: tm(spanMsg(Math.max(0, now - e.at))),
                    })}
              </p>
              <p className="text-sm text-subtext">
                {t("peers.totals", { sent: e.sent, received: e.received })}
              </p>
              {isStale(e, now) && (
                <p className="text-sm font-medium text-danger">
                  {t("peers.stale", {
                    span: tm(spanMsg(Math.max(0, now - e.at))),
                  })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-subtext">{t("peers.note")}</p>
    </section>
  );
}

// For phones that cannot reach each other over the Wi-Fi: a locked file, sent any way you like
function FileCard({
  note,
  onMake,
  onOpen,
}: {
  note: FileNote;
  onMake: (p: Period) => void;
  onOpen: (f: File) => void;
}) {
  const { t, tp } = useI18n();
  const [period, setPeriod] = useState<Period>("7d");
  const busy = note?.kind === "making" || note?.kind === "opening";
  const OPTIONS: { id: Period; label: Key }[] = [
    { id: "7d", label: "file.p7" },
    { id: "30d", label: "file.p30" },
    { id: "all", label: "file.pall" },
  ];
  return (
    <section className="card space-y-3">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <FileUp size={20} className="text-prima-500" /> {t("file.title")}
      </h3>
      <p className="text-subtext">{t("file.help")}</p>

      <fieldset className="space-y-2">
        <legend className="font-semibold">{t("file.period")}</legend>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={period === o.id}
              className={`inline-flex min-h-11 items-center rounded-xl border-2 px-4 font-semibold ${period === o.id ? "border-prima-500 bg-prima-500 text-white" : "border-prima-500 bg-white text-prima-500"}`}
              onClick={() => setPeriod(o.id)}
            >
              {t(o.label)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn btn-primary sm:w-64"
          disabled={busy}
          onClick={() => onMake(period)}
        >
          <Share2 size={18} className="mr-2" /> {t("file.make")}
        </button>
        <label
          className={`btn btn-secondary cursor-pointer sm:w-64 ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <FileUp size={18} className="mr-2" /> {t("file.open")}
          <input
            type="file"
            className="sr-only"
            accept=".primasync,application/octet-stream"
            disabled={busy}
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              e.currentTarget.value = ""; // so the same file can be chosen again
              if (f) onOpen(f);
            }}
          />
        </label>
      </div>

      {note?.kind === "making" && <Spinner text={t("file.making")} />}
      {note?.kind === "opening" && <Spinner text={t("file.opening")} />}
      {note?.kind === "made" && (
        <div
          className="space-y-1 rounded-xl bg-prima-50 p-3 font-medium"
          role="status"
        >
          <p>{tp("file.made", note.count)}</p>
          {note.how === "downloaded" && <p>{t("file.madeDownload")}</p>}
        </div>
      )}
      {note?.kind === "imported" && (
        <div
          className="space-y-1 rounded-xl bg-prima-50 p-3 font-medium"
          role="status"
        >
          <p>
            {note.added + note.updated === 0
              ? t("file.importedNone")
              : t("file.imported", {
                  added: note.added,
                  updated: note.updated,
                  skipped: note.skipped,
                })}
          </p>
          {note.rejected > 0 && <p>{tp("file.rejected", note.rejected)}</p>}
          {note.waiting > 0 && <p>{tp("near.doneUpload", note.waiting)}</p>}
        </div>
      )}
      {note?.kind === "error" && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border-2 border-accent-500 bg-accent-50 p-3 font-medium"
        >
          <TriangleAlert size={20} className="mt-0.5 shrink-0" />{" "}
          {t(FILE_ERROR[note.reason] ?? "file.err.failed")}
        </p>
      )}
    </section>
  );
}

export interface PanelProps {
  state: NearbyState;
  keyStatus: KeyStatus;
  keyNote: KeyNote;
  book: PeerEntry[];
  fileNote: FileNote;
  onHost: () => void;
  onGuest: () => void;
  onSubmit: (text: string) => void;
  onReset: () => void;
  onGetKey: () => void;
  onShareNow: () => void;
  onDisconnect: () => void;
  onMakeFile: (p: Period) => void;
  onOpenFile: (f: File) => void;
}

// Everything on the screen, decided from the state alone, so every state can be shown and tested on its own
export function NearbyPanel({
  state,
  keyStatus,
  keyNote,
  book,
  fileNote,
  onHost,
  onGuest,
  onSubmit,
  onReset,
  onGetKey,
  onShareNow,
  onDisconnect,
  onMakeFile,
  onOpenFile,
}: PanelProps) {
  const { t, tp } = useI18n();
  const online = useOnline();
  const now = useClock();
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

    case "live":
      body = (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-xl font-bold text-ok">
            <Wifi size={26} className="shrink-0" />{" "}
            <span className="break-words">
              {t("near.live", { name: state.peer.name })}
            </span>
          </p>
          {state.peer.user && <p className="text-subtext">{state.peer.user}</p>}
          <p className="text-lg font-semibold" role="status">
            {state.busy ? t("near.liveBusy") : t("dev.ok")}
          </p>
          <p>
            {t("near.liveTotals", {
              sent: state.totals.sent,
              received: state.totals.received,
            })}
          </p>
          <p className="text-sm text-subtext">
            <Ago
              at={state.lastAt}
              now={now}
              nowKey="near.liveLastNow"
              agoKey="near.liveLast"
            />
          </p>
          <p className="text-subtext">{t("near.liveHelp")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn btn-secondary sm:w-48"
              disabled={state.busy}
              onClick={onShareNow}
            >
              <RefreshCw size={18} className="mr-2" /> {t("near.shareNow")}
            </button>
            <button
              type="button"
              className="btn btn-secondary sm:w-48"
              onClick={onDisconnect}
            >
              {t("near.disconnect")}
            </button>
          </div>
        </div>
      );
      break;

    case "done": {
      const { peer, totals, waiting, ended } = state;
      body = (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-xl font-bold text-ok">
            <CircleCheck size={26} /> {t("near.done")}
          </p>
          <p className="text-subtext">{t(ENDED[ended])}</p>
          <p className="text-lg">
            {totals.sent + totals.received === 0
              ? t("near.doneSame")
              : t("near.doneSummary", {
                  sent: totals.sent,
                  received: totals.received,
                  name: peer?.name ?? "",
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
    state.step === "host-code" ||
    state.step === "guest-scan" ||
    state.step === "guest-code" ||
    state.step === "connecting" ||
    state.step === "syncing";
  const showExtras =
    (state.step === "idle" || state.step === "done") &&
    keyStatus !== "checking";
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
      {showExtras && keyStatus === "ready" && <PeersCard book={book} />}
      {showExtras && keyStatus === "ready" && (
        <FileCard note={fileNote} onMake={onMakeFile} onOpen={onOpenFile} />
      )}
    </div>
  );
}

export function NearbyView() {
  const { facility } = useAuth();
  const facilityId = facility?.id ?? "";
  const {
    state,
    bookVersion,
    startAsHost,
    startAsGuest,
    submit,
    shareNow,
    disconnect,
    reset,
  } = usePeerSync();
  const key = useClinicKey(facilityId);
  const book = usePeerBook(bookVersion);
  const file = useChangeFile(facilityId);
  return (
    <NearbyPanel
      state={state}
      keyStatus={key.status}
      keyNote={key.note}
      book={book}
      fileNote={file.note}
      onHost={() => void startAsHost()}
      onGuest={() => void startAsGuest()}
      onSubmit={(text) => void submit(text)}
      onReset={reset}
      onGetKey={() => void key.get()}
      onShareNow={shareNow}
      onDisconnect={disconnect}
      onMakeFile={(p) => void file.make(p)}
      onOpenFile={(f) => void file.open(f)}
    />
  );
}
