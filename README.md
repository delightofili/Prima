# Prima

**An offline-first patient register and visit record for Primary Health Centers (PHCs) in Nigeria.**

A nurse registers patients, records visits, tracks vaccines and sees who is due for follow-up, on an Android phone, tablet or laptop, with or without network. Everything is saved on the device first and syncs both ways with the cloud in the background.

> Status: built in public. Days 1-6 complete, Day 7 (dashboard and follow-ups) in progress. Roadmap runs to Day 15 (go live), with feedback-driven work after that.

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
- Similar-name check (for example "Ngozi" vs "Ngozy", or swapped names) through a Python service, skipped silently when offline.

**Visits and vaccines**
- Visits: date, complaints, blood pressure, temperature, weight, ICD-10 diagnosis (searchable in plain words), treatment notes, next follow-up date. Vitals guidance flags appear live.
- Complaints are pre-filled with "Follow-up for: <reason for first registration>".
- Later vaccine doses can be added from the profile, each recording which vaccine is due next and when.

**Edit, delete, undo, sync**
- Edit patients and visits. Delete patients, visits and vaccine records with confirmation and a timed Undo (soft delete).
- Two-way sync: changes made on one device appear on the others, and a cleared browser rebuilds itself from the cloud. Failed syncs are visible and retryable.

**Dashboard and follow-ups (Day 7)**
- Dashboard with a month selector: total patients, new this month, visits, under-5, pregnant, gender split, age groups, activity per day, top diagnoses and top villages. All calculated on the device from local data.
- Follow-up due list: overdue and upcoming follow-up visits and next vaccine doses, with one-tap call to the patient or caregiver. Free and Basic plans see the counts; the full list is a Pro feature.
- Plans page showing Free, Basic and Pro.

**Glove mode (Day 7)**
- A switch that enlarges buttons, inputs, checkboxes and navigation for gloved or one-handed use. Feedback from clinic work: nurses often use one hand with gloves.

**App experience**
- Branded home screen, responsive layout (bottom tabs on phones, sidebar on tablets and laptops), icons throughout, toast confirmations, visible keyboard focus.
- Instant search by name, phone (any format), NHIS number or card number, with no spinner.

## Build log (everything we did, in order)

### Day 1: `phc-registry` (Next.js + Prisma)
Project setup and database design. Every field was chosen for a PHC nurse. Patient IDs were UUIDs from the start, and age was never stored (date of birth is stored and age is calculated).

### Day 2: `phc-registry`, made clinically smart
Product feedback said the system had to reflect real clinical situations. Added Para, Gravida and isPregnant for female patients, an immunization record model for children under 5, human-readable card numbers, a validated API with clinical rules on the server (no pregnant men, no gravida for a 10-year-old, para cannot exceed gravida, no vaccine before birth), duplicate protection, unique NHIS numbers, and search by name, phone, NHIS and card number. About 30 REST Client requests tested it.

### The pivot: why a new repo called `prima`
Building the API showed that a server-first app is the wrong foundation for a rural clinic. If the network drops, a form that posts to a server fails, and a nurse with a queue of patients cannot wait. The architecture changed:

| | `phc-registry` (Days 1-2) | `prima` (Day 3 onward) |
|---|---|---|
| App | Next.js, server-rendered | React + Vite single-page app (PWA) |
| Data on the phone | None | **IndexedDB (Dexie) is the source of truth** |
| Database | Prisma + PostgreSQL | Supabase Postgres, as a background copy |
| Saving a patient | HTTP request, fails offline | Local write, instant, queued for sync |
| Extra services | None | FastAPI (Python) |

A new repository was the cleaner choice: the architectures are fundamentally different, `phc-registry` stays as an honest record of the learning (kept as a reference), and a clean repo is easier to read and review. Carried over: the schema design, validation rules, age calculation, the duplicate rule and the card-number idea. Left behind: Next.js API routes and the Prisma client.

