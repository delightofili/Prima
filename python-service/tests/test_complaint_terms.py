import json
from pathlib import Path

import pytest

from complaint_terms import DATA_FILE, _load, check_complaint, levenshtein, normalize

CASES = json.loads((Path(__file__).parent / "complaint_cases.json").read_text(encoding="utf-8"))
APP_COPY = Path(__file__).resolve().parents[2] / "src" / "data" / "complaintTerms.json"


def test_clear_complaints_are_recognised():
    r = check_complaint("fever and cough for 3 days")
    assert r["status"] == "ok"
    assert r["recognized"] == ["Fever", "Cough"]


def test_pidgin_and_nigerian_english():
    assert check_complaint("running stomach since yesterday")["recognized"] == ["Diarrhoea"]
    assert check_complaint("hot body, catarrh")["recognized"] == ["Fever", "Runny or blocked nose"]
    assert check_complaint("belle pain")["recognized"] == ["Abdominal pain"]
    assert check_complaint("head dey pain me")["recognized"] == ["Headache"]


def test_longest_phrase_wins():
    assert check_complaint("lower abdominal pain")["recognized"] == ["Lower abdominal pain"]
    assert check_complaint("nausea and vomiting")["recognized"] == ["Nausea and vomiting"]


def test_typos_get_a_suggestion_not_a_silent_fix():
    r = check_complaint("feaver and cogh")
    assert r["status"] == "suggest"
    assert [(s["from"], s["to"]) for s in r["suggestions"]] == [("feaver", "fever"), ("cogh", "cough")]


def test_ordinary_words_are_not_corrected():
    for word in ["pills", "work", "walking", "wrist", "while", "call", "later"]:
        assert check_complaint(word)["suggestions"] == [], word


def test_vague_and_unknown_text_is_unclear_not_blocked():
    assert check_complaint("sick")["status"] == "unclear"
    assert check_complaint("sick")["vague"] is True
    assert check_complaint("asdfgh")["unknown"] == ["asdfgh"]


def test_empty_text():
    assert check_complaint("")["status"] == "empty"
    assert check_complaint("x")["status"] == "empty"


def test_phone_numbers_and_emails_are_flagged():
    assert "contains_number" in check_complaint("call 0803 123 4567")["flags"]
    assert "contains_number" in check_complaint("+234 803 123 4567")["flags"]
    assert "contains_number" not in check_complaint("fever for 3 days")["flags"]
    assert "contains_email" in check_complaint("email me at a@b.com")["flags"]


def test_accents_and_case_do_not_matter():
    assert normalize("  FEVER!!! ") == "fever"
    assert normalize("ọkụ") == "oku"
    assert check_complaint("FEVER, Cough.")["recognized"] == ["Fever", "Cough"]


def test_levenshtein_gives_up_early():
    assert levenshtein("fever", "fever", 1) == 0
    assert levenshtein("feaver", "fever", 1) == 1
    assert levenshtein("abcdef", "uvwxyz", 1) == 2  # "more than the limit", the exact number does not matter


def test_every_phrase_is_recognised_as_its_own_term():
    terms, phrases, *_ = _load()
    for phrase, index in phrases.items():
        assert terms[index] in check_complaint(phrase)["recognized"], phrase


def test_no_phrase_belongs_to_two_terms():
    raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    owner = {}
    for t in raw["terms"]:
        for say in t["say"]:
            key = normalize(say)
            assert owner.setdefault(key, t["term"]) == t["term"], f"'{say}' is under two terms"


@pytest.mark.parametrize("case", CASES, ids=lambda c: c["text"][:30] or "(empty)")
def test_same_answers_as_the_recorded_cases(case):
    # The app's TypeScript version is checked against these same cases (scripts/complaint-parity.ts)
    assert check_complaint(case["text"]) == case["expected"]


@pytest.mark.skipif(not APP_COPY.exists(), reason="the app folder is not next to the service")
def test_word_list_matches_the_app_copy():
    assert json.loads(DATA_FILE.read_text(encoding="utf-8")) == json.loads(APP_COPY.read_text(encoding="utf-8"))