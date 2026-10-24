"""Chief-complaint term check.

Reads what a nurse typed ("feaver and cough for 3 days") and says whether Prima recognises it,
suggests a fix for a likely typo, and warns if a phone number slipped into the box.
The app does the same check on the phone from the same word list, so it works with no internet.
Keep this file in step with src/lib/complaintCheck.ts, and data/complaint_terms.json with
src/data/complaintTerms.json (a test compares the two files).
"""
import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

DATA_FILE = Path(__file__).parent / "data" / "complaint_terms.json"
MAX_TEXT = 300


def normalize(text: str) -> str:
    s = unicodedata.normalize("NFD", text.lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")  # drop accents and dot-below marks
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def levenshtein(a: str, b: str, limit: int) -> int:
    """Edit distance, giving up (returning limit + 1) once it is clearly above the limit."""
    if abs(len(a) - len(b)) > limit:
        return limit + 1
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        if min(cur) > limit:
            return limit + 1
        prev = cur
    return prev[-1]


@lru_cache(maxsize=1)
def _load():
    raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    terms = [t["term"] for t in raw["terms"]]
    phrases: dict[str, int] = {}
    for index, t in enumerate(raw["terms"]):
        for say in t["say"]:
            phrases.setdefault(normalize(say), index)
    vague = {normalize(v) for v in raw["vague"]}
    stop = {normalize(s) for s in raw["stopwords"]}

    known: set[str] = set()
    for phrase in list(phrases) + list(vague):
        known.update(phrase.split(" "))

    # For a corrected word, which term does it belong to? Prefer a term that is exactly that word.
    word_term: dict[str, int] = {}
    for phrase, index in phrases.items():
        if " " not in phrase:
            word_term.setdefault(phrase, index)
    for phrase, index in phrases.items():
        for word in phrase.split(" "):
            word_term.setdefault(word, index)
    vocab = sorted(w for w in word_term if len(w) >= 4)
    longest = max(len(p.split(" ")) for p in list(phrases) + list(vague))
    return terms, phrases, vague, stop, known, word_term, vocab, longest


def check_complaint(text: str) -> dict:
    terms, phrases, vague, stop, known, word_term, vocab, longest = _load()
    raw = text[:MAX_TEXT]
    norm = normalize(raw)
    flags = []
    digits = re.sub(r"[\s\-().+]", "", raw)
    if re.search(r"\d{7,}", digits):
        flags.append("contains_number")
    if "@" in raw:
        flags.append("contains_email")

    if len(norm) < 2:
        return {"status": "empty", "recognized": [], "suggestions": [], "unknown": [], "flags": flags, "vague": False}

    tokens = norm.split(" ")
    covered = [False] * len(tokens)
    recognized: list[str] = []
    vague_seen = False

    i = 0
    while i < len(tokens):
        hit = 0
        for n in range(min(longest, len(tokens) - i), 0, -1):
            phrase = " ".join(tokens[i : i + n])
            if phrase in phrases:
                term = terms[phrases[phrase]]
                if term not in recognized:
                    recognized.append(term)
                hit = n
                break
            if phrase in vague:
                vague_seen = True
                hit = n
                break
        if hit:
            for k in range(i, i + hit):
                covered[k] = True
            i += hit
        else:
            i += 1

    suggestions: list[dict] = []
    unknown: list[str] = []
    for k, token in enumerate(tokens):
        if covered[k] or token in stop or token.isdigit() or token in known or len(token) < 4:
            continue
        limit = 1 if len(token) <= 8 else 2
        best, best_d = None, limit + 1
        for word in vocab:
            if word[0] != token[0]:  # a typo rarely changes the first letter; this stops "call" becoming "fall"
                continue
            d = levenshtein(token, word, limit)
            if d < best_d:
                best, best_d = word, d
        if best is not None:
            entry = {"from": token, "to": best, "term": terms[word_term[best]]}
            if entry not in suggestions:
                suggestions.append(entry)
        elif token not in unknown:
            unknown.append(token)

    if suggestions:
        status = "suggest"
    elif recognized:
        status = "ok"
    else:
        status = "unclear"

    return {
        "status": status,
        "recognized": recognized,
        "suggestions": suggestions,
        "unknown": unknown,
        "flags": flags,
        "vague": vague_seen,
    }