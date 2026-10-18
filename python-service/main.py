from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import data
from config import Settings, get_settings
from lga import compute_report
from matching import find_pairs, find_similar
from models import (
    BatchRequest,
    BatchResponse,
    FuzzyCheckRequest,
    FuzzyCheckResponse,
    LgaReport,
)

settings = get_settings()

app = FastAPI(title="Prima Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

bearer = HTTPBearer(auto_error=False)


def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    cfg: Settings = Depends(get_settings),
) -> str | None:
    """Who is calling? Checks the Supabase session sent as 'Authorization: Bearer <token>'."""
    if not cfg.require_auth:
        return None
    if creds is None:
        raise HTTPException(status_code=401, detail="Please sign in.")

    client = data.get_supabase()
    try:
        result = client.auth.get_user(creds.credentials)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Your session is not valid.") from exc
    if result is None or result.user is None:
        raise HTTPException(status_code=401, detail="Your session is not valid.")
    return result.user.id


# These return the functions that read the database, so tests can swap them for fakes.
def get_month_loader():
    return data.load_month


def get_patient_loader():
    return data.load_patients

def get_role_lookup():
    return data.get_role


def ensure_member(user_id: str | None, facility_id: str, role_of) -> None:
    """Signed in is not enough: the caller must belong to THIS facility."""
    if user_id is None:  # sign-in checks are switched off (local testing only)
        return
    if not role_of(user_id, facility_id):
        raise HTTPException(status_code=403, detail="You do not belong to this facility.")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/fuzzy-check", response_model=FuzzyCheckResponse)
def fuzzy_check(body: FuzzyCheckRequest, _user: str | None = Depends(current_user)):
    candidates = [c.model_dump() for c in body.candidates]
    return {"matches": find_similar(body.name, candidates, body.threshold)}


@app.post("/api/fuzzy-check/batch", response_model=BatchResponse)
def fuzzy_batch(
    body: BatchRequest,
    user: str | None = Depends(current_user),
    load=Depends(get_patient_loader),
    role_of=Depends(get_role_lookup),
):
    ensure_member(user, body.facility_id, role_of)
    patients = load(body.facility_id)
    pairs = [
        {
            "a": {"id": p["a"]["id"], "full_name": p["a"]["full_name"], "card_number": p["a"]["card_number"]},
            "b": {"id": p["b"]["id"], "full_name": p["b"]["full_name"], "card_number": p["b"]["card_number"]},
            "score": p["score"],
            "level": p["level"],
            "reasons": p["reasons"],
        }
        for p in find_pairs(patients)
        if p["score"] >= body.threshold
    ]
    return {"checked": len(patients), "pairs": pairs}


@app.get("/api/lga-report", response_model=LgaReport)
def lga_report(
    facility_id: str = Query(min_length=10, max_length=64),
    month: str = Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    user: str | None = Depends(current_user),
    load=Depends(get_month_loader),
    role_of=Depends(get_role_lookup),
):
    ensure_member(user, facility_id, role_of)
    patients, visits, shots = load(facility_id, month)
    return compute_report(patients, visits, shots, month)