# Prima

**An offline-first patient register and visit record for Primary Health Centers (PHCs) in Nigeria.**

A nurse registers patients, records visits, tracks vaccines, sees who is due for follow-up and produces the monthly LGA summary, on an Android phone, tablet or laptop, with or without network. Everything is saved on the device first and syncs both ways with the cloud in the background.

> Status: built in public. Days 1-7 complete, Day 8 (LGA report, CSV export, plans and paywall) in progress. Roadmap runs to Day 15 (go live), with feedback-driven work after that.

---

## The problem

Paper registers at PHCs lose patients, create duplicates (the same woman registered three times under different spellings), make the monthly LGA report a slow manual count, and give nobody a way to see who is due for a follow-up or the next vaccine. Many PHCs also have unreliable network, so an app that needs the internet to save a record does not work for them. Prima is **offline-first** for that reason.

## What Prima does today

**Registration**

- PHC-relevant fields: name, date of birth (age auto-calculated), gender, phone, village, LGA, state, next of kin, optional NHIS number, blood group, allergies.
- Women over 12 get Gravida, Para and Pregnant fields. Children under 5 get an immunization checklist.
- A "new admission" toggle records a chief complaint as the reason for first registration.
- Card numbers like `ANK-7K3F9Q` are generated on the device, so offline phones never wait for a server.
- Phone numbers are stored in international format (E.164) and shown in the familiar local style.

**Duplicate protection**

- Live duplicate warning (same name, date of birth, village) that works offline.
- Similar-name check ("Ngozi" vs "Ngozy", or swapped names) through an optional Python service, skipped silently when it is unavailable.

**Visits and vaccines**

- Visits: date, complaints, blood pressure, temperature, weight, ICD-10 diagnosis (searchable in plain words), treatment, next follow-up date, with live vitals guidance flags.
- Complaints are pre-filled with "Follow-up for: <reason for first registration>".
- Later vaccine doses can be added from the profile, each recording which vaccine is due next and when.

**Edit, delete, undo, sync**

- Edit patients and visits. Delete patients, visits and vaccine records with confirmation and a timed Undo (soft delete).
- Two-way sync: changes made on one device appear on the others, and a cleared browser rebuilds itself from the cloud. Failed syncs are visible and retryable.

**Dashboard and follow-ups**

- Dashboard with a month selector: totals, new patients, visits, under-5, pregnant, gender split, age groups, activity per day, top diagnoses and top villages, all computed on the device.
- Follow-up due list: overdue and upcoming follow-up visits and next vaccine doses, with one-tap call to the patient or caregiver.

**LGA summary and export (Day 8)**

- Monthly LGA summary: new registrations, patients seen, total visits, visits by age group and sex, top diagnoses with ICD-10 codes, immunization doses given, and antenatal, postnatal, child welfare and family planning visits (from coded diagnoses).
- CSV export of the LGA summary and of the full patient register, built for Excel (UTF-8 with Igbo and Yoruba letters, safe against spreadsheet formula injection).

**Plans and limits (Day 8)**

- Free: 1 facility, up to 200 patients, no export. Basic adds unlimited patients, CSV export and the LGA report. Pro adds the follow-up list, FHIR/DHIS2 export and duplicate merge.
- A usage bar warns at 180 of 200 patients, and registration stops cleanly at 200 with an upgrade prompt. Export buttons on the Free plan open an upgrade dialog.

**Comfort and polish**

- Glove mode enlarges controls for gloved or one-handed use.
- Branded home screen, responsive layout (bottom tabs on phones, sidebar on tablets and laptops), icons throughout, toast confirmations, visible keyboard focus.
- Instant search by name, phone (any format), NHIS number or card number.

## Build log (everything we did, in order)

### Day 1: `phc-registry` (Next.js + Prisma)

Project setup and database design. Every field was chosen for a PHC nurse. Patient IDs were UUIDs from the start, and age was never stored (date of birth is stored and age is calculated).

### Day 2: `phc-registry`, made clinically smart

Product feedback said the system had to reflect real clinical situations. Added Para, Gravida and isPregnant, an immunization record model for children under 5, human-readable card numbers, a validated API with clinical rules on the server (no pregnant men, no gravida for a 10-year-old, para cannot exceed gravida, no vaccine before birth), duplicate protection, unique NHIS numbers and search. About 30 REST Client requests tested it.

