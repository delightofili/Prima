from matching import clean, compare, find_pairs, find_similar, name_similarity


def patient(**changes):
    base = {
        "id": "1",
        "card_number": "ANK-AAAAAA",
        "full_name": "Ngozi Okafor",
        "dob": "1995-06-14",
        "gender": "FEMALE",
        "phone": None,
        "village_key": "ifite",
        "nhis_number": None,
        "blood_group": None,
    }
    return {**base, **changes}


def test_clean_removes_accents_and_extra_spaces():
    assert clean("  Ụgọchi   ỌKAFỌR ") == "ugochi okafor"


def test_name_similarity_for_a_typo():
    assert round(name_similarity("Ngozi Okafor", "Ngozy Okafor"), 1) == 91.7


def test_name_similarity_for_swapped_words():
    assert name_similarity("Okafor Ngozi", "Ngozi Okafor") == 100


def test_different_gender_never_matches():
    assert compare(patient(id="1"), patient(id="2", gender="MALE")) is None


def test_different_blood_groups_never_match():
    assert compare(patient(id="1", blood_group="A+"), patient(id="2", blood_group="O+")) is None


def test_different_nhis_numbers_never_match():
    assert compare(patient(id="1", nhis_number="N1"), patient(id="2", nhis_number="N2")) is None


def test_exact_copy_is_high_confidence():
    result = compare(patient(id="1"), patient(id="2"))
    assert result["level"] == "high"
    assert result["score"] == 80


def test_one_letter_typo_is_possible():
    result = compare(patient(id="1"), patient(id="2", full_name="Ngozy Okafor"))
    assert result["level"] == "possible"
    assert result["score"] == 76


def test_same_nhis_matches_even_with_a_different_birth_year():
    a = patient(id="1", nhis_number="N1")
    b = patient(id="2", dob="1990-01-01", nhis_number="N1")
    pairs = find_pairs([a, b])
    assert len(pairs) == 1
    assert pairs[0]["level"] == "high"


def test_different_people_are_not_paired():
    a = patient(id="1")
    b = patient(id="2", full_name="Chidi Eze", dob="1995-02-02")
    assert find_pairs([a, b]) == []


def test_find_similar_ranks_best_first():
    candidates = [
        {"id": "1", "name": "ngozy okafor"},
        {"id": "2", "name": "Okafor Ngozi"},
        {"id": "3", "name": "Chidi Eze"},
    ]
    result = find_similar("Ngozi Okafor", candidates, 85)
    assert [m["id"] for m in result] == ["2", "1"]