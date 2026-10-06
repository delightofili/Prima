# Prima

**An offline-first patient register for Primary Health Centers (PHCs) in Nigeria.**

Prima replaces the paper register. A nurse registers a patient on an Android phone, with or without network. Everything is saved on the phone first and syncs to the cloud in the background when a connection is available.

> Status: in active development. Built in public over 5 days, going live on Day 6.

---

## The problem

Paper registers at PHCs:

- lose patients (a torn page is a lost record),
- create duplicates (the same woman registered three times under slightly different spellings),
- make the monthly LGA report a slow, manual count,
- give nobody a way to see who is due for their next vaccine.

Many PHCs also have unreliable network, so a normal web app that needs the internet to save a record does not work for them. Prima is **offline-first** for that reason.

## The story so far

**Day 1: `phc-registry` (Next.js + Prisma).**
Project setup and the first database design. The goal was a simple registration system: a nurse registers a patient, views the list, searches, and opens a profile. Every field was chosen for PHC use: village, LGA, next of kin, NHIS number, blood group, allergies, and the assigned PHC.

**Day 2: `phc-registry`, made "smart".**
Product feedback said the system had to handle real clinical situations, so I added:

- **Para, Gravida and isPregnant** for female patients.
- **Immunization records** (vaccine, dose number, date given, next due date) for children under 5.
- Server-side clinical rules (for example, a male patient cannot be marked pregnant and a 10-year-old cannot have a gravida value).
- Duplicate warnings (same name, date of birth and village), unique NHIS numbers, and validated Nigerian phone numbers.
- Search by name, phone, NHIS number or card number, plus human-readable card numbers.

About 30 API tests were written in VS Code REST Client.

**The pivot.**
Building the API made one thing clear: a server-first app is the wrong foundation for a rural clinic. If the network drops, a form that posts to a server fails, and a nurse with a queue of patients cannot wait. So the architecture changed:

|                   | `phc-registry` (Days 1-2)             | `prima` (Day 3 onward)                                                |
| ----------------- | ------------------------------------- | --------------------------------------------------------------------- |
| App               | Next.js, server-rendered              | React + Vite single-page app (PWA)                                    |
| Data on the phone | None. Needs the server for everything | **IndexedDB (Dexie) is the source of truth**                          |
| Database          | Prisma + PostgreSQL                   | Supabase Postgres, as a background copy                               |
| Saving a patient  | HTTP request, fails offline           | Local write, instant, queued for sync                                 |
| Extra services    | None                                  | FastAPI (Python) for duplicate detection, FHIR validation and reports |

**Why a new repository instead of editing the old one?**

1. The two architectures are fundamentally different. Mixing a server-rendered Next.js app and an offline-first SPA in one repo would leave dead code and confusing history.
2. `phc-registry` stays as an honest record of how the thinking evolved and what I learned in Days 1-2, and it is kept as a **reference**, not deleted.
3. A clean repo makes Prima easier for others to read, run and review.

**What carried over from `phc-registry`:** the schema design, the clinical validation rules, age calculation, the duplicate-detection rule, and the idea of a printable human-readable card number. What was left behind: Next.js API routes and the Prisma client.

## Architecture

```
┌─────────────── Nurse's phone ───────────────┐
│  React UI ──reads──▶ Dexie (IndexedDB)      │
│      │                    ▲                 │
│      └───writes───────────┘                 │
│                           │                 │
│                     syncQueue               │
└───────────────────────────┼─────────────────┘
                            │ when online
                            ▼
                    Supabase (Postgres)
                            ▲
                            │
             FastAPI (Python): fuzzy duplicates,
             FHIR validation, LGA report analytics
```

Rules the app follows:

