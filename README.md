# Prima

**An offline-first patient register for Primary Health Centers (PHCs) in Nigeria.**

A nurse registers a patient on an Android phone, with or without network. Everything is saved on the device first and syncs to the cloud in the background when a connection is available.

> Status: built in public. Days 1-3 complete, Day 4 (app shell and responsive UI) in progress.

---

## The problem

Paper registers at PHCs lose patients, create duplicates (the same woman registered three times under different spellings), make the monthly LGA report a slow manual count, and give nobody a way to see who is due for their next vaccine. Many PHCs also have unreliable network, so an app that needs the internet to save a record does not work for them. Prima is **offline-first** for that reason.

## What Prima does today

- Registers patients with PHC-relevant fields: name, date of birth (age auto-calculated), gender, phone, village, LGA, state, next of kin, optional NHIS number, blood group, allergies.
- **Women over 12:** Gravida, Para and Pregnant fields appear.
- **Children under 5:** an immunization checklist appears (BCG, OPV 0, OPV 1, Penta 1, PCV 1, Measles 1) with dates and next-due dates.
- **New admission toggle:** records a chief complaint (5-200 characters) as the reason for first registration.
- **Live duplicate warning** (same name, date of birth, village) that works offline, plus a **similar-name check** (for example "Ngozi" vs "Ngozy", or swapped names) through a Python service.
- Instant search by name, phone, NHIS number or card number, served from the device with no spinner.
- Card numbers like `ANK-7K3F9Q`, generated on the device so two offline phones never wait for a server.
- Background sync to Supabase with a status badge (Synced / Offline / N waiting).
- Day 4: branded home screen, patient profile page, and a layout that adapts to phone, tablet and laptop.

## Build log (everything I did, in order)

### Day 1: `phc-registry` (Next.js + Prisma)

Project setup and database design. Every field was chosen for a PHC nurse: village for community reporting, next of kin for emergencies, NHIS number as optional, allergies as safety-critical free text. Patient IDs were UUIDs from the start, and age was never stored (date of birth is stored and age is calculated).

### Day 2: `phc-registry`, made clinically smart

Product feedback said the system had to reflect real clinical situations. Added:

- **Para, Gravida, isPregnant** for female patients.
- An **ImmunizationRecord** model (vaccine, dose number, date given, next due date) for children under 5.
- Human-readable card numbers with an atomic per-PHC counter.
- A validated API (`POST` and `GET /api/patients`) with Zod, clear 400/404/409 errors, and clinical rules enforced on the server: a male patient cannot be marked pregnant, a 10-year-old cannot have gravida, para cannot exceed gravida, vaccines cannot predate birth.
- Duplicate protection (same name + date of birth + village) and unique NHIS numbers.
- Search by name, phone, NHIS number and card number, with pagination.
- About 30 requests in VS Code REST Client to test it.

### The pivot: why a new repo called `Prima`

Building the API showed that a server-first app is the wrong foundation for a rural clinic. If the network drops, a form that posts to a server fails, and a nurse with a queue of patients cannot wait. The architecture changed:

|                   | `phc-registry` (Days 1-2)   | `Prima` (Day 3 onward)                       |
| ----------------- | --------------------------- | -------------------------------------------- |
| App               | Next.js, server-rendered    | React + Vite single-page app (PWA)           |
| Data on the phone | None                        | **IndexedDB (Dexie) is the source of truth** |
| Database          | Prisma + PostgreSQL         | Supabase Postgres, as a background copy      |
| Saving a patient  | HTTP request, fails offline | Local write, instant, queued for sync        |
| Extra services    | None                        | FastAPI (Python)                             |

A new repository was the cleaner choice: the two architectures are fundamentally different, `phc-registry` stays as an honest record of the learning (kept as a reference, not deleted), and a clean repo is easier to read and review. Carried over: the schema design, validation rules, age calculation, the duplicate rule, and the card-number idea. Left behind: Next.js API routes and the Prisma client.

### Day 3: the offline engine

