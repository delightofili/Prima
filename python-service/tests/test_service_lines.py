from lga import SERVICE_LINES, compute_report

PEOPLE = [
    {"id": "p1", "gender": "FEMALE", "dob": "1996-03-14", "created_at": "2026-10-02T09:00:00+01:00"},
    {"id": "p2", "gender": "MALE", "dob": "2026-06-01", "created_at": "2026-06-02T09:00:00+01:00"},
]


def visit(pid, code, day="2026-10-05"):
    return {"patient_id": pid, "visit_date": day, "diagnosis_code": code, "diagnosis_label": "x" if code else ""}


def counts(codes):
    report = compute_report(PEOPLE, [visit("p1", c) for c in codes], [], "2026-10")
    return {row["label"]: row["value"] for row in report["maternalChild"]}


def test_old_exact_codes_still_count():
    got = counts(["Z34.9", "Z39.2", "Z00.1", "Z30.9"])
    assert got == {"Antenatal visits": 1, "Postnatal visits": 1, "Child welfare visits": 1, "Family planning visits": 1}


def test_finer_codes_count_too():
    got = counts(["Z34.0", "Z34.8", "Z35.9", "Z39.1", "Z76.2", "Z30.1", "Z30.4"])
    assert got["Antenatal visits"] == 3
    assert got["Postnatal visits"] == 1
    assert got["Child welfare visits"] == 1
    assert got["Family planning visits"] == 2


def test_other_codes_do_not_count():
    got = counts(["B54", "Z00.0", "Z36.9", "O80", None])
    assert sum(got.values()) == 0


def test_one_visit_counts_in_one_line_only():
    report = compute_report(PEOPLE, [visit("p1", "Z34.0")], [], "2026-10")
    assert sum(row["value"] for row in report["maternalChild"]) == 1


def test_lines_are_in_the_order_the_app_expects():
    # The app's DHIS2 export reads maternalChild by position
    assert [key for key, _, _ in SERVICE_LINES] == ["anc", "pnc", "childWelfare", "familyPlanning"]
    report = compute_report(PEOPLE, [], [], "2026-10")
    assert [row["label"] for row in report["maternalChild"]] == [label for _, label, _ in SERVICE_LINES]