import { Hand } from "lucide-react";
import { useGloveMode } from "../hooks/useGloveMode";
import { useI18n } from "../i18n";

export function GloveToggle() {
  const { t } = useI18n();
  const [on, toggle] = useGloveMode();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border-2 border-line bg-white px-3 text-left font-semibold"
    >
      <span className="flex items-center gap-2">
        <Hand size={20} className="text-prima-500" /> {t("glove.mode")}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full ${on ? "bg-prima-500" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white transition-all ${
            on ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