### The pivot: why a new repo called `prima`

Building the API showed that a server-first app is the wrong foundation for a rural clinic. If the network drops, a form that posts to a server fails, and a nurse with a queue of patients cannot wait. The architecture changed:

|                   | `phc-registry` (Days 1-2)   | `prima` (Day 3 onward)                       |
| ----------------- | --------------------------- | -------------------------------------------- |
| App               | Next.js, server-rendered    | React + Vite single-page app (PWA)           |
| Data on the phone | None                        | **IndexedDB (Dexie) is the source of truth** |
| Database          | Prisma + PostgreSQL         | Supabase Postgres, as a background copy      |
| Saving a patient  | HTTP request, fails offline | Local write, instant, queued for sync        |
| Extra services    | None                        | FastAPI (Python), optional                   |

A new repository was the cleaner choice: the architectures are fundamentally different, `phc-registry` stays as an honest record of the learning (kept as a reference), and a clean repo is easier to read and review. Carried over: the schema design, validation rules, age calculation, the duplicate rule and the card-number idea. Left behind: Next.js API routes and the Prisma client.

### Day 3: the offline engine

Vite + React + TypeScript + Tailwind with a colour system chosen for outdoor readability. Supabase tables with explicit grants and RLS. A Dexie database with a unique card number index and a compound `[name+dob+villageKey]` index. `usePatients()` with `useLiveQuery()` and `Map` caches. A registration form with React Hook Form + Zod. Sync engine v1. Python from zero: Python 3.13, a virtual environment, FastAPI, rapidfuzz and an `/api/fuzzy-check` endpoint with 6 REST Client tests.

### Day 4: a real product shell

Feedback: the app opened straight into a form and only worked well on a phone. Added a routed app shell, a branded home screen, a patient profile, a responsive two-column form and reusable components.

### Day 5: visits

A `Visit` record synced through the same queue, a visit form with BP as two integers, an ICD-10 picker (about 45 common conditions plus free text), live vitals flags, the "Follow-up for:" prefill from a LinkedIn review, visit history, icons and toasts. Fixed a stuck "1 need attention" sync badge and a dialog that rendered behind the page (portal).

### Day 6: edit, delete and two-way sync

Edit forms, soft delete with Undo, sync v2 with a server-maintained `synced_at` clock and a pull of changes since the last sync, later vaccine doses, and E.164 phone numbers with a one-time migration.

### Day 7: insight

A Recharts dashboard computed on the device, a follow-up due list built from indexed Dexie range queries and gated to Pro, a plans page, and glove mode in response to feedback that nurses work one-handed in gloves.

### Day 8: reports, export and plan limits (in progress)

- A monthly **LGA summary** built from visits, patients and vaccines, using the patient's age on the day of each visit.
- **CSV export** with UTF-8 byte-order mark, correct quoting, and a guard against spreadsheet formula injection.
- **Plan gating** for the LGA report, CSV export and the 200-patient limit, enforced both in the screen and in the save function.
- A **developer-only demo data tool** that creates fake patients, visits and vaccines on the device only, to test limits and reports.
- A **costs and hosting plan** so Prima can run at almost no cost until it has paying users (see below).

## Decisions and why

| Decision                                                           | Reason                                                               |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| IndexedDB first, server second                                     | The UI must never wait for the network                               |
| UUIDs and card numbers generated on the device                     | Offline phones cannot ask a server for the next number               |
| Store date of birth, not age; dates as `YYYY-MM-DD` strings        | No stale ages, no timezone bugs                                      |
| Exact duplicate check in Dexie, fuzzy check in Python              | Exact works offline; fuzzy is a bonus that never blocks registration |
| Diagnosis as ICD-10 code plus label, with free-text fallback       | Standards-aligned reporting without blocking a nurse                 |
| Soft delete                                                        | Deletes must sync, be undoable, and leave an audit trail             |
| Pull cursor uses a server clock, not the phone's                   | Phone clocks are often wrong                                         |
| Dashboard and LGA report computed on the device                    | Instant, works offline, no server cost                               |
| LGA report ages patients on the visit date                         | A child's age group must match when they were seen                   |
| CSV prefixes cells that start with `=`, `+`, `-` or `@`            | Prevents spreadsheet formula injection from patient-entered text     |
| Free plan limit checked in the save function as well as the screen | Fewer ways around the limit                                          |
| Show counts to everyone, details on paid plans                     | The count demonstrates the value; the detail is the product          |
| Glove mode as a switch                                             | Bigger targets cost screen space, so nurses choose                   |

