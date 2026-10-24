from datetime import date 

from lga import age_group, compute_report, month_bounds


def test_month_bounds_roll_over_the_year():
    assert month_bounds("2026-12") == ("2026-12-01", "2027-01-01")
    assert month_bounds("2026-10") == ("2026-10-01", "2026-11-01")


def test_age_group_uses_the_visit_date():
    dob = date(2021, 11, 1)
    assert age_group(dob, date(2026, 10, 1)) == "1-4"  # 4 years, 11 months
    assert age_group(dob, date(2026, 11, 1)) == "5-14"  # turned 5


PATIENTS = [
    {"id": "m", "gender": "FEMALE", "dob": "1995-06-14", "created_at": "2026-10-03T09:00:00+00:00"},
    {"id": "b", "gender": "MALE", "dob": "2026-08-10", "created_at": "2026-09-20T09:00:00+00:00"},
]

VISITS = [
    {"patient_id": "m", "visit_date": "2026-10-05", "diagnosis_code": "Z34.9", "diagnosis_label": "Supervision of normal pregnancy, unspecified"},
    {"patient_id": "m", "visit_date": "2026-10-20", "diagnosis_code": "B54", "diagnosis_label": "Malaria, unspecified"},
    {"patient_id": "b", "visit_date": "2026-10-07", "diagnosis_code": "Z00.1", "diagnosis_label": "Routine child health examination"},
    {"patient_id": "ghost", "visit_date": "2026-10-08", "diagnosis_code": "B54", "diagnosis_label": "Malaria, unspecified"},
    {"patient_id": "m", "visit_date": "2026-09-30", "diagnosis_code": "B54", "diagnosis_label": "Malaria, unspecified"},
]

SHOTS = [
    {"patient_id": "b", "vaccine_name": "BCG", "dose_number": 1, "date_given": "2026-10-07"},
    {"patient_id": "b", "vaccine_name": "OPV", "dose_number": 0, "date_given": "2026-09-01"},
]


def test_report_counts():
    report = compute_report(PATIENTS, VISITS, SHOTS, "2026-10")

    assert report["totalVisits"] == 3  # the ghost patient and September visit are ignored
    assert report["patientsSeen"] == 2
    assert report["newRegistrations"] == 1

    rows = {row["label"]: row for row in report["ageSex"]}
    assert rows["15-49"]["female"] == 2
    assert rows["Under 1"]["male"] == 1

    services = {row["label"]: row["value"] for row in report["maternalChild"]}
    assert services["Antenatal visits"] == 1
    assert services["Child welfare visits"] == 1
    assert services["Postnatal visits"] == 0

    assert report["vaccines"] == [{"label": "BCG", "doses": 1}]
    assert len(report["diagnoses"]) == 3