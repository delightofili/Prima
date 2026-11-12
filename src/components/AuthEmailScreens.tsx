import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../i18n";
import {
  cleanCode,
  cleanEmail,
  codeComplete,
  dropCloudSession,
  emailLooksValid,
  mailErrorKey,
  passwordProblem,
  requestReset,
  resendSignup,
  secondsLeft,
  sessionMatchesPhone,
  setNewPassword,
  verifyCode,
  verifyLink,
  type AuthLink,
} from "../lib/emailAuth";
import { ErrorText, PasswordInput, Shell } from "./AuthScreens";
import { Field } from "./FormBits";

// Is the phone online right now? These steps need the internet, so the buttons say so instead of failing.
function useOnline() {
  const [on, setOn] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return on;
}

// Counts down the seconds before "send again" is allowed
function useCountdown(sentAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  const wait = secondsLeft(sentAt, now);
  const ticking = wait > 0;
  useEffect(() => {
    if (!ticking) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [ticking]);
  return { wait, refresh: () => setNow(Date.now()) };
}

function CodeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Field label={t("authMail.codeLabel")} hint={t("authMail.codeHint")}>
      <input
        className="input text-2xl tracking-widest"
        value={value}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={14}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

// 1. Shown after "create account", and when someone tries to sign in before confirming their email
export function CheckEmailScreen() {
  const { awaiting, backToSignIn, continueAfterEmail } = useAuth();
  const { t, tv } = useI18n();
  const online = useOnline();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(awaiting?.sentAt ?? null);
  const { wait, refresh } = useCountdown(sentAt);
  if (!awaiting) return null;
  const say = (err: unknown) =>
    tv(mailErrorKey(err)) || t("authMail.errGeneric");

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNote(null);
    const c = cleanCode(code);
    if (!codeComplete(c)) return setError(t("authMail.errCodeShort"));
    setBusy(true);
    try {
      await verifyCode(awaiting.email, c, "signup");
      await continueAfterEmail();
    } catch (err) {
      setError(say(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      await resendSignup(awaiting.email);
      setSentAt(Date.now());
      refresh();
      setNote(t("authMail.resent"));
    } catch (err) {
      setError(say(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title={t("authMail.checkTitle")}
      subtitle={t("authMail.checkBody", { email: awaiting.email })}
    >
      <form onSubmit={confirm} className="space-y-4" noValidate>
        <CodeField value={code} onChange={setCode} />
        <ErrorText text={error} />
        {note && (
          <p role="status" className="font-medium">
            {note}
          </p>
        )}
        {!online && <p className="text-subtext">{t("authMail.offline")}</p>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || !online}
        >
          {busy ? t("authMail.confirming") : t("authMail.confirm")}
        </button>
      </form>
      <p className="text-subtext">{t("authMail.spam")}</p>
      <div className="space-y-2 border-t-2 border-line pt-4">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || wait > 0 || !online}
          onClick={resend}
        >
          {wait > 0
            ? t("authMail.resendWait", { seconds: wait })
            : t("authMail.resend")}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={backToSignIn}
        >
          {t("authMail.useOther")}
        </button>
        <button
          type="button"
          className="py-3 text-left font-semibold underline"
          onClick={backToSignIn}
        >
          {t("authMail.haveAccount")}
        </button>
      </div>
    </Shell>
  );
}

// 2. "Forgot your password?": ask for the email, then the code and a new password on the same screen
export function ForgotPasswordScreen() {
  const { backToSignIn, continueAfterEmail } = useAuth();
  const { t, tv } = useI18n();
  const online = useOnline();
  const [step, setStep] = useState<"ask" | "enter">("ask");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [verified, setVerified] = useState(false); // a code works once: if the new password is refused, do not use the code again
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const { wait, refresh } = useCountdown(sentAt);
  const say = (err: unknown) =>
    tv(mailErrorKey(err)) || t("authMail.errGeneric");

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setNote(null);
    const address = cleanEmail(email);
    setEmail(address);
    if (!emailLooksValid(address)) return setError(t("auth.errEmail"));
    setBusy(true);
    try {
      await requestReset(address);
    } catch (err) {
      const k = mailErrorKey(err);
      if (k === "authErr.network" || k === "authErr.rate") {
        setError(say(err));
        setBusy(false);
        return;
      }
      // Any other answer looks exactly like success: nobody can find out which addresses have an account
    }
    setSentAt(Date.now());
    refresh();
    setNote(t("authMail.sentGeneric"));
    setStep("enter");
    setBusy(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const c = cleanCode(code);
    if (!codeComplete(c)) return setError(t("authMail.errCodeShort"));
    const problem = passwordProblem(pw, again);
    if (problem) return setError(tv(problem) || t("authMail.errGeneric"));
    setBusy(true);
    try {
      if (!verified) {
        await verifyCode(email, c, "recovery");
        setVerified(true);
      }
      await setNewPassword(pw);
      await continueAfterEmail();
    } catch (err) {
      setError(say(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title={t("authMail.forgotTitle")}
      subtitle={
        step === "ask"
          ? t("authMail.forgotBody")
          : t("authMail.checkBody", { email: email.trim() })
      }
    >
      {step === "ask" ? (
        <form onSubmit={send} className="space-y-4" noValidate>
          <Field label={t("auth.email")}>
            <input
              className="input"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <ErrorText text={error} />
          {!online && <p className="text-subtext">{t("authMail.offline")}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !online}
          >
            {busy ? t("authMail.confirming") : t("authMail.sendCode")}
          </button>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {note && (
            <p
              role="status"
              className="rounded-xl bg-accent-50 p-3 font-medium"
            >
              {note}
            </p>
          )}
          <CodeField value={code} onChange={setCode} />
          <Field
            label={t("authMail.newPassword")}
            hint={t("auth.passwordHint")}
          >
            <PasswordInput
              value={pw}
              onChange={setPw}
              autoComplete="new-password"
            />
          </Field>
          <Field label={t("authMail.repeatPassword")}>
            <PasswordInput
              value={again}
              onChange={setAgain}
              autoComplete="new-password"
            />
          </Field>
          <ErrorText text={error} />
          {!online && <p className="text-subtext">{t("authMail.offline")}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !online}
          >
            {busy ? t("authMail.confirming") : t("authMail.savePassword")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy || wait > 0 || !online}
            onClick={() => void send()}
          >
            {wait > 0
              ? t("authMail.resendWait", { seconds: wait })
              : t("authMail.resend")}
          </button>
        </form>
      )}
      <div className="border-t-2 border-line pt-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={backToSignIn}
        >
          {t("authMail.backSignIn")}
        </button>
      </div>
    </Shell>
  );
}

const goTo = (path: string) => window.location.replace(path);

// 3. The page the link in the email opens. Nothing is used up until the person presses the button.
export function AuthLinkScreen({
  link,
  go = goTo,
}: {
  link: AuthLink | "invalid";
  go?: (path: string) => void;
}) {
  const { t, tv } = useI18n();
  const online = useOnline();
  const [phase, setPhase] = useState<
    "ask" | "newPassword" | "done" | "otherUser"
  >("ask");
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const say = (err: unknown) =>
    tv(mailErrorKey(err)) || t("authMail.errGeneric");
  const recovery = link !== "invalid" && link.type === "recovery";

  // A shared phone must never mix two people: if someone else is signed in here, finish quietly and sign this session out
  const finish = async (next: "done" | "newPassword") => {
    if (await sessionMatchesPhone()) return setPhase(next);
    await dropCloudSession();
    setPhase("otherUser");
  };

  const verify = async () => {
    if (link === "invalid") return;
    setError(null);
    setBusy(true);
    try {
      await verifyLink(link);
      if (recovery) setPhase("newPassword");
      else await finish("done");
    } catch (err) {
      setError(say(err));
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem = passwordProblem(pw, again);
    if (problem) return setError(tv(problem) || t("authMail.errGeneric"));
    setBusy(true);
    try {
      await setNewPassword(pw);
      await finish("done");
    } catch (err) {
      setError(say(err));
    } finally {
      setBusy(false);
    }
  };

  const back = (
    <button type="button" className="btn btn-secondary" onClick={() => go("/")}>
      {t("authMail.backSignIn")}
    </button>
  );

  if (link === "invalid")
    return (
      <Shell title={t("authMail.linkTitle")}>
        <ErrorText text={t("authMail.linkBad")} />
        {back}
      </Shell>
    );

  if (phase === "done")
    return (
      <Shell
        title={recovery ? t("authMail.passwordDone") : t("authMail.linkDone")}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => go("/")}
        >
          {t("authMail.continue")}
        </button>
      </Shell>
    );

  if (phase === "otherUser")
    return (
      <Shell title={t("authMail.linkDone")}>
        <p role="status" className="font-medium">
          {t("authMail.otherUser")}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => go("/")}
        >
          {t("authMail.continue")}
        </button>
      </Shell>
    );

  if (phase === "newPassword")
    return (
      <Shell title={t("authMail.newTitle")}>
        <form onSubmit={savePassword} className="space-y-4" noValidate>
          <Field
            label={t("authMail.newPassword")}
            hint={t("auth.passwordHint")}
          >
            <PasswordInput
              value={pw}
              onChange={setPw}
              autoComplete="new-password"
            />
          </Field>
          <Field label={t("authMail.repeatPassword")}>
            <PasswordInput
              value={again}
              onChange={setAgain}
              autoComplete="new-password"
            />
          </Field>
          <ErrorText text={error} />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !online}
          >
            {busy ? t("authMail.confirming") : t("authMail.savePassword")}
          </button>
        </form>
      </Shell>
    );

  return (
    <Shell
      title={recovery ? t("authMail.forgotTitle") : t("authMail.linkTitle")}
      subtitle={recovery ? undefined : t("authMail.linkBody")}
    >
      <ErrorText text={error} />
      {!online && <p className="text-subtext">{t("authMail.offline")}</p>}
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy || !online}
        onClick={verify}
      >
        {busy
          ? t("authMail.confirming")
          : recovery
            ? t("authMail.continue")
            : t("authMail.confirm")}
      </button>
      {back}
    </Shell>
  );
}
