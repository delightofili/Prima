import { VACCINES } from "../lib/vaccines";
import { todayISO } from "../lib/utils";
import { useI18n } from "../i18n";

interface Props {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

export function ImmunizationChecklist({ value, onChange }: Props) {
  const { t } = useI18n();
  const toggle = (key: string, on: boolean) => {
    const next = { ...value };
    if (on) next[key] = todayISO();
    else delete next[key];
    onChange(next);
  };

  return (
    <section className="space-y-3 rounded-2xl border-2 border-accent-500/40 bg-accent-50 p-4">
      <div>
        <h3 className="text-lg font-semibold">{t("vaccine.alreadyGiven")}</h3>
        <p className="text-subtext">{t("vaccine.tickHelp")}</p>
      </div>
      <ul className="space-y-2">
        {VACCINES.filter((v) => v.quick).map((v) => {
          const checked = v.key in value;
          return (
            <li key={v.key} className="flex items-center justify-between gap-3">
              <label className="flex min-h-12 flex-1 items-center gap-3 text-base font-medium">
                <input
                  type="checkbox"
                  className="size-6 accent-prima-500"
                  checked={checked}
                  onChange={(e) => toggle(v.key, e.target.checked)}
                />
                {v.label}
              </label>
              {checked && (
                <input
                  type="date"
                  className="input w-44"
                  max={todayISO()}
                  value={value[v.key]}
                  onChange={(e) =>
                    onChange({ ...value, [v.key]: e.target.value })
                  }
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
