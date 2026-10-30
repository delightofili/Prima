import { useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { eraseLocalDataOnly, friendlyErrorKey, suggestCode } from "../lib/auth";
import { Field } from "./FormBits";
import { Logo } from "./Logo";
import { Modal } from "./Modal";
import { useI18n } from "../i18n";

// An example of what a facility name looks like, shown in the empty box
const FACILITY_EXAMPLE = "Awka North PHC";

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 px-4 py-8">
      <div className="flex justify-center">
        <Logo size={44} />
      </div>
      <section className="card space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-subtext">{subtitle}</p>}
        </div>
        {children}
      </section>
    </div>
  );
}

function ErrorText({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="font-medium text-danger">
      {text}
    </p>
  );
}

function PasswordInput({
  value,
  onChange,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        className="input pr-12"
        type={show ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-3 text-subtext"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}

function Segments<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`btn ${value === o.id ? "btn-primary" : "btn-secondary"}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Splash() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Logo size={48} />
      <p className="text-subtext">{t("auth.opening")}</p>
    </div>
  );
}

export function WelcomeScreen() {
  const { signIn, signUp, notice } = useAuth();
  const { t, tv } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "up" && name.trim().length < 2)
      return setError(t("auth.errName"));
    if (!email.includes("@")) return setError(t("auth.errEmail"));
    if (password.length < 8) return setError(t("auth.errPassword"));

    setBusy(true);
    try {
      if (mode === "in") await signIn(email, password);
      else await signUp(name, email, password);
    } catch (err) {
      setError(tv(friendlyErrorKey(err)) ?? "");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title={t("home.welcome")} subtitle={t("auth.tagline")}>
      {notice && (
        <p className="rounded-xl bg-accent-50 p-3 font-medium" role="status">
          {notice}
        </p>
      )}
      <Segments
        value={mode}
        onChange={setMode}
        options={[
          { id: "in", label: t("auth.signIn") },
          { id: "up", label: t("auth.createAccount") },
        ]}
      />
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === "up" && (
          <Field label={t("auth.yourName")}>
            <input
              className="input"
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}
        <Field label={t("auth.email")}>
          <input
            className="input"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label={t("auth.password")}
          hint={mode === "up" ? t("auth.passwordHint") : undefined}
        >
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
          />
        </Field>
        <ErrorText text={error} />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy
            ? t("auth.wait")
            : mode === "in"
              ? t("auth.signIn")
              : t("auth.createAccount")}
        </button>
      </form>
      <p className="text-sm text-subtext">{t("auth.needInternet")}</p>
    </Shell>
  );
}

export function FacilityChooser() {
  const { pendingEmail, createFacility, joinFacility, signOut } = useAuth();
  const { t, tv } = useI18n();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [lga, setLga] = useState("");
  const [state, setState] = useState("Anambra");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(tv(friendlyErrorKey(e)) ?? "");
    } finally {
      setBusy(false);
    }
  };

  const onNameChange = (v: string) => {
    setName(v);
    if (!codeTouched) setCode(suggestCode(v));
  };

  const submitCreate = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) return setError(t("auth.errFacilityName"));
    if (!/^[A-Z]{2,5}$/.test(code)) return setError(t("auth.errFacilityCode"));
    if (lga.trim().length < 2 || state.trim().length < 2)
      return setError(t("auth.errLgaState"));
    void run(() => createFacility({ name, code, lga, state }));
  };

  const submitJoin = (e: FormEvent) => {
    e.preventDefault();
    if (invite.replace(/[^a-z0-9]/gi, "").length < 8)
      return setError(t("auth.errInvite"));
    void run(() => joinFacility(invite));
  };

  return (
    <Shell
      title={t("auth.setupTitle")}
      subtitle={
        pendingEmail ? t("auth.signedInAs", { email: pendingEmail }) : undefined
      }
    >
      <Segments
        value={mode}
        onChange={(m) => {
          setError(null);
          setMode(m);
        }}
        options={[
          { id: "create", label: t("auth.createFacility") },
          { id: "join", label: t("auth.joinWithCode") },
        ]}
      />

      {mode === "create" ? (
        <form onSubmit={submitCreate} className="space-y-4" noValidate>
          <p className="text-subtext">{t("auth.adminNote")}</p>
          <Field label={t("auth.facilityName")}>
            <input
              className="input"
              value={name}
              placeholder={FACILITY_EXAMPLE}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </Field>
          <Field
            label={t("auth.facilityCode")}
            hint={t("auth.facilityCodeHint")}
          >
            <input
              className="input uppercase"
              value={code}
              maxLength={5}
              onChange={(e) => {
                setCodeTouched(true);
                setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""));
              }}
            />
          </Field>
          <Field label={t("facility.lga")}>
            <input
              className="input"
              value={lga}
              onChange={(e) => setLga(e.target.value)}
            />
          </Field>
          <Field label={t("facility.state")}>
            <input
              className="input"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </Field>
          <ErrorText text={error} />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t("auth.wait") : t("auth.createFacilityBtn")}
          </button>
        </form>
      ) : (
        <form onSubmit={submitJoin} className="space-y-4" noValidate>
          <p className="text-subtext">{t("auth.joinHelp")}</p>
          <Field label={t("auth.inviteCode")}>
            <input
              className="input font-mono uppercase tracking-widest"
              value={invite}
              onChange={(e) => setInvite(e.target.value.toUpperCase())}
              autoComplete="off"
            />
          </Field>
          <ErrorText text={error} />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t("auth.wait") : t("auth.joinFacility")}
          </button>
        </form>
      )}

      <button
        type="button"
        className="min-h-12 font-semibold text-prima-500"
        onClick={() => void signOut()}
      >
        {t("auth.differentAccount")}
      </button>
    </Shell>
  );
}

export function AccessEndedScreen() {
  const { facility, eraseAndSignOut } = useAuth();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <Shell title={t("auth.endedTitle")}>
      <p className="flex items-start gap-3">
        <ShieldAlert size={24} className="mt-0.5 shrink-0 text-danger" />
        <span>{t("auth.endedBody", { name: facility?.name ?? "" })}</span>
      </p>
      <button
        type="button"
        className="btn bg-danger text-white hover:brightness-90"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void eraseAndSignOut();
        }}
      >
        <LogOut size={20} className="mr-2" /> {t("auth.eraseSignOut")}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => window.location.reload()}
      >
        {t("auth.checkAgain")}
      </button>
    </Shell>
  );
}

export function ForeignDataDialog({ unsynced }: { unsynced: number }) {
  const { signOut } = useAuth();
  const { t, tp } = useI18n();
  return (
    <Modal title={t("auth.foreignTitle")} dismissible={false}>
      <p>{t("auth.foreignBody")}</p>
      {unsynced > 0 && (
        <p className="rounded-xl bg-accent-50 p-3 font-medium">
          {tp("auth.unsynced", unsynced)}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          className="btn btn-secondary md:w-40"
          onClick={() => void signOut()}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className="btn bg-danger text-white hover:brightness-90 md:w-48"
          onClick={() => void eraseLocalDataOnly()}
        >
          {t("auth.eraseContinue")}
        </button>
      </div>
    </Modal>
  );
}

export function ReauthDialog({ onClose }: { onClose: () => void }) {
  const { account, signIn } = useAuth();
  const { t, tv } = useI18n();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setError(null);
    setBusy(true);
    try {
      await signIn(account.email, password);
      onClose();
    } catch (err) {
      setError(tv(friendlyErrorKey(err)) ?? "");
      setBusy(false);
    }
  };

  return (
    <Modal title={t("auth.signInAgain")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-subtext">{t("auth.reauthHelp")}</p>
        <Field label={t("auth.email")}>
          <input className="input" value={account?.email ?? ""} readOnly />
        </Field>
        <Field label={t("auth.password")}>
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        </Field>
        <ErrorText text={error} />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t("auth.wait") : t("auth.signIn")}
        </button>
      </form>
    </Modal>
  );
}
