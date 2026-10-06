from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from rapidfuzz import fuzz

app = FastAPI(title="Prima Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class Candidate(BaseModel):
    id: str
    name: str


class FuzzyCheckRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    candidates: list[Candidate] = Field(max_length=5000)
    threshold: int = Field(default=85, ge=50, le=100)


def clean(text: str) -> str:
    return " ".join(text.lower().split())


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/fuzzy-check")
def fuzzy_check(body: FuzzyCheckRequest):
    target = clean(body.name)
    matches = []

    for person in body.candidates:
        other = clean(person.name)
        score = max(fuzz.ratio(target, other), fuzz.token_sort_ratio(target, other))
        if score >= body.threshold:
            matches.append({"id": person.id, "name": person.name, "score": round(score, 1)})

    matches.sort(key=lambda m: m["score"], reverse=True)
    return {"matches": matches[:10]}