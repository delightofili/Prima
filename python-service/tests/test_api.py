from fastapi.testclient import TestClient

import main
from config import Settings, get_settings

client = TestClient(main.app)

FACILITY = "11111111-1111-4111-8111-111111111111"

PATIENTS = [
    {"id": "1", "card_number": "ANK-AAAAAA", "full_name": "Ngozi Okafor", "dob": "1995-06-14",
     "gender": "FEMALE", "phone": None, "village_key": "ifite", "nhis_number": None,
     "blood_group": None, "created_at": "2026-10-03T09:00:00+00:00"},
    {"id": "2", "card_number": "ANK-BBBBBB", "full_name": "Okafor Ngozi", "dob": "1995-06-14",
     "gender": "FEMALE", "phone": None, "village_key": "ifite", "nhis_number": None,
     "blood_group": None, "created_at": "2026-10-04T09:00:00+00:00"},
]

VISITS = [
    {"patient_id": "1", "visit_date": "2026-10-05", "diagnosis_code": "B54", "diagnosis_label": "Malaria, unspecified"},
]


def fake_month_loader(facility_id, month):
    return PATIENTS, VISITS, []


def fake_patient_loader(facility_id):
    return PATIENTS


def setup_function():
    main.app.dependency_overrides[main.current_user] = lambda: "test-user"
    main.app.dependency_overrides[main.get_month_loader] = lambda: fake_month_loader
    main.app.dependency_overrides[main.get_patient_loader] = lambda: fake_patient_loader
    main.app.dependency_overrides[main.get_role_lookup] = lambda: (lambda user_id, facility_id: "admin") 
    


def teardown_function():
    main.app.dependency_overrides.clear()


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_fuzzy_check_finds_similar_names():
    body = {
        "name": "Ngozi Okafor",
        "candidates": [{"id": "1", "name": "ngozy okafor"}, {"id": "3", "name": "Chidi Eze"}],
    }
    response = client.post("/api/fuzzy-check", json=body)
    assert response.status_code == 200
    assert [m["id"] for m in response.json()["matches"]] == ["1"]


def test_fuzzy_check_rejects_a_too_short_name():
    response = client.post("/api/fuzzy-check", json={"name": "A", "candidates": []})
    assert response.status_code == 422


def test_batch_finds_the_swapped_name_pair():
    response = client.post("/api/fuzzy-check/batch", json={"facility_id": FACILITY})
    assert response.status_code == 200
    result = response.json()
    assert result["checked"] == 2
    assert len(result["pairs"]) == 1
    assert result["pairs"][0]["level"] == "high"


def test_lga_report_returns_the_month():
    response = client.get("/api/lga-report", params={"facility_id": FACILITY, "month": "2026-10"})
    assert response.status_code == 200
    assert response.json()["totalVisits"] == 1


def test_lga_report_rejects_a_month_that_does_not_exist():
    response = client.get("/api/lga-report", params={"facility_id": FACILITY, "month": "2026-13"})
    assert response.status_code == 422


def test_sign_in_is_required_when_auth_is_on():
    main.app.dependency_overrides.pop(main.current_user, None)
    main.app.dependency_overrides[get_settings] = lambda: Settings("", "", [], True)
    response = client.get("/api/lga-report", params={"facility_id": FACILITY, "month": "2026-10"})
    assert response.status_code == 401

def test_lga_report_refuses_someone_from_another_facility():
    main.app.dependency_overrides[main.get_role_lookup] = lambda: (lambda user_id, facility_id: None)
    response = client.get("/api/lga-report", params={"facility_id": FACILITY, "month": "2026-10"})
    assert response.status_code == 403


def test_batch_refuses_someone_from_another_facility():
    main.app.dependency_overrides[main.get_role_lookup] = lambda: (lambda user_id, facility_id: None)
    response = client.post("/api/fuzzy-check/batch", json={"facility_id": FACILITY})
    assert response.status_code == 403    