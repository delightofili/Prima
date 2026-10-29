// The translation engine: no libraries, no browser APIs, so it can be tested on its own.

export type Params = Record<string, string | number>;
export type Dict = Record<string, string>;

// "Hello {name}" with { name: "Ngozi" } becomes "Hello Ngozi". A {blank} with no value is left as it is, so a mistake is visible.
export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

// Which form of a word to use for a number. English has "one" and "other"; Igbo and Yoruba have only "other".
// A dictionary stores them as  patients_one / patients_other.
export function pickPlural(
  dict: Dict,
  base: string,
  count: number,
  locale: string,
): string | undefined {
  const category = new Intl.PluralRules(locale).select(count);
  return dict[`${base}_${category}`] ?? dict[`${base}_other`];
}

export interface Translator {
  t: (key: string, params?: Params) => string;
  tp: (base: string, count: number, params?: Params) => string;
}

// primary = the chosen language, fallback = English. A missing word shows the English one, never a blank or a raw key.
export function makeTranslator(
  primary: Dict,
  fallback: Dict,
  locale: string,
  onMissing?: (key: string) => void,
): Translator {
  const t = (key: string, params?: Params) => {
    let raw = primary[key];
    if (raw === undefined) {
      onMissing?.(key);
      raw = fallback[key];
    }
    return interpolate(raw ?? key, params);
  };
  const tp = (base: string, count: number, params?: Params) => {
    const all = { count, ...params };
    const own = pickPlural(primary, base, count, locale);
    if (own !== undefined) return interpolate(own, all);
    onMissing?.(`${base}_other`);
    return interpolate(pickPlural(fallback, base, count, "en") ?? base, all);
  };
  return { t, tp };
}

// ---------- formats: numbers and dates in the person's own language, with a safe fallback ----------

const TAGS: Record<string, string> = {
  en: "en-NG",
  ig: "ig-NG",
  ha: "ha-NG",
  yo: "yo-NG",
};

// Some phones do not know every language's calendar. Then Nigerian English is used rather than an error.
export function localeFor(lang: string): string {
  const tag = TAGS[lang] ?? "en-NG";
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([tag]).length > 0
      ? tag
      : "en-NG";
  } catch {
    return "en-NG";
  }
}

export const formatNumber = (n: number, lang: string) =>
  new Intl.NumberFormat(localeFor(lang)).format(n);

export const formatDate = (
  date: Date | number,
  lang: string,
  style: "short" | "medium" | "long" = "medium",
) =>
  new Intl.DateTimeFormat(localeFor(lang), { dateStyle: style }).format(date);