- Vite + React + TypeScript + Tailwind scaffold with a custom colour system (deep teal, warm sand, signal orange) chosen for outdoor readability on a phone at low brightness.
- Supabase tables with explicit grants and row level security (temporary open policies for fake test data only).
- **Dexie database** with 5 tables and indexes, including a unique `cardNumber` and a compound `[name+dob+villageKey]` index for duplicate lookup.
- `usePatients()` with `useLiveQuery()` and `Map` caches, so the UI reads from the device.
- Registration form with React Hook Form + Zod, conditional fields, numeric keypads, large tap targets.
- **Sync engine v1:** a Dexie `creating` hook adds every new record to a `syncQueue`; a service pushes the queue to Supabase when online, retries on the browser `online` event and every 15 seconds, and guards against sync loops.
- **Python from zero:** installed Python 3.13, created a virtual environment, built a FastAPI service with rapidfuzz and an `/api/fuzzy-check` endpoint, tested with 6 REST Client requests.

### Day 4 (in progress): a real product shell

Feedback after Day 3: the app opened straight into a form and only worked well on a phone. Day 4 adds a routed app shell (bottom tabs on phones, sidebar on tablets and laptops), a branded home screen with live counts, a patient profile page, and a responsive two-column form.

## Decisions and why

| Decision                                                  | Reason                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| IndexedDB first, server second                            | The UI must never wait for the network                               |
| UUIDs and card numbers generated on the device            | Offline phones cannot ask a server for the next number               |
| Card alphabet without 0, O, 1, I, L                       | Readable aloud and on a printed card                                 |
| Store date of birth, not age                              | Age goes stale every year                                            |
| Dates as `YYYY-MM-DD` strings                             | No timezone bugs                                                     |
| Exact duplicate check in Dexie, fuzzy check in Python     | Exact works offline; fuzzy is a bonus that never blocks registration |
| Only same-date-of-birth patients sent to the Python check | Minimises patient data leaving the phone                             |
| Supabase + Render only                                    | Fewer platforms, lower monthly cost                                  |

## Challenges and how they were solved

- **Server-first cannot work offline.** Rebuilt as offline-first.
- **Python 3.11 had no Windows installer** (source-only security releases). Installed 3.13 alongside 3.14 and pinned the project with `py -3.13 -m venv`.
- **Card numbers without a server counter.** Random 6-character codes, with a retry on local collision and a regenerate-on-sync-clash safety net.
- **Sync loops.** Records pulled from the server must not be queued for upload again, so the hook checks a guard flag.
- **Newer Supabase projects need explicit table grants** before the API works. Added to the SQL.
- **Day 3 UI was only a form.** Day 4 adds the shell, home and responsive layouts.

## Architecture

```
┌─────────────── Nurse's device ───────────────┐
│  React UI ──reads──▶ Dexie (IndexedDB)       │
│      │                    ▲                  │
│      └───writes───────────┘                  │
│                           │                  │
│                     syncQueue                │
└───────────────────────────┼──────────────────┘
                            │ when online
                            ▼
                    Supabase (Postgres)
                            ▲
                            │
             FastAPI (Python): fuzzy duplicates,
             LGA report, FHIR validation
```

## Standards approach

Prima is built local-first but standards-aware. Nigeria itself is moving toward FHIR and DHIS2: the National Digital Health Architecture, a Nigeria Core FHIR Implementation Guide (still under development), an immunization FHIR guide from NPHCDA, and DHIS2 as the national reporting platform. Prima aligns in layers rather than claiming compliance:

- FHIR R4 export and validation (Patient, Immunization, Encounter), aligned with Nigeria Core as it matures
- DHIS2-compatible aggregate reports
- ICD-10 coded diagnoses (WHO standard)
- ISO 8601 dates, UUID identifiers, E.164 phone numbers
- WCAG 2.1 AA accessibility targets
- Nigeria Data Protection Act principles: consent, data minimisation, access control, audit trail

## Plans

| Plan  | Price      | Includes                                                               |
| ----- | ---------- | ---------------------------------------------------------------------- |
| Free  | ₦0         | 1 facility, 200 patients, no export                                    |
| Basic | ₦500/month | Unlimited patients, CSV export, LGA report, PWA, 3 staff, offline sync |
| Pro   | ₦900/month | Basic + FHIR/DHIS2 export, smart duplicate merge, follow-up due alerts |

## Run locally

Needs Node 20+, Python 3.13 and a Supabase project. Run `supabase/schema.sql` in the Supabase SQL editor first.

```bash
npm install
cp .env.example .env.local     # fill in your values
npm run dev                    # http://localhost:5173

cd python-service
py -3.13 -m venv venv
source venv/Scripts/activate   # Git Bash on Windows
pip install -r requirements.txt
uvicorn main:app --reload      # http://127.0.0.1:8000/docs
```