- The UI **never waits for the network**. It reads from Dexie with `useLiveQuery()`.
- Every new record is added to a `syncQueue` automatically (a Dexie `creating` hook).
- When the phone is online, the queue is pushed to Supabase. If it is offline, records wait on the phone.
- Patient IDs are UUIDs generated on the device. Card numbers like `ANK-7K3F9Q` are also generated on the device, so two offline phones never need to ask a server for the next number.
- Python is used only for work that benefits from it. Registration and search never depend on it.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Hook Form, Zod
- **Offline data:** Dexie.js (IndexedDB), `vite-plugin-pwa` (added Day 4)
- **Cloud database:** Supabase Postgres
- **Python service:** FastAPI, rapidfuzz (and later `fhir.resources`, `supabase-py`)
- **Hosting plan:** Supabase + Render (static site and web service)

## Day 3 features

- Registration form designed for a small Android phone: large tap targets, numeric keypads, one column.
- **Conditional fields:** female patients over 12 see Para, Gravida and Pregnant. Children under 5 see an immunization checklist (BCG, OPV 0, OPV 1, Penta 1, PCV 1, Measles 1) with dates.
- **New admission toggle:** when on, the nurse records a chief complaint (5-200 characters). It is stored on the patient record as the reason for first registration.
- **Live duplicate warning** from a Dexie compound index on name + date of birth + village. It works offline.
- **Similar-name check** through the Python `/api/fuzzy-check` endpoint (rapidfuzz). It catches near-misses like "Ngozi" and "Ngozy", and swapped names like "Okafor Ngozi". It is skipped silently when offline.
- Patient list with instant search (debounced 200 ms) by name, phone, NHIS number or card number, served from memory with no spinner.
- Offline queue and background sync to Supabase, with a status badge (Synced, Offline, N waiting).
- Colour system chosen for outdoor readability: deep teal, warm sand and signal orange, with high contrast.

## Plans

| Plan  | Price      | Includes                                                               |
| ----- | ---------- | ---------------------------------------------------------------------- |
| Free  | ₦0         | 1 facility, 200 patients, no export                                    |
| Basic | ₦500/month | Unlimited patients, CSV export, LGA report, PWA, 3 staff, offline sync |
| Pro   | ₦900/month | Basic + FHIR/DHIS2 export, smart duplicate merge, follow-up due alerts |

## Run it locally

You need Node 20+, Python 3.13, and a Supabase project.

```bash
# Frontend
npm install
cp .env.example .env.local     # then fill in your values
npm run dev                    # http://localhost:5173

# Python service (second terminal)
cd python-service
py -3.13 -m venv venv
source venv/Scripts/activate   # Git Bash on Windows
pip install -r requirements.txt
uvicorn main:app --reload      # http://127.0.0.1:8000/docs
```

Run `supabase/schema.sql` in the Supabase SQL editor first.

## Project structure

```
prima/
├── src/
│   ├── db.ts                  Dexie tables, indexes, sync hooks
│   ├── types.ts
│   ├── lib/                   age, schema (Zod), card numbers, sync, fuzzy client
│   ├── hooks/                 usePatients, useDebounce, useOnline
│   └── components/            PatientForm, PatientList, SyncBadge, ...
├── python-service/            FastAPI app
├── supabase/schema.sql        Tables, grants, row level security
└── api-tests/                 REST Client files
```

## Security and data notes (honest version)

- **Day 3 uses temporary open policies on Supabase for testing with fake data only.** They are replaced on Day 4 by Supabase Auth and row level security, so each facility only sees its own patients. Do not enter real patient data before then.
- Health data is covered by the Nigeria Data Protection Act. Real PHC use needs authentication, access control and backups.
- Plan checks in the UI are for presentation. A paid plan is recorded server-side before it is trusted.
- Immunization intervals in the app are a simplified schedule. Confirm them against the national schedule with a health worker before real use.

## Roadmap

- [x] Day 1-2: `phc-registry` reference build (Next.js + Prisma)
- [ ] Day 3: Registration, offline engine, Python setup (this repo)
- [ ] Day 4: Visits, dashboard, follow-up list, LGA summary, PWA, authentication
- [ ] Day 5: Payments, FHIR validation, print card, deploy, PHC officer guide
- [ ] Day 6: Go live
