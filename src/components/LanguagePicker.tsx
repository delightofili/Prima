import { useState } from "react";
import { Languages } from "lucide-react";
import { setLanguage, useI18n } from "../i18n";
import { isLangCode } from "../i18n/languages";

// Each language is written in its own name, so a person can find theirs even when the screen is in a language they cannot read
const NAMES = { en: "English", ig: "Igbo", ha: "Hausa", yo: "Yorùbá" } as const;

// On the sign in screens, where nobody has chosen a language yet. The choice is kept on this phone (see setLanguage),
// so it is still there the next time the app opens, and after signing out.
export function LanguagePicker() {
  const { t, lang } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const change = async (value: string) => {
    if (!isLangCode(value) || value === lang) return;
    setError(null);
    setBusy(true);
    try {
      await setLanguage(value);
    } catch {
      setError(t("lang.loadFailed")); // a language file is fetched the first time: it needs the internet once
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <Languages size={18} aria-hidden="true" />
        <span>{t("lang.heading")}</span>
        <select
          className="input h-11 w-auto py-0 pr-8"
          value={lang}
          disabled={busy}
          onChange={(e) => void change(e.target.value)}
        >
          {(Object.keys(NAMES) as (keyof typeof NAMES)[]).map((code) => (
            <option key={code} value={code}>
              {NAMES[code]}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
