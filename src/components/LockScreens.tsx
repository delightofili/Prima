import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { logAudit } from "../lib/audit";
import { friendlyErrorKey } from "../lib/auth";
import {
  createPin,
  readGuard,
  recordFailure,
  resetGuard,
  verifyPin,
  weakReason,
  type PinRecord,
} from "../lib/pin";
import { acknowledge } from "../lib/privacy";
import { supabase } from "../lib/supabase";
import { Field } from "./FormBits";
import { Logo } from "./Logo";
import { Modal } from "./Modal";
import { PinPad } from "./PinPad";
import { useI18n } from "../i18n";

// The confidentiality promise is legal wording: it stays in English until the privacy review (Day 27)
const ACK_TITLE = "Patient confidentiality";
const ACK_SUBTITLE = "Please read and agree before you continue.";
const ACK_AGREE = "I agree to these terms.";
const ACK_DRAFT = "Draft wording. Have it reviewed before real use.";

function LockShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-5 px-4 py-8 text-center">
      <div className="flex justify-center">
        <Logo size={44} />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-subtext">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function PinSetup({
  userId,
  onDone,
}: {
  userId: string;
  onDone: (rec: PinRecord) => void;
}) {
  const { t, tv } = useI18n();
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [padKey, setPadKey] = useState(0);

  const entered = async (pin: string) => {
    setPadKey((k) => k + 1);
    if (first === null) {
      const weak = weakReason(pin);
      if (weak) return setError(tv(weak) ?? weak);
      setError(null);
      setFirst(pin);
      return;
    }
    if (pin !== first) {
      setFirst(null);
      return setError(t("lock.differ"));
    }
    onDone(await createPin(pin, userId));
  };

  return (
    <div className="space-y-4">
      <p className="font-semibold">
        {t(first === null ? "lock.choose" : "lock.repeat")}
      </p>
      <PinPad key={padKey} onComplete={(p) => void entered(p)} />
      {error && (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function SetupScreen({
  userId,
  onDone,
}: {
  userId: string;
  onDone: (rec: PinRecord) => void;
}) {
  const { t } = useI18n();
  return (
    <LockShell title={t("lock.protectTitle")} subtitle={t("lock.protectSub")}>
      <PinSetup userId={userId} onDone={onDone} />
      <p className="text-sm text-subtext">{t("lock.protectNote")}</p>
    </LockShell>
  );
}

export function LockScreen({
  pin,
  onUnlock,
  onForgot,
}: {
  pin: PinRecord;
  onUnlock: () => void;
  onForgot: () => void;
}) {
  const { account, facility, signOut } = useAuth();
  const { t, tp } = useI18n();
  const [guard, setGuard] = useState(readGuard);
  const [now, setNow] = useState(() => Date.now());
  const [padKey, setPadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (guard.until <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [guard.until]);

  const wait = Math.max(0, Math.ceil((guard.until - now) / 1000));

  const check = async (entered: string) => {
    if (wait > 0 || guard.reset) return;
    if (await verifyPin(entered, pin)) {
      resetGuard();
      onUnlock();
      return;
    }
    const next = recordFailure();
    setGuard(next);
    setNow(Date.now());
    setPadKey((k) => k + 1);
    setError(t(next.reset ? "lock.tooMany" : "lock.wrong"));
    if (account && (next.fails === 5 || next.fails === 10)) {
      void logAudit(
        "security.pin_lockout",
        "user",
        account.userId,
        `${next.fails} wrong PIN attempts`,
      );
    }
  };

  return (
    <LockShell
      title={t("lock.locked")}
      subtitle={`${account?.name ?? ""} · ${facility?.name ?? ""}`}
    >
      {guard.reset ? (
        <p role="alert" className="rounded-xl bg-accent-50 p-3 font-medium">
          {t("lock.resetMsg")}
        </p>
      ) : (
        <>
          {wait > 0 ? (
            <p role="alert" className="font-semibold text-danger">
              {tp("lock.wait", wait)}
            </p>
          ) : (
            error && (
              <p role="alert" className="font-semibold text-danger">
                {error}
              </p>
            )
          )}
          <PinPad
            key={padKey}
            disabled={wait > 0}
            onComplete={(p) => void check(p)}
          />
        </>
      )}
      <button
        type="button"
        className="min-h-12 font-semibold text-prima-500"
        onClick={onForgot}
      >
        {t("lock.forgot")}
      </button>
      <button
        type="button"
        className="inline-flex min-h-12 items-center justify-center gap-2 text-subtext"
        onClick={() => void signOut()}
      >
        <LogOut size={18} /> {t("account.signOut")}
      </button>
    </LockShell>
  );
}

export function ForgotPinDialog({
  email,
  onVerified,
  onClose,
}: {
  email: string;
  onVerified: () => void;
  onClose: () => void;
}) {
  const { t, tv } = useI18n();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (err) return setError(tv(friendlyErrorKey(err)) ?? "");
    onVerified();
  };

  return (
    <Modal title={t("lock.newPinTitle")} onClose={onClose} top>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-subtext">{t("lock.forgotHelp")}</p>
        <Field label={t("auth.email")}>
          <input className="input" value={email} readOnly />
        </Field>
        <Field label={t("auth.password")}>
          <input
            className="input"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="font-medium text-danger">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t("auth.wait") : t("lock.continue")}
        </button>
      </form>
    </Modal>
  );
}

export function ChangePinDialog({
  pin,
  userId,
  onDone,
  onClose,
}: {
  pin: PinRecord;
  userId: string;
  onDone: (rec: PinRecord) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [padKey, setPadKey] = useState(0);

  const checkCurrent = async (entered: string) => {
    if (await verifyPin(entered, pin)) {
      setVerified(true);
      setError(null);
    } else {
      setError(t("lock.wrong"));
      setPadKey((k) => k + 1);
    }
  };

  return (
    <Modal title={t("security.changePin")} onClose={onClose}>
      {!verified ? (
        <div className="space-y-4 text-center">
          <p className="font-semibold">{t("lock.enterCurrent")}</p>
          <PinPad key={padKey} onComplete={(p) => void checkCurrent(p)} />
          {error && (
            <p role="alert" className="font-medium text-danger">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <PinSetup
            userId={userId}
            onDone={(rec) => {
              onDone(rec);
              onClose();
            }}
          />
        </div>
      )}
    </Modal>
  );
}

const COMMITMENTS = [
  "I will only open records I need in order to care for patients.",
  "I will keep my PIN and password private, and never leave an unlocked phone unattended.",
  "I will not photograph, copy or message patient records outside Prima.",
  "I will tell my facility admin straight away if my phone is lost or stolen.",
  "I understand that what I do in Prima is recorded in an audit log.",
];

export function StaffAckScreen({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { account } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <LockShell title={ACK_TITLE} subtitle={ACK_SUBTITLE}>
      <ul className="space-y-3 text-left">
        {COMMITMENTS.map((c) => (
          <li key={c} className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-prima-500" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
      <label className="flex min-h-12 items-start gap-3 rounded-xl bg-white p-3 text-left font-semibold">
        <input
          type="checkbox"
          className="mt-1 size-6 accent-prima-500"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        {ACK_AGREE}
      </label>
      <button
        type="button"
        className="btn btn-primary"
        disabled={!agreed || busy || !account}
        onClick={async () => {
          if (!account) return;
          setBusy(true);
          await acknowledge(account.userId);
          onDone();
        }}
      >
        {t("lock.continue")}
      </button>
      <p className="text-xs text-subtext">{ACK_DRAFT}</p>
    </LockShell>
  );
}