## Challenges and how they were solved

- **Server-first cannot work offline.** Rebuilt as offline-first.
- **Python 3.11 had no Windows installer.** Used 3.13 alongside 3.14 with a project virtual environment.
- **Card numbers without a server counter.** Random 6-character codes with collision retries.
- **Sync loops.** Records pulled from the server are marked per transaction so they are not uploaded again.
- **Invisible sync failures.** A tappable status badge with error details and a retry button.
- **A dialog appeared behind the page** because a sticky sidebar creates its own stacking layer. Fixed with a portal.
- **Two phones editing the same record.** Resolved by most recent edit, documented as a trade-off because it relies on device clocks.
- **Testing a 200-patient limit by hand is painful.** Added a developer-only seeder.
- **Hosting costs against an unfunded start.** Chose free tiers, kept the Python service optional, and delayed paid plans until real data and paying users exist.

## Architecture

```
┌─────────────── Nurse's device ───────────────┐
│  React UI ──reads──▶ Dexie (IndexedDB)       │
│      │                    ▲   ▲              │
│      └───writes───────────┘   │              │
│                        syncQueue  pull        │
└───────────────────────────┼───────┼──────────┘
                    push    │       │ changes since last sync
                            ▼       │
                    Supabase (Postgres)

        Optional: FastAPI (Python) for fuzzy duplicates,
        FHIR validation and server-side reports
```

## Standards approach

Nigeria is moving toward FHIR and DHIS2: the National Digital Health Architecture, a Nigeria Core FHIR Implementation Guide (still under development), an immunization FHIR guide from NPHCDA, and DHIS2 as the national reporting platform. Prima aligns in layers rather than claiming compliance: FHIR R4 export and validation, DHIS2-compatible aggregate reports, ICD-10 diagnoses, ISO 8601 dates, UUID identifiers, E.164 phone numbers, WCAG 2.1 AA accessibility targets, and Nigeria Data Protection Act principles.

## Plans

| Plan  | Price      | Includes                                                               |
| ----- | ---------- | ---------------------------------------------------------------------- |
| Free  | ₦0         | 1 facility, up to 200 patients, no export                              |
| Basic | ₦500/month | Unlimited patients, CSV export, LGA report, PWA, 3 staff, offline sync |
| Pro   | ₦900/month | Basic + follow-up due list, FHIR/DHIS2 export, smart duplicate merge   |

## Run locally

Needs Node 20+, Python 3.13 (optional) and a Supabase project. Run `supabase/schema.sql` (plus the Day 5 and Day 6 SQL) in the Supabase SQL editor first.

```bash
npm install
cp .env.example .env.local     # fill in your values
npm run dev                    # http://localhost:5173

cd python-service              # optional
py -3.13 -m venv venv
source venv/Scripts/activate   # Git Bash on Windows
pip install -r requirements.txt
uvicorn main:app --reload      # http://127.0.0.1:8000/docs
```

## Security and clinical notes

- The current Supabase policies are temporary and open, for fake test data only. Day 10 replaces them with authentication and per-facility row level security. Do not enter real patient data before then.
- Plan checks in the app are presentation and convenience only. A paid plan is verified server-side from Day 13.
- Deletes are soft. Permanent erasure on request needs a process, planned with the audit log on Day 10.
- Conflicts between two devices are resolved by the most recent edit time, which depends on device clocks.
- The LGA summary is built from records on the device and is not the official NHMIS form. Check your LGA's required format.
- Immunization intervals, vitals thresholds, follow-up rules, the ICD-10 list and the report groupings are simplified starting points. Confirm them with a health worker against national guidance before real use.
- Before real PHC data, check Nigeria Data Protection Act and NDPC requirements for the product.
