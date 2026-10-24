from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from complaint_terms import check_complaint
from models import ClinicalCheckRequest, ClinicalCheckResponse

# The same route as main.py, with the sign-in check replaced, so no database or network is needed
app = FastAPI()


def fake_user():
    return None


@app.post("/api/clinical-validate", response_model=ClinicalCheckResponse)
def clinical_validate(body: ClinicalCheckRequest, _user: str | None = Depends(fake_user)):
    return check_complaint(body.text)


client = TestClient(app)


def test_endpoint_returns_the_check():
    r = client.post("/api/clinical-validate", json={"text": "feaver and cough"})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "suggest"
    assert body["recognized"] == ["Cough"]
    assert body["suggestions"] == [{"from": "feaver", "to": "fever", "term": "Fever"}]


def test_endpoint_refuses_empty_and_oversized_text():
    assert client.post("/api/clinical-validate", json={"text": ""}).status_code == 422
    assert client.post("/api/clinical-validate", json={"text": "a" * 301}).status_code == 422
