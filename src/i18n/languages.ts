export type LangCode = "en" | "ig" | "ha" | "yo";

// status: base = the language the app is written in; draft = translated but still being checked by native speakers;
// reviewed = checked; soon = not translated yet, shown greyed out
export type LangStatus = "base" | "draft" | "reviewed" | "soon";

export interface LanguageInfo {
  code: LangCode;
  english: string;
  native: string;
  status: LangStatus;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", english: "English", native: "English", status: "base" },
  { code: "ig", english: "Igbo", native: "Asụsụ Igbo", status: "draft" },
  { code: "ha", english: "Hausa", native: "Harshen Hausa", status: "draft" },
  { code: "yo", english: "Yoruba", native: "Èdè Yorùbá", status: "draft" },
];

export const isLangCode = (v: unknown): v is LangCode =>
  LANGUAGES.some((l) => l.code === v);
export const infoFor = (code: LangCode) =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
