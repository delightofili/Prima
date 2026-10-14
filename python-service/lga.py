from datetime import date, datetime
from zoneinfo import ZoneInfo

LAGOS = ZoneInfo("Africa/Lagos")

AGE_GROUPS = ["Under 1", "1-4", "5-14", "15-49", "50+"]

MATERNAL = [
    ("Z34.9", "Antenatal visits"),
    ("Z39.2", "Postnatal visits"),
    ("Z00.1", "Child welfare visits"),
    ("Z30.9", "Family planning visits"),
]

# Same order as the app's vaccine schedule
VACCINES = [
    ("BCG", 1, "BCG"),
    ("HepB", 0, "Hep B 0"),
    ("OPV", 0, "OPV 0"),
    ("OPV", 1, "OPV 1"),
    ("OPV", 2, "OPV 2"),
    ("OPV", 3, "OPV 3"),
    ("Penta", 1, "Penta 1"),
    ("Penta", 2, "Penta 2"),
    ("Penta", 3, "Penta 3"),
    ("PCV", 1, "PCV 1"),
    ("PCV", 2, "PCV 2"),
    ("PCV", 3, "PCV 3"),
    ("Rota", 1, "Rota 1"),
    ("Rota", 2, "Rota 2"),
    ("IPV", 1, "IPV"),
    ("Measles", 1, "Measles 1"),
    ("Yellow fever", 1, "Yellow fever"),
    ("Measles", 2, "Measles 2"),
]


def month_bounds(month: str) -> tuple[str, str]:
    """('2026-10') -> ('2026-10-01', '2026-11-01'): the month's start and the next month's start."""
    year, mon = (int(part) for part in month.split("-"))
    start = date(year, mon, 1)
    end = date(year + 1, 1, 1) if mon == 12 else date(year, mon + 1, 1)
    return start.isoformat(), end.isoformat()


def age_group(dob: date, on: date) -> str:
    years = on.year - dob.year
    months = on.month - dob.month
    if on.day < dob.day:
        months -= 1
    if months < 0:
        years -= 1
        months += 12
    if years < 1:
        return "Under 1"
    if years < 5:
        return "1-4"
    if years < 15:
        return "5-14"
    if years < 50:
        return "15-49"
    return "50+"


def _local_month(timestamp: str) -> str:
    return datetime.fromisoformat(timestamp).astimezone(LAGOS).strftime("%Y-%m")


def compute_report(patients: list[dict], visits: list[dict], shots: list[dict], month: str) -> dict:
    people = {p["id"]: p for p in patients}
    age_sex = {group: {"male": 0, "female": 0} for group in AGE_GROUPS}
    diagnoses: dict[str, dict] = {}
    maternal = {code: 0 for code, _ in MATERNAL}
    seen: set[str] = set()
    total_visits = 0

    for v in visits:
        if not v["visit_date"].startswith(month):
            continue
        person = people.get(v["patient_id"])
        if person is None:
            continue

        side = "female" if person["gender"] == "FEMALE" else "male"
        total_visits += 1
        seen.add(person["id"])

        # Age on the day of the visit, not today
        group = age_group(date.fromisoformat(person["dob"]), date.fromisoformat(v["visit_date"]))
        age_sex[group][side] += 1

        code = v.get("diagnosis_code")
        label = (v.get("diagnosis_label") or "").strip()
        if label:
            row = diagnoses.setdefault(
                code or label, {"code": code or "", "label": label, "male": 0, "female": 0}
            )
            row[side] += 1
        if code in maternal:
            maternal[code] += 1

    doses: dict[tuple[str, int], int] = {}
    for s in shots:
        if not s["date_given"].startswith(month) or s["patient_id"] not in people:
            continue
        key = (s["vaccine_name"], s["dose_number"])
        doses[key] = doses.get(key, 0) + 1

    return {
        "month": month,
        "newRegistrations": sum(1 for p in patients if _local_month(p["created_at"]) == month),
        "patientsSeen": len(seen),
        "totalVisits": total_visits,
        "ageSex": [{"label": g, **age_sex[g]} for g in AGE_GROUPS],
        "diagnoses": sorted(diagnoses.values(), key=lambda r: r["male"] + r["female"], reverse=True)[:10],
        "vaccines": [
            {"label": label, "doses": doses[(name, dose)]}
            for name, dose, label in VACCINES
            if (name, dose) in doses
        ],
        "maternalChild": [{"label": label, "value": maternal[code]} for code, label in MATERNAL],
    }