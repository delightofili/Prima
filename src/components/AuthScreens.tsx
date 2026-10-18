import { useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { eraseLocalDataOnly, friendlyError, suggestCode } from "../lib/auth";
import { Field } from "./FormBits";
import { Logo } from "./Logo";
import { Modal } from "./Modal";

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
        aria-label={show ? "Hide password" : "Show password"}
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
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Logo size={48} />
      <p className="text-subtext">Opening Prima…</p>
    </div>
  );
}

export function WelcomeScreen() {
  const { signIn, signUp, notice } = useAuth();
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
      return setError("Enter your name.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 8)
      return setError("Use a password of at least 8 characters.");

    setBusy(true);
    try {
      if (mode === "in") await signIn(email, password);
      else await signUp(name, email, password);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title="Welcome to Prima"
      subtitle="Patient records for your clinic that work with no network."
    >
      {notice && (
        <p className="rounded-xl bg-accent-50 p-3 font-medium" role="status">
          {notice}
        </p>
      )}
      <Segments
        value={mode}
        onChange={setMode}
        options={[
          { id: "in", label: "Sign in" },
          { id: "up", label: "Create account" },
        ]}
      />
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === "up" && (
          <Field label="Your name">
            <input
              className="input"
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}
        <Field label="Email">
          <input
            className="input"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label="Password"
          hint={mode === "up" ? "At least 8 characters." : undefined}
        >
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
          />
        </Field>
        <ErrorText text={error} />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-subtext">
        You need internet to sign in. After that, Prima opens and works with no
        network.
      </p>
    </Shell>
  );
}

export function FacilityChooser() {
  const { pendingEmail, createFacility, joinFacility, signOut } = useAuth();
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
      setError(friendlyError(e));
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
    if (name.trim().length < 3) return setError("Enter the facility name.");
    if (!/^[A-Z]{2,5}$/.test(code))
      return setError(
        "The facility code must be 2 to 5 letters, for example ANK.",
      );
    if (lga.trim().length < 2 || state.trim().length < 2)
      return setError("Enter the LGA and the state.");
    void run(() => createFacility({ name, code, lga, state }));
  };

  const submitJoin = (e: FormEvent) => {
    e.preventDefault();
    if (invite.replace(/[^a-z0-9]/gi, "").length < 8)
      return setError("Enter the invite code you were given.");
    void run(() => joinFacility(invite));
  };

  return (
    <Shell
      title="Set up your facility"
      subtitle={pendingEmail ? `Signed in as ${pendingEmail}` : undefined}
    >
      <Segments
        value={mode}
        onChange={(m) => {
          setError(null);
          setMode(m);
        }}
        options={[
          { id: "create", label: "Create a facility" },
          { id: "join", label: "Join with a code" },
        ]}
      />

      {mode === "create" ? (
        <form onSubmit={submitCreate} className="space-y-4" noValidate>
          <p className="text-subtext">
            You become the facility's admin and can invite your staff.
          </p>
          <Field label="Facility name">
            <input
              className="input"
              value={name}
              placeholder="Awka North PHC"
              onChange={(e) => onNameChange(e.target.value)}
            />
          </Field>
          <Field
            label="Facility code"
            hint="2 to 5 letters. It starts every card number, like ANK-7K3F9Q."
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
          <Field label="LGA">
            <input
              className="input"
              value={lga}
              onChange={(e) => setLga(e.target.value)}
            />
          </Field>
          <Field label="State">
            <input
              className="input"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </Field>
          <ErrorText text={error} />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Please wait…" : "Create facility"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitJoin} className="space-y-4" noValidate>
          <p className="text-subtext">
            Ask your facility admin for an invite code. Each code works once.
          </p>
          <Field label="Invite code">
            <input
              className="input font-mono uppercase tracking-widest"
              value={invite}
              onChange={(e) => setInvite(e.target.value.toUpperCase())}
              autoComplete="off"
            />
          </Field>
          <ErrorText text={error} />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Please wait…" : "Join facility"}
          </button>
        </form>
      )}

      <button
        type="button"
        className="min-h-12 font-semibold text-prima-500"
        onClick={() => void signOut()}
      >
        Use a different account
      </button>
    </Shell>
  );
}

export function AccessEndedScreen() {
  const { facility, eraseAndSignOut } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <Shell title="Your access has ended">
      <p className="flex items-start gap-3">
        <ShieldAlert size={24} className="mt-0.5 shrink-0 text-danger" />
        <span>
          You no longer belong to <strong>{facility?.name}</strong>, so its
          patient records can't be opened on this phone. Erase this phone's copy
          and sign out to protect the patients' privacy.
        </span>
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
        <LogOut size={20} className="mr-2" /> Erase this phone and sign out
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => window.location.reload()}
      >
        Check again (I think this is a mistake)
      </button>
    </Shell>
  );
}

export function ForeignDataDialog({ unsynced }: { unsynced: number }) {
  const { signOut } = useAuth();
  return (
    <Modal
      title="This phone has another facility's records"
      dismissible={false}
    >
      <p>
        Records from a different facility are stored on this phone. They must be
        erased before you can continue, so the two facilities' patients never
        mix.
      </p>
      {unsynced > 0 && (
        <p className="rounded-xl bg-accent-50 p-3 font-medium">
          {unsynced} {unsynced === 1 ? "change has" : "changes have"} not been
          synced yet and will be lost. Sign in to the other facility first if
          that matters.
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          className="btn btn-secondary md:w-40"
          onClick={() => void signOut()}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn bg-danger text-white hover:brightness-90 md:w-48"
          onClick={() => void eraseLocalDataOnly()}
        >
          Erase and continue
        </button>
      </div>
    </Modal>
  );
}

export function ReauthDialog({ onClose }: { onClose: () => void }) {
  const { account, signIn } = useAuth();
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
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  return (
    <Modal title="Sign in again" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-subtext">
          Your records are safe on this phone. Signing in again lets them sync.
        </p>
        <Field label="Email">
          <input className="input" value={account?.email ?? ""} readOnly />
        </Field>
        <Field label="Password">
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        </Field>
        <ErrorText text={error} />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Please wait…" : "Sign in"}
        </button>
      </form>
    </Modal>
  );
}
