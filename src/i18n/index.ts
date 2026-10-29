import { useSyncExternalStore } from "react";
import {
  formatDate as fmtDate,
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
  ha: () => Promise.reject(new Error("Hausa is not ready yet")),
  yo: () => Promise.reject(new Error("Yoruba is not ready yet")),
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
  date: (d: Date | number, style?: "short" | "medium" | "long") => string;
}

function build(lang: LangCode, dict: Dict): I18n {
  const { t, tp } = makeTranslator(dict, en as Dict, lang, onMissing);
  return {
    lang,
    t: (key, params) => t(key, params),
    tp: (base, count, params) => tp(base, count, params),
    tm: (m) =>
      "key" in m ? t(m.key, m.params) : tp(m.plural, m.count, m.params),
    number: (n) => fmtNumber(n, lang),
    date: (d, style) => fmtDate(d, lang, style),
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
