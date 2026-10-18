from functools import lru_cache

from fastapi import HTTPException
from supabase import Client, create_client

from config import get_settings
from lga import month_bounds


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.service_key:
        raise HTTPException(status_code=503, detail="The server is not connected to the database yet.")
    return create_client(settings.supabase_url, settings.service_key)


def fetch_all(make_query, page_size: int = 1000) -> list[dict]:
    """Supabase returns at most 1000 rows per request, so ask page by page."""
    rows: list[dict] = []
    start = 0
    while True:
        batch = make_query().order("id").range(start, start + page_size - 1).execute().data or []
        rows.extend(batch)
        if len(batch) < page_size:
            return rows
        start += page_size


def load_patients(facility_id: str) -> list[dict]:
    client = get_supabase()
    return fetch_all(
        lambda: client.table("patients")
        .select("id,card_number,full_name,dob,gender,phone,village_key,nhis_number,blood_group,created_at")
        .eq("facility_id", facility_id)
        .is_("deleted_at", "null")
    )


def load_month(facility_id: str, month: str) -> tuple[list[dict], list[dict], list[dict]]:
    client = get_supabase()
    start, end = month_bounds(month)

    patients = load_patients(facility_id)
    visits = fetch_all(
        lambda: client.table("visits")
        .select("patient_id,visit_date,diagnosis_code,diagnosis_label")
        .eq("facility_id", facility_id)
        .is_("deleted_at", "null")
        .gte("visit_date", start)
        .lt("visit_date", end)
    )
    shots = fetch_all(
        lambda: client.table("immunization_records")
        .select("patient_id,vaccine_name,dose_number,date_given")
        .eq("facility_id", facility_id)
        .is_("deleted_at", "null")
        .gte("date_given", start)
        .lt("date_given", end)
    )
    return patients, visits, shots
def get_role(user_id: str, facility_id: str) -> str | None:
    """'admin', 'staff', or None if this person does not belong to the facility."""
    rows = (
        get_supabase()
        .table("memberships")
        .select("role")
        .eq("user_id", user_id)
        .eq("facility_id", facility_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    return rows[0]["role"] if rows else None

    