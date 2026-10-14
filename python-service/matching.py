import unicodedata
from itertools import combinations

from rapidfuzz.distance import Levenshtein

MIN_NAME = 75  # names less alike than this never match, unless the NHIS number agrees
MIN_SCORE = 70
HIGH_SCORE = 80


def clean(text: str) -> str:
    """Lowercase, strip accents and dots under letters, collapse extra spaces."""
    decomposed = unicodedata.normalize("NFD", text)
    without_marks = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return " ".join(without_marks.lower().split())


def name_similarity(a: str, b: str) -> float:
    """0 to 100. Also treats 'Okafor Ngozi' and 'Ngozi Okafor' as identical."""
    a, b = clean(a), clean(b)
    as_typed = Levenshtein.normalized_similarity(a, b)
    words_sorted = Levenshtein.normalized_similarity(
        " ".join(sorted(a.split())), " ".join(sorted(b.split()))
    )
    return max(as_typed, words_sorted) * 100


def _round(x: float) -> int:
    return int(x + 0.5)  # rounds .5 up, exactly like JavaScript's Math.round


def compare(a: dict, b: dict) -> dict | None:
    # Hard rules: these two are different people.
    if a["gender"] != b["gender"]:
        return None
    if a.get("blood_group") and b.get("blood_group") and a["blood_group"] != b["blood_group"]:
        return None
    if a.get("nhis_number") and b.get("nhis_number") and a["nhis_number"] != b["nhis_number"]:
        return None

    same_nhis = bool(a.get("nhis_number")) and a["nhis_number"] == b.get("nhis_number")
    same_phone = bool(a.get("phone")) and a["phone"] == b.get("phone")
    same_dob = a["dob"] == b["dob"]
    same_year = a["dob"][:4] == b["dob"][:4]
    same_village = a.get("village_key") == b.get("village_key")
    name = name_similarity(a["full_name"], b["full_name"])

    score = min(
        100.0,
        name * 0.5
        + (25 if same_dob else 8 if same_year else 0)
        + (12 if same_phone else 0)
        + (5 if same_village else 0)
        + (40 if same_nhis else 0),
    )

    if not same_nhis and (name < MIN_NAME or score < MIN_SCORE):
        return None

    reasons: list[str] = []
    if same_nhis:
        reasons.append("Same NHIS number")
    if name >= 100:
        reasons.append("Same name")
    elif name >= MIN_NAME:
        reasons.append(f"Similar name ({_round(name)}%)")
    if same_dob:
        reasons.append("Same date of birth")
    elif same_year:
        reasons.append("Born the same year")
    if same_phone:
        reasons.append("Same phone number")
    if same_village:
        reasons.append("Same village")

    return {
        "score": _round(score),
        "level": "high" if same_nhis or score >= HIGH_SCORE else "possible",
        "reasons": reasons,
    }


def find_similar(name: str, candidates: list[dict], threshold: int = 85) -> list[dict]:
    matches = []
    for c in candidates:
        score = name_similarity(name, c["name"])
        if score >= threshold:
            matches.append({"id": c["id"], "name": c["name"], "score": round(score, 1)})
    matches.sort(key=lambda m: m["score"], reverse=True)
    return matches[:10]


def _starts(name: str) -> set[str]:
    return {word[:2] for word in clean(name).split()}


def find_pairs(patients: list[dict]) -> list[dict]:
    starts = {p["id"]: _starts(p["full_name"]) for p in patients}
    blocks: dict[str, list[dict]] = {}
    by_nhis: dict[str, list[dict]] = {}

    for p in patients:
        blocks.setdefault(f"{p['gender']}|{p['dob'][:4]}", []).append(p)
        if p.get("nhis_number"):
            by_nhis.setdefault(p["nhis_number"], []).append(p)

    seen: set[tuple[str, str]] = set()
    found: list[dict] = []

    def consider(a: dict, b: dict) -> None:
        key = (min(a["id"], b["id"]), max(a["id"], b["id"]))
        if key in seen:
            return
        seen.add(key)
        result = compare(a, b)
        if result:
            found.append({"a": a, "b": b, **result})

    for group in by_nhis.values():
        for a, b in combinations(group, 2):
            consider(a, b)

    for block in blocks.values():
        for a, b in combinations(block, 2):
            if abs(len(a["full_name"]) - len(b["full_name"])) > 8:
                continue
            if starts[a["id"]].isdisjoint(starts[b["id"]]):
                continue
            consider(a, b)

    found.sort(key=lambda m: (m["level"] != "high", -m["score"]))
    return found