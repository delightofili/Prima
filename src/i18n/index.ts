import { useSyncExternalStore } from "react";
import {
  formatDate as fmtDate,
  formatIsoDate as fmtIsoDate,
  formatMoney as fmtMoney,
  formatNumber as fmtNumber,
  makeTranslator,
  type Dict,
  type Params,
} from "./core";
import { isLangCode, type LangCode } from "./languages";
import { en, type Key, type PluralBase } from "./locales/en";

export type { Key, PluralBase, Params };

// A message that has not been turned into words yet: logic (like the sync status) returns these, screens translate them.
export type Msg =
  | { key: Key; params?: Params }
  | { plural: PluralBase; count: number; params?: Params };

const STORAGE = "prima_lang";

// English is built in. Every other language is a separate small file, fetched when chosen and kept for offline use.
const loaders: Record<Exclude<LangCode, "en">, () => Promise<Dict>> = {
  ig: () => import("./locales/ig").then((m) => m.dict as Dict),
  ha: () => import("./locales/ha").then((m) => m.dict as Dict),
  yo: () => import("./locales/yo").then((m) => m.dict as Dict),
};

const missing = new Set<string>();
const warned = new Set<string>();
const onMissing = (key: string) => {
  missing.add(key);
  if (import.meta.env.DEV && !warned.has(key)) {
    warned.add(key);
    console.warn(`[i18n] no translation for "${key}", showing English`);
  }
};

export interface I18n {
  lang: LangCode;
  t: (key: Key, params?: Params) => string;
  tp: (base: PluralBase, count: number, params?: Params) => string;
  tm: (message: Msg) => string;
  number: (n: number) => string;
  money: (n: number) => string;
  date: (d: Date | number, style?: "short" | "medium" | "long") => string;
  isoDate: (iso: string, style?: "short" | "medium" | "long") => string;
  // Turns a message written by a form rule into words. See below.
  tv: (message: string | undefined) => string | undefined;
}

const known = (key: string): key is Key => key in en;

function build(lang: LangCode, dict: Dict): I18n {
  const { t, tp } = makeTranslator(dict, en as Dict, lang, onMissing);
  return {
    lang,
    t: (key, params) => t(key, params),
    tp: (base, count, params) => tp(base, count, params),
    tm: (m) =>
      "key" in m ? t(m.key, m.params) : tp(m.plural, m.count, m.params),
    number: (n) => fmtNumber(n, lang),
    money: (n) => fmtMoney(n, lang),
    date: (d, style) => fmtDate(d, lang, style),
    isoDate: (iso, style) => fmtIsoDate(iso, lang, style),
    // A form rule (zod) cannot call the translator, so it writes either a plain sentence, or a dictionary key such as
    // "err.dobRequired", or a key and a field name joined by | such as "err.fieldShort|register.fullName"
    // (the sentence err.fieldShort, with {label} filled by the words for register.fullName). Anything else is shown as it is.
    tv: (message) => {
      if (message === undefined) return undefined;
      const [key, label] = message.split("|");
      if (!known(key)) return message;
      return label === undefined
        ? t(key)
        : t(key, { label: known(label) ? t(label) : label });
    },
  };
}

let state: I18n = build("en", {});
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

async function activate(lang: LangCode) {
  const dict = lang === "en" ? {} : await loaders[lang]();
  state = build(lang, dict);
  document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

function saved(): LangCode {
  try {
    const v = localStorage.getItem(STORAGE);
    return isLangCode(v) ? v : "en";
  } catch {
    return "en";
  }
}

// Call once before the app is drawn, so the first screen is already in the right language (no flash of English).
// If the language file cannot be loaded, the app simply starts in English.
export async function initI18n(): Promise<void> {
  try {
    await activate(saved());
  } catch {
    await activate("en");
  }
}

export async function setLanguage(lang: LangCode): Promise<void> {
  await activate(lang); // throws if the file cannot be loaded; the screen keeps the old language
  try {
    localStorage.setItem(STORAGE, lang);
  } catch {
    /* storage unavailable: it works until the app is closed */
  }
}

export const useI18n = () => useSyncExternalStore(subscribe, () => state);
export const getMissing = () => [...missing].sort();
