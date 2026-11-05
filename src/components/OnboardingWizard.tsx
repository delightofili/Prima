import { useEffect, useRef, useState } from "react";
import { CircleCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { setLanguage, useI18n } from "../i18n";
import type { LangCode } from "../i18n/languages";
import { CONFIDENTIALITY, INTENDED_USE } from "../lib/noticeText";
import { isDemo } from "../lib/demo";
import {
  STEPS,
  alreadyAccepted,
  canContinue,
  flushPending,
  isDone,
  markDone,
  nextStep,
  prevStep,
  sendAcceptances,
  stepNumber,
  type Step,
} from "../lib/onboarding";
import { Modal } from "./Modal";

// A language is always shown in its own name, so a person can find theirs whatever language the screen is in now
const LANGUAGES: { code: LangCode; name: string }[] = [
  { code: "en", name: "English" },
  { code: "ig", name: "Igbo" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yorùbá" },
];

export function OnboardingWizard() {
  const { account } = useAuth();
  const userId = account?.userId ?? null;
  const { t, lang } = useI18n();
  // never in practice mode: a made-up nurse agrees to nothing, and nothing is recorded for her
  const [needed, setNeeded] = useState(() =>
    userId && !isDemo() ? !isDone(userId) : false,
  );
  const [step, setStep] = useState<Step>("language");
  const [intended, setIntended] = useState(false);
  const [confidential, setConfidential] = useState(false);
  const [saved, setSaved] = useState<"saved" | "later" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Anything agreed earlier that could not be sent is sent now, and again whenever signal returns
  useEffect(() => {
    if (!userId || isDemo()) return;
    void flushPending(userId);
    const onOnline = () => void flushPending(userId);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [userId]);

  // Already agreed on another phone? Then do not ask again.
  useEffect(() => {
    if (!needed || !userId || !navigator.onLine) return;
    let alive = true;
    void alreadyAccepted().then((yes) => {
      if (alive && yes) {
        markDone(userId);
        setNeeded(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [needed, userId]);

  useEffect(() => {
    heading.current?.focus(); // a screen reader reads the new step's title
  }, [step, needed]);

  if (!needed || !userId) return null;

  const ticks = { intended, confidential };
  const ok = canContinue(step, ticks);
  const previous = prevStep(step);

  const next = () => {
    if (!ok) return;
    if (step === "confidential") {
      markDone(userId); // agreed to both: never ask again on this phone, even if the app is closed on the last step
      void sendAcceptances(userId, lang).then(setSaved);
    }
    const to = nextStep(step);
    if (to) setStep(to);
    else setNeeded(false);
  };

  return (
    <Modal title={t("welcome.title")} dismissible={false}>
      <p aria-live="polite" className="text-sm text-subtext">
        {t("welcome.stepOf", { n: stepNumber(step), total: STEPS.length })}
      </p>

      {step === "language" && (
        <section className="space-y-3">
          <h3
            ref={heading}
            tabIndex={-1}
            className="text-xl font-bold outline-none"
          >
            {t("welcome.languageTitle")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                lang={l.code}
                aria-pressed={lang === l.code}
                className={`btn ${lang === l.code ? "btn-primary" : "btn-secondary"}`}
                onClick={() => void setLanguage(l.code).catch(() => undefined)}
              >
                {l.name}
              </button>
            ))}
          </div>
          <p className="text-sm text-subtext">{t("welcome.languageNote")}</p>
        </section>
      )}

      {step === "intended" && (
        <section className="space-y-3">
          <h3
            ref={heading}
            tabIndex={-1}
            className="text-xl font-bold outline-none"
          >
            {t("welcome.intendedTitle")}
          </h3>
          {INTENDED_USE.paragraphs.map((p) => (
            <p key={p} lang="en">
              {p}
            </p>
          ))}
          <label
            className="flex min-h-12 items-start gap-3 rounded-xl bg-prima-50 p-3 font-semibold"
            lang="en"
          >
            <input
              type="checkbox"
              className="mt-1 size-6 shrink-0"
              checked={intended}
              onChange={(e) => setIntended(e.target.checked)}
            />
            <span>{INTENDED_USE.tick}</span>
          </label>
          <p className="text-sm text-subtext">{t("welcome.englishOnly")}</p>
        </section>
      )}

      {step === "confidential" && (
        <section className="space-y-3">
          <h3
            ref={heading}
            tabIndex={-1}
            className="text-xl font-bold outline-none"
          >
            {t("welcome.confidentialTitle")}
          </h3>
          <ul className="list-disc space-y-2 pl-5" lang="en">
            {CONFIDENTIALITY.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <label
            className="flex min-h-12 items-start gap-3 rounded-xl bg-prima-50 p-3 font-semibold"
            lang="en"
          >
            <input
              type="checkbox"
              className="mt-1 size-6 shrink-0"
              checked={confidential}
              onChange={(e) => setConfidential(e.target.checked)}
            />
            <span>{CONFIDENTIALITY.tick}</span>
          </label>
          <p className="text-sm text-subtext">{t("welcome.englishOnly")}</p>
        </section>
      )}

      {step === "ready" && (
        <section className="space-y-3">
          <h3
            ref={heading}
            tabIndex={-1}
            className="flex items-center gap-2 text-xl font-bold outline-none"
          >
            <CircleCheck size={24} className="text-ok" aria-hidden />{" "}
            {t("welcome.readyTitle")}
          </h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>{t("welcome.tipRegister")}</li>
            <li>{t("welcome.tipLock")}</li>
            <li>{t("welcome.tipSync")}</li>
          </ul>
          <p role="status" className="text-sm text-subtext">
            {saved === "saved"
              ? t("welcome.saved")
              : saved === "later"
                ? t("welcome.savedLater")
                : ""}
          </p>
        </section>
      )}

      {!ok && (
        <p id="welcome-hint" className="text-sm font-medium">
          {t("welcome.tickToContinue")}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {previous ? (
          <button
            type="button"
            className="btn btn-secondary sm:w-40"
            onClick={() => setStep(previous)}
          >
            {t("welcome.back")}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="btn btn-primary sm:w-56"
          disabled={!ok}
          aria-describedby={ok ? undefined : "welcome-hint"}
          onClick={next}
        >
          {nextStep(step) ? t("welcome.next") : t("welcome.finish")}
        </button>
      </div>
    </Modal>
  );
}
