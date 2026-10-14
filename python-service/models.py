from pydantic import BaseModel, Field


class Candidate(BaseModel):
    id: str
    name: str


class FuzzyCheckRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    candidates: list[Candidate] = Field(max_length=5000)
    threshold: int = Field(default=85, ge=50, le=100)


class Match(BaseModel):
    id: str
    name: str
    score: float


class FuzzyCheckResponse(BaseModel):
    matches: list[Match]


class BatchRequest(BaseModel):
    facility_id: str = Field(min_length=10, max_length=64)
    threshold: int = Field(default=70, ge=50, le=100)


class PersonRef(BaseModel):
    id: str
    full_name: str
    card_number: str


class DuplicatePair(BaseModel):
    a: PersonRef
    b: PersonRef
    score: int
    level: str
    reasons: list[str]


class BatchResponse(BaseModel):
    checked: int
    pairs: list[DuplicatePair]


class AgeSexRow(BaseModel):
    label: str
    male: int
    female: int


class DiagnosisRow(BaseModel):
    code: str
    label: str
    male: int
    female: int


class VaccineRow(BaseModel):
    label: str
    doses: int


class ServiceRow(BaseModel):
    label: str
    value: int


# Field names are camelCase on purpose: they match the app's TypeScript LgaReport exactly.
class LgaReport(BaseModel):
    month: str
    newRegistrations: int
    patientsSeen: int
    totalVisits: int
    ageSex: list[AgeSexRow]
    diagnoses: list[DiagnosisRow]
    vaccines: list[VaccineRow]
    maternalChild: list[ServiceRow]