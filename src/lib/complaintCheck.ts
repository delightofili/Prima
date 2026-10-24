// Chief-complaint term check. Reads what a nurse typed ("feaver and cough for 3 days"), says whether Prima
// recognises it, suggests a fix for a likely typo, and warns if a phone number slipped into the box.
// Runs on the phone from a word list, so it works with no internet.
// Keep in step with python-service/complaint_terms.py (same rules, same word list, same recorded test cases).
import data from "../data/complaintTerms.json";

export type CheckStatus = "empty" | "ok" | "suggest" | "unclear";

export interface ComplaintCheck {
  status: CheckStatus;
  recognized: string[]; // the standard names found, e.g. "Fever"
  suggestions: { from: string; to: string; term: string }[];
  unknown: string[];
  flags: ("contains_number" | "contains_email")[];
  vague: boolean; // "sick", "problem", "pain" with nothing more specific
}

const MAX_TEXT = 300;

export const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // drop accents and the dot-below marks used in Igbo
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Edit distance that gives up (returns limit + 1) once it is clearly above the limit
export function levenshtein(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur.push(
        Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        ),
      );
    }
    if (Math.min(...cur) > limit) return limit + 1;
    prev = cur;
  }
  return prev[b.length];
}

function load() {
  const terms = data.terms.map((t) => t.term);
  const phrases = new Map<string, number>();
  data.terms.forEach((t, index) => {
    for (const say of t.say) {
      const key = normalize(say);
      if (!phrases.has(key)) phrases.set(key, index);
    }
  });
  const vague = new Set(data.vague.map(normalize));
  const stop = new Set(data.stopwords.map(normalize));

  const known = new Set<string>();
  for (const phrase of [...phrases.keys(), ...vague])
    for (const w of phrase.split(" ")) known.add(w);

  // For a corrected word, which term does it belong to? Prefer a term that is exactly that word.
  const wordTerm = new Map<string, number>();
  for (const [phrase, index] of phrases)
    if (!phrase.includes(" ") && !wordTerm.has(phrase))
      wordTerm.set(phrase, index);
  for (const [phrase, index] of phrases)
    for (const w of phrase.split(" "))
      if (!wordTerm.has(w)) wordTerm.set(w, index);

  const vocab = [...wordTerm.keys()].filter((w) => w.length >= 4).sort();
  const longest = Math.max(
    ...[...phrases.keys(), ...vague].map((p) => p.split(" ").length),
  );
  return { terms, phrases, vague, stop, known, wordTerm, vocab, longest };
}

const dict = load();

export function checkComplaint(text: string): ComplaintCheck {
  const { terms, phrases, vague, stop, known, wordTerm, vocab, longest } = dict;
  const raw = text.slice(0, MAX_TEXT);
  const norm = normalize(raw);
  const flags: ComplaintCheck["flags"] = [];
  if (/\d{7,}/.test(raw.replace(/[\s\-().+]/g, "")))
    flags.push("contains_number");
  if (raw.includes("@")) flags.push("contains_email");

  if (norm.length < 2)
    return {
      status: "empty",
      recognized: [],
      suggestions: [],
      unknown: [],
      flags,
      vague: false,
    };

  const tokens = norm.split(" ");
  const covered = new Array<boolean>(tokens.length).fill(false);
  const recognized: string[] = [];
  let vagueSeen = false;

  let i = 0;
  while (i < tokens.length) {
    let hit = 0;
    for (let n = Math.min(longest, tokens.length - i); n >= 1; n--) {
      const phrase = tokens.slice(i, i + n).join(" ");
      const index = phrases.get(phrase);
      if (index !== undefined) {
        const term = terms[index];
        if (!recognized.includes(term)) recognized.push(term);
        hit = n;
        break;
      }
      if (vague.has(phrase)) {
        vagueSeen = true;
        hit = n;
        break;
      }
    }
    if (hit > 0) {
      for (let k = i; k < i + hit; k++) covered[k] = true;
      i += hit;
    } else {
      i += 1;
    }
  }

  const suggestions: ComplaintCheck["suggestions"] = [];
  const unknown: string[] = [];
  tokens.forEach((token, k) => {
    if (
      covered[k] ||
      stop.has(token) ||
      /^\d+$/.test(token) ||
      known.has(token) ||
      token.length < 4
    )
      return;
    const limit = token.length <= 8 ? 1 : 2;
    let best: string | null = null;
    let bestD = limit + 1;
    for (const word of vocab) {
      if (word[0] !== token[0]) continue; // a typo rarely changes the first letter
      const d = levenshtein(token, word, limit);
      if (d < bestD) {
        best = word;
        bestD = d;
      }
    }
    if (best !== null) {
      const entry = { from: token, to: best, term: terms[wordTerm.get(best)!] };
      if (
        !suggestions.some(
          (s) =>
            s.from === entry.from && s.to === entry.to && s.term === entry.term,
        )
      )
        suggestions.push(entry);
    } else if (!unknown.includes(token)) {
      unknown.push(token);
    }
  });

  const status: CheckStatus =
    suggestions.length > 0
      ? "suggest"
      : recognized.length > 0
        ? "ok"
        : "unclear";
  return { status, recognized, suggestions, unknown, flags, vague: vagueSeen };
}

// Swap a mistyped word for the suggested one, keeping the rest of the sentence
export function applySuggestion(
  text: string,
  from: string,
  to: string,
): string {
  const pattern = new RegExp(
    `\\b${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "gi",
  );
  return text.replace(pattern, to);
}
