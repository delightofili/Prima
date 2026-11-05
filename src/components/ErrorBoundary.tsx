import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { useI18n, type Key } from "../i18n";
import { crashTestOn, crashTestSubscribe } from "../lib/crashTest";
import {
  crashReport,
  describeCrash,
  isStaleBundleError,
  recordCrash,
  toError,
  type Crash,
} from "../lib/crashLog";

export type CrashKey = Extract<Key, `crash.${string}`>;

/* ---------- what the person sees ---------- */

export interface CrashViewProps {
  t: (key: CrashKey) => string;
  stale: boolean; // the app was updated while this page was open: reloading is the whole fix
  report: string; // the text that "Copy details" copies and "Technical details" shows
  onRetry: () => void;
  onReload: () => void;
  onCopy: () => Promise<boolean>;
}

// Plain words, big buttons, nothing technical in front: the nurse learns that her saved records are safe and what to tap
export function CrashView({
  t,
  stale,
  report,
  onRetry,
  onReload,
  onCopy,
}: CrashViewProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState<boolean | null>(null);
  useEffect(() => {
    heading.current?.focus(); // a screen reader announces the problem straight away
  }, []);
  return (
    <div role="alert" className="mx-auto max-w-xl space-y-4 p-4">
      <h1
        ref={heading}
        tabIndex={-1}
        className="flex items-start gap-2 text-2xl font-bold outline-none"
      >
        <TriangleAlert
          size={28}
          className="mt-0.5 shrink-0 text-accent-500"
          aria-hidden
        />
        <span>{stale ? t("crash.staleTitle") : t("crash.title")}</span>
      </h1>
      <p className="text-lg">
        {stale ? t("crash.staleText") : t("crash.safe")}
      </p>
      {!stale && <p className="text-subtext">{t("crash.unsaved")}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        {!stale && (
          <button
            type="button"
            className="btn btn-primary sm:w-48"
            onClick={onRetry}
          >
            {t("crash.retry")}
          </button>
        )}
        <button
          type="button"
          className={`btn ${stale ? "btn-primary" : "btn-secondary"} sm:w-48`}
          onClick={onReload}
        >
          <RefreshCw size={18} className="mr-2" aria-hidden />{" "}
          {t("crash.reload")}
        </button>
        <a href="/" className="btn btn-secondary sm:w-48">
          {t("crash.home")}
        </a>
      </div>
      {!stale && <p className="text-sm text-subtext">{t("crash.tip")}</p>}
      <button
        type="button"
        className="min-h-12 font-semibold text-prima-500 underline"
        onClick={() => void onCopy().then(setCopied)}
      >
        {t("crash.copy")}
      </button>
      {copied === true && <p role="status">{t("crash.copied")}</p>}
      <details open={copied === false}>
        <summary className="min-h-12 cursor-pointer py-3 font-semibold">
          {t("crash.details")}
        </summary>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border-2 border-line bg-white p-3 text-xs">
          {report}
        </pre>
      </details>
    </div>
  );
}

function CrashScreen({
  error,
  crash,
  onRetry,
}: {
  error: Error;
  crash: Crash | null;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const report = crashReport(
    crash ?? describeCrash(error, "screen"),
    navigator.userAgent,
  );
  return (
    <CrashView
      t={t}
      stale={isStaleBundleError(error)}
      report={report}
      onRetry={onRetry}
      onReload={() => window.location.reload()}
      onCopy={async () => {
        try {
          await navigator.clipboard.writeText(report);
          return true;
        } catch {
          return false; // no clipboard here: the details are opened so they can be copied by hand
        }
      }}
    />
  );
}

/* ---------- the last fallback, if even the screen above cannot draw ---------- */

// No translation, no styles from the app, no hooks: nothing in it can fail for the same reason the app did
class Shield extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: 24,
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: 22 }}>Something went wrong.</h1>
        <p>Records you already saved are safe on this phone.</p>
        <button
          type="button"
          style={{ minHeight: 48, padding: "0 20px", fontSize: 18 }}
          onClick={() => window.location.reload()}
        >
          Reload Prima
        </button>
      </div>
    );
  }
}

/* ---------- the boundary ---------- */

interface Props {
  children: ReactNode;
  resetKey?: string; // when this changes (the person moved to another screen), a shown crash is cleared
}
interface State {
  error: Error | null;
  crash: Crash | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, crash: null };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // The component stack is kept out of the log on purpose: it can hold names of what was on screen
    void info;
    this.setState({ crash: recordCrash(error, "screen") });
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.reset();
  }

  reset = () => this.setState({ error: null, crash: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Shield>
        <CrashScreen
          error={this.state.error}
          crash={this.state.crash}
          onRetry={this.reset}
        />
      </Shield>
    );
  }
}

// A crash on one screen is cleared as soon as the person moves to another one
export function RouteBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}

// Throws while the debugging switch (see crashTest.ts) says so, to prove the crash screen works. It draws nothing.
export function CrashProbe() {
  const on = useSyncExternalStore(crashTestSubscribe, crashTestOn, crashTestOn);
  if (on) throw new Error("Test crash (on purpose, from primaCrash)");
  return null;
}