### Day 3: the offline engine
Vite + React + TypeScript + Tailwind with a colour system chosen for outdoor readability (deep teal, warm sand, signal orange). Supabase tables with explicit grants and RLS. A Dexie database with a unique card number index and a compound `[name+dob+villageKey]` index for duplicate lookup. `usePatients()` with `useLiveQuery()` and `Map` caches. A registration form with React Hook Form + Zod and conditional fields. Sync engine v1 (a Dexie hook queues every change, a service pushes when online). Python from zero: Python 3.13, a virtual environment, FastAPI, rapidfuzz and an `/api/fuzzy-check` endpoint with 6 REST Client tests.

### Day 4: a real product shell
Feedback after Day 3: the app opened straight into a form and only worked well on a phone. Added a routed app shell, a branded home screen, a patient profile page, a responsive two-column form, a logo, badges, stat tiles and page headers.

### Day 5: visits
A `Visit` record synced through the same queue, a visit form with BP as two integers, temperature, weight, complaints, an ICD-10 diagnosis picker (about 45 common conditions plus free text), live vitals flags, the "Follow-up for:" prefill from a LinkedIn review, visit history, icons, toasts, page titles and focus rings. Fixed a stuck "1 need attention" sync badge (failed items are now retryable, weak signal no longer counts as failure, a details panel shows the real error) and a dialog that rendered behind the page (portal).

### Day 6: edit, delete and two-way sync
Edit forms for patients and visits, soft delete with confirmation and Undo, sync v2 with a server-maintained `synced_at` clock and a pull of changes since the last sync, later vaccine doses with the next dose recorded, and E.164 phone numbers with a one-time migration and tap-to-call links.

### Day 7: insight and revenue (in progress)
- A **dashboard** built with Recharts from local data (gender donut, age groups, per-day activity, top diagnoses, top villages), with a month selector and a development timing readout to prove it is fast.
- A **follow-up due list** built from indexed Dexie range queries on next-due dates, showing overdue and upcoming follow-up visits and next vaccine doses, with one-tap calling. Gated to the Pro plan in the UI.
- A **plans page** and a small plan helper, with a development-only switch for testing.
- **Glove mode**, a response to feedback about one-handed use with gloves.

## Decisions and why

| Decision | Reason |
|---|---|
| IndexedDB first, server second | The UI must never wait for the network |
| UUIDs and card numbers generated on the device | Offline phones cannot ask a server for the next number |
| Store date of birth, not age; dates as `YYYY-MM-DD` strings | No stale ages, no timezone bugs |
| Exact duplicate check in Dexie, fuzzy check in Python | Exact works offline; fuzzy is a bonus that never blocks registration |
| Diagnosis as ICD-10 code plus label, with free-text fallback | Standards-aligned reporting without blocking a nurse |
| Soft delete | Deletes must sync to other devices, be undoable, and leave an audit trail |
| Pull cursor uses a server clock, not the phone's | Phone clocks are often wrong |
| Dashboard computed on the device from local data | Instant and works offline |
| Follow-up uses the patient's latest visit only | An earlier follow-up is satisfied once the patient returns |
| Vaccine follow-ups only for under-5s | Routine schedule applies to young children |
| Show follow-up counts to everyone, the list only on Pro | The count demonstrates the value; the names are the product |
| Glove mode as a switch | Bigger targets cost screen space, so nurses choose |
| Supabase + Render only | Fewer platforms, lower monthly cost |

## Challenges and how they were solved

- **Server-first cannot work offline.** Rebuilt as offline-first.
- **Python 3.11 had no Windows installer.** Used 3.13 alongside 3.14 with a project virtual environment.
- **Card numbers without a server counter.** Random 6-character codes with collision retries.
- **Sync loops.** Records pulled from the server are marked per transaction so they are not uploaded again.
- **Invisible sync failures.** A tappable status badge with error details and a retry button.
- **A dialog appeared behind the page** because a sticky sidebar creates its own stacking layer. Fixed with a portal.
- **Two phones editing the same record.** Resolved by most recent edit, documented as a trade-off because it relies on device clocks.

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
                            ▲
                            │
             FastAPI (Python): fuzzy duplicates,
             LGA report, FHIR validation
