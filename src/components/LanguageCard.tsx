import { useState } from "react";
import { Link } from "react-router-dom";
import { Languages } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { setLanguage, useI18n } from "../i18n";
import { LANGUAGES } from "../i18n/languages";
import { SectionTitle } from "./FormBits";

// Always shows both "Language" and "Asụsụ", so someone who switched to a language by mistake can find their way back.
export function LanguageCard() {
  const { lang, t } = useI18n();
  const { role } = useAuth();
  const [failed, setFailed] = useState(false);

  const choose = async (code: (typeof LANGUAGES)[number]["code"]) => {
    setFailed(false);
    try {
      await setLanguage(code);
    } catch {
      setFailed(true);
    }
  };

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={Languages} title="Language · Asụsụ" />
      <p className="text-subtext">{t("lang.help")}</p>

      <div
        role="radiogroup"
        aria-label={t("lang.heading")}
        className="grid gap-2 sm:grid-cols-2"
      >
        {LANGUAGES.map((l) => {
          const on = lang === l.code;
          const disabled = l.status === "soon";
          return (
            <label
              key={l.code}
              className={`flex min-h-14 items-center gap-3 rounded-xl border-2 p-3 ${
                on ? "border-prima-500 bg-prima-50" : "border-line bg-white"
              } ${disabled ? "opacity-60" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="language"
                className="size-6 accent-prima-500"
                checked={on}
                disabled={disabled}
                onChange={() => void choose(l.code)}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{l.native}</span>
                {l.native !== l.english && (
                  <span className="block text-sm text-subtext">
                    {l.english}
                  </span>
                )}
              </span>
              {l.status === "draft" && (
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-bold">
                  {t("lang.draftBadge")}
                </span>
              )}
              {l.status === "soon" && (
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-bold">
                  {t("lang.soonBadge")}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {LANGUAGES.find((l) => l.code === lang)?.status === "draft" && (
        <p className="rounded-xl bg-accent-50 p-3 text-sm font-medium">
          {t("lang.draftNote")}
        </p>
      )}
      {lang !== "en" && (
        <p className="text-sm text-subtext">{t("lang.someEnglish")}</p>
      )}
      {role === "admin" && (
        <Link
          to="/translations"
          className="inline-block min-h-12 font-semibold text-prima-500 underline"
        >
          Review translations (admins)
        </Link>
      )}
      {failed && (
        <p role="alert" className="rounded-xl bg-accent-50 p-3 font-medium">
          {t("lang.loadFailed")}
        </p>
      )}
    </section>
  );
}
