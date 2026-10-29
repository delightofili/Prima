import { useEffect, useMemo, useState } from "react";
import { Copy, Languages } from "lucide-react";
import { SectionTitle } from "../components/FormBits";
import { PageHeader } from "../components/PageHeader";
import { usePageTitle } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { en } from "../i18n/locales/en";

// For the person who checks a translation. English on the left, the translation on the right, and what needs a look.
// This is a staff tool, so its own words stay in English.
const FILES: Record<string, () => Promise<{ dict: Record<string, string> }>> = {
  ig: () => import("../i18n/locales/ig"),
};
const NAMES: Record<string, string> = { ig: "Igbo" };

type Flag = "missing" | "same" | "long";
const english = en as Record<string, string>;

export function TranslationsPage() {
  usePageTitle("Translations");
  const toast = useToast();
  const { role } = useAuth();
  const [lang] = useState("ig"); // Hausa and Yoruba join this list on Day 22
  const [dict, setDict] = useState<Record<string, string> | null>(null);
  const [onlyCheck, setOnlyCheck] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    void FILES[lang]().then((m) => {
      if (alive) setDict(m.dict);
    });
    return () => {
      alive = false;
    };
  }, [lang]);

  const rows = useMemo(() => {
    if (!dict) return [];
    const categories = new Set(
      new Intl.PluralRules(lang).resolvedOptions().pluralCategories,
    );
    return Object.keys(english)
      .filter((k) => {
        const m = /_(zero|one|two|few|many|other)$/.exec(k);
        return !m || categories.has(m[1] as Intl.LDMLPluralRule); // a language with no singular form does not need _one lines
      })
      .map((key) => {
        const value = dict[key];
        const flags: Flag[] = [];
        if (value === undefined) flags.push("missing");
        else {
          if (value === english[key] && english[key].length > 4)
            flags.push("same");
          if (
            english[key].length >= 18 &&
            value.length > english[key].length * 1.8
          )
            flags.push("long");
        }
        return { key, en: english[key], value, flags };
      });
  }, [dict, lang]);

  if (role !== "admin") {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-lg font-semibold">
          Only a facility admin can open this page.
        </p>
      </div>
    );
  }

  const shown = rows.filter(
    (r) =>
      (!onlyCheck || r.flags.length > 0) &&
      (!search ||
        `${r.key} ${r.en} ${r.value ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  const done = rows.filter((r) => r.value !== undefined).length;

  const copyCsv = async () => {
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = [
      "key,english,translation",
      ...rows.map((r) => [q(r.key), q(r.en), q(r.value ?? "")].join(",")),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(csv);
      toast("Copied. Paste it into a spreadsheet and send it to the reviewer.");
    } catch {
      toast("Could not copy. Try again.", "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Translations"
        subtitle="Check what a language says, side by side with English."
      />
      <section className="card space-y-4">
        <SectionTitle
          icon={Languages}
          title={`${NAMES[lang]}: ${done} of ${rows.length} lines translated`}
        />
        <p className="text-subtext">
          To change a line, edit <code>src/i18n/locales/{lang}.ts</code> and
          keep every {"{blank}"} exactly as it is. Names of conditions,
          complaints and medicines stay in English on purpose.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="input sm:max-w-xs"
            placeholder="Search"
            aria-label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="flex min-h-12 items-center gap-3 font-medium">
            <input
              type="checkbox"
              className="size-6 accent-prima-500"
              checked={onlyCheck}
              onChange={(e) => setOnlyCheck(e.target.checked)}
            />
            Only lines that need a look
          </label>
          <button
            type="button"
            className="btn btn-secondary sm:ml-auto sm:w-56"
            onClick={() => void copyCsv()}
          >
            <Copy size={20} className="mr-2" /> Copy for a reviewer
          </button>
        </div>

        <ul className="space-y-2">
          {shown.map((r) => (
            <li
              key={r.key}
              className="grid gap-1 rounded-xl bg-page p-3 text-sm md:grid-cols-[14rem_1fr_1fr] md:gap-4"
            >
              <code className="break-all text-xs text-subtext">{r.key}</code>
              <span>{r.en}</span>
              <span
                lang={lang}
                className={
                  r.value === undefined ? "font-semibold text-danger" : ""
                }
              >
                {r.value ?? "Missing: English is shown"}
                {r.flags.includes("same") && (
                  <span className="ml-2 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-bold">
                    same as English
                  </span>
                )}
                {r.flags.includes("long") && (
                  <span className="ml-2 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-bold">
                    long
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {shown.length === 0 && <p className="text-subtext">Nothing to show.</p>}
      </section>
    </>
  );
}