```

## Standards approach

Nigeria is moving toward FHIR and DHIS2: the National Digital Health Architecture, a Nigeria Core FHIR Implementation Guide (still under development), an immunization FHIR guide from NPHCDA, and DHIS2 as the national reporting platform. Prima aligns in layers rather than claiming compliance: FHIR R4 export and validation, DHIS2-compatible aggregate reports, ICD-10 diagnoses, ISO 8601 dates, UUID identifiers, E.164 phone numbers, WCAG 2.1 AA accessibility targets, and Nigeria Data Protection Act principles (consent, data minimisation, access control, audit trail).

## Plans

| Plan | Price | Includes |
|---|---|---|
| Free | ₦0 | 1 facility, 200 patients, no export |
| Basic | ₦500/month | Unlimited patients, CSV export, LGA report, PWA, 3 staff, offline sync |
| Pro | ₦900/month | Basic + follow-up due list, FHIR/DHIS2 export, smart duplicate merge |

## Roadmap

| Phase | Day | Focus | Status |
|---|---|---|---|
| Foundation | 1-2 | `phc-registry` reference build | Done |
| | 3 | Offline engine, registration, Python setup | Done |
| Product | 4 | App shell, responsive UI, home, patient profile | Done |
| | 5 | Visits, ICD-10 diagnosis, history | Done |
| | 6 | Edit and delete, sync v2, later vaccines, E.164 phones | Done |
| Insight and revenue | 7 | Dashboard, follow-up due list, plans page, glove mode | In progress |
| | 8 | LGA summary, CSV export, plans and paywall, 200-patient limit | Planned |
| | 9 | Python LGA report, duplicate merge tool | Planned |
| Trust | 10 | Supabase Auth, row level security, passcode lock, audit log, consent | Planned |
| | 11 | PWA, installable on Android, real-device test (including with gloves) | Planned |
| Standards and payment | 12 | FHIR export and validation, DHIS2 export | Planned |
| | 13 | Paystack payments, subscriptions, clinical term validation | Planned |
| Launch | 14 | Print card with QR, seed data, accessibility, sticky save bar and vitals steppers | Planned |
| | 15 | Deploy, PHC officer guide, go live | Planned |

After Day 15 the work is driven by feedback from real PHCs and reviewers.

## Run locally

Needs Node 20+, Python 3.13 and a Supabase project. Run `supabase/schema.sql` (plus the Day 5 and Day 6 SQL) in the Supabase SQL editor first.

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

## Security and clinical notes

- The current Supabase policies are temporary and open, for fake test data only. Day 10 replaces them with authentication and per-facility row level security. Do not enter real patient data before then.
- Plan checks in the app are presentation only. A paid plan is verified server-side from Day 13.
- Deletes are soft. Permanent erasure on request needs a process, planned with the audit log on Day 10.
- Conflicts between two devices are resolved by the most recent edit time, which depends on device clocks.
- Immunization intervals, vitals thresholds, follow-up rules and the ICD-10 list are simplified starting points. Confirm them with a health worker against national guidance before real use.
- Glove mode is a first pass. It needs testing with real gloves on a real phone.

## Facts for the LinkedIn post

- Problem: paper registers lose and duplicate patients; the LGA report is counted by hand; follow-ups depend on a nurse's memory.
- Origin: a public health graduate learning software engineering, building for PHCs.
- Pivot: started server-first, then rebuilt offline-first after seeing that network drops break clinic workflow.
- Numbers: 2 repos (1 reference, 1 product); about 30 API tests on Day 2; 6 Python tests on Day 3; a 31-character card alphabet; about 45 ICD-10 conditions searchable in plain language; 20 vaccine doses in the schedule; 5 charts computed on the device.
- Day 6 headline: a phone that loses its data can rebuild itself from the cloud.
- Day 7 headline: "5 children due for Penta 2 this week" appears from local data, with one tap to call the caregiver. Glove mode came from a reviewer's note that nurses work one-handed in gloves.
- Learned: Python from zero, FastAPI, Dexie hooks and range queries, offline-first design, soft deletes, sync conflict handling, Recharts, responsive layouts, accessibility basics.
- Feedback loops: product feedback produced Para/Gravida and immunizations; a LinkedIn review produced the chief complaint field and the follow-up prefill; a commenter pushed for global standards; a UI critique produced the Day 4 redesign; a clinic-practice note produced glove mode.