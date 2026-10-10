# Prima

**An offline-first patient register and visit record for Primary Health Centers (PHCs) in Nigeria.**

A nurse registers patients, records visits and tracks vaccines on an Android phone, tablet or laptop, with or without network. Everything is saved on the device first and syncs both ways with the cloud in the background.

> Status: built in public. Days 1-5 complete, Day 6 (edit, delete, two-way sync) in progress. Roadmap runs to Day 15 (go live).

---

## The problem

Paper registers at PHCs lose patients, create duplicates (the same woman registered three times under different spellings), make the monthly LGA report a slow manual count, and give nobody a way to see who is due for a follow-up or the next vaccine. Many PHCs also have unreliable network, so an app that needs the internet to save a record does not work for them. Prima is **offline-first** for that reason.

## What Prima does today

**Registration**
- PHC-relevant fields: name, date of birth (age auto-calculated), gender, phone, village, LGA, state, next of kin, optional NHIS number, blood group, allergies.
- **Women over 12:** Gravida, Para and Pregnant fields appear.
- **Children under 5:** an immunization checklist appears with dates and next-due dates.
- **New admission toggle:** records a chief complaint (5-200 characters) as the reason for first registration.
- Card numbers like `ANK-7K3F9Q`, generated on the device so two offline phones never wait for a server.
- Phone numbers are stored in international format (E.164, `+2348031234567`) and shown in the familiar local style.

**Safety against duplicates**
- Live duplicate warning (same name, date of birth, village) from a Dexie compound index. Works offline.
- Similar-name check (for example "Ngozi" vs "Ngozy", or swapped names) through a Python service. Skipped silently when offline.

**Visits**
- Date, complaints, blood pressure, temperature, weight, diagnosis, treatment notes and next follow-up date.
- Diagnoses from a searchable ICD-10 list (plain words like "sugar" find diabetes), or free text.
- Complaints pre-filled with "Follow-up for: <reason for first registration>", editable.
- Vitals guidance flags shown live (BP flags only for patients 13 and over), with a "not a diagnosis" note.

**Vaccines (Day 6)**
- Add later doses from the profile (OPV, Penta, PCV, Rota, IPV, Measles, Yellow fever and more).
- Each dose records which vaccine is due next and when, ready for the follow-up due list.

**Edit, delete, undo (Day 6)**
- Edit patients and visits. Delete patients, visits and vaccine records with a confirmation and a timed Undo.
- Deletes are soft (the record is hidden, not erased), so they sync to every device and can be restored.

**Two-way sync (Day 6)**
- Changes made on one device appear on the others. A new phone, or a cleared browser, rebuilds itself from the cloud.
- Conflicts are resolved by the most recent edit. Failed syncs are visible and retryable from the status badge.

**App experience**
- Branded home screen with live counts, recent patients and a welcome state.
- Responsive layout: bottom tabs on phones, sidebar on tablets and laptops, two-column forms on wide screens.
- Patient profile with the reason for first registration, visits, obstetric details, immunizations (overdue flagged) and tap-to-call phone numbers.
- Icons throughout, toast confirmations, page titles, visible keyboard focus.
- Instant search by name, phone (any format), NHIS number or card number, with no spinner.

## Build log (everything we did, in order)

### Day 1: `phc-registry` (Next.js + Prisma)
Project setup and database design. Every field was chosen for a PHC nurse: village for community reporting, next of kin for emergencies, NHIS number as optional, allergies as safety-critical free text. Patient IDs were UUIDs from the start, and age was never stored (date of birth is stored and age is calculated).

### Day 2: `phc-registry`, made clinically smart
Product feedback said the system had to reflect real clinical situations. Added:
- **Para, Gravida, isPregnant** for female patients.
- An **ImmunizationRecord** model (vaccine, dose number, date given, next due date) for children under 5.
- Human-readable card numbers with an atomic per-PHC counter.
- A validated API (`POST` and `GET /api/patients`) with Zod, clear 400/404/409 errors, and clinical rules on the server: a male patient cannot be marked pregnant, a 10-year-old cannot have gravida, para cannot exceed gravida, vaccines cannot predate birth.
- Duplicate protection, unique NHIS numbers, search by name, phone, NHIS and card number, with pagination.
- About 30 requests in VS Code REST Client to test it.

### The pivot: why a new repo called `prima`
Building the API showed that a server-first app is the wrong foundation for a rural clinic. If the network drops, a form that posts to a server fails, and a nurse with a queue of patients cannot wait. The architecture changed:

| | `phc-registry` (Days 1-2) | `prima` (Day 3 onward) |
|---|---|---|
| App | Next.js, server-rendered | React + Vite single-page app (PWA) |
| Data on the phone | None | **IndexedDB (Dexie) is the source of truth** |
| Database | Prisma + PostgreSQL | Supabase Postgres, as a background copy |
| Saving a patient | HTTP request, fails offline | Local write, instant, queued for sync |
| Extra services | None | FastAPI (Python) |

A new repository was the cleaner choice: the two architectures are fundamentally different, `phc-registry` stays as an honest record of the learning (kept as a reference, not deleted), and a clean repo is easier to read and review. Carried over: the schema design, validation rules, age calculation, the duplicate rule, and the card-number idea. Left behind: Next.js API routes and the Prisma client.

### Day 3: the offline engine
- Vite + React + TypeScript + Tailwind scaffold with a custom colour system (deep teal, warm sand, signal orange) chosen for outdoor readability on a phone at low brightness.
- Supabase tables with explicit grants and row level security (temporary open policies for fake test data only).
- **Dexie database** with indexes, including a unique `cardNumber` and a compound `[name+dob+villageKey]` index for duplicate lookup.
- `usePatients()` with `useLiveQuery()` and `Map` caches, so the UI reads from the device.
- Registration form with React Hook Form + Zod, conditional fields, numeric keypads, large tap targets.
- **Sync engine v1:** a Dexie hook adds every new record to a `syncQueue`; a service pushes the queue to Supabase when online and retries on reconnect.
- **Python from zero:** Python 3.13, a virtual environment, a FastAPI service with rapidfuzz and an `/api/fuzzy-check` endpoint, tested with 6 REST Client requests.

### Day 4: a real product shell
Feedback after Day 3: the app opened straight into a form and only worked well on a phone. Added a routed app shell (bottom tabs on phones, sidebar on tablets and laptops), a branded home screen with live counts, a patient profile page, a responsive two-column form, a logo, badges, stat tiles and page headers.

### Day 5: visits
- A `Visit` record synced through the same offline queue, with a new Supabase `visits` table.
- A visit form with BP (two integers), temperature, weight, complaints, diagnosis, treatment and a follow-up date with quick buttons.
- A searchable **ICD-10 picker** with about 45 common PHC conditions and free-text fallback.
- Live vitals flags, the "Follow-up for: ..." prefill from a LinkedIn review, visit history newest first, a follow-up chip.
- Professional touches: icons, toast notifications, page titles, keyboard focus rings.
- Fixed a stuck "1 need attention" sync badge: a failed item is now retryable, a weak signal no longer counts as a failure, and a sync details panel shows the actual error. Fixed a dialog that rendered underneath the page by moving it into a portal.

### Day 6: edit, delete and two-way sync
- **Edit** patients and visits with the same forms. **Soft delete** with confirmation and an Undo toast, so a delete syncs to every device and is reversible.
- **Sync v2:** a server-maintained `synced_at` clock drives a pull of changes since the last sync, applied with a "most recent edit wins" rule. Updates and deletes now sync, not just creates. Pulled records are never sent back up, using a per-transaction flag.
- **Later vaccine doses** with the next vaccine and due date recorded, for the future follow-up list.
- **E.164 phone numbers:** stored internationally, shown locally, searchable in any format, with a one-time migration of existing records and tap-to-call links.

## Decisions and why

| Decision | Reason |
|---|---|
| IndexedDB first, server second | The UI must never wait for the network |
| UUIDs and card numbers generated on the device | Offline phones cannot ask a server for the next number |
| Card alphabet without 0, O, 1, I, L | Readable aloud and on a printed card |
| Store date of birth, not age | Age goes stale every year |
| Dates as `YYYY-MM-DD` strings | No timezone bugs |
| Exact duplicate check in Dexie, fuzzy check in Python | Exact works offline; fuzzy is a bonus that never blocks registration |
| Only same-date-of-birth patients sent to the Python check | Minimises patient data leaving the phone |
| BP as two integers; temperature and weight as numbers | Allows flags, charts and reports later |
| Diagnosis as ICD-10 code plus label, with free-text fallback | Standards-aligned reporting without blocking a nurse |
| Vitals flags are a guide, BP flags only for 13+ | Children's BP norms depend on age, height and sex |
| Soft delete, not hard delete | Deletes must sync to other devices, be undoable, and leave an audit trail |
| Pull cursor uses a server clock (`synced_at`), not the phone's clock | Phone clocks are often wrong |
| Phones stored as E.164 | One format for search, dialling, export and FHIR |
| Supabase + Render only | Fewer platforms, lower monthly cost |

## Challenges and how they were solved

- **Server-first cannot work offline.** Rebuilt as offline-first.
- **Python 3.11 had no Windows installer.** Installed 3.13 alongside 3.14 and pinned the project with `py -3.13 -m venv`.
- **Card numbers without a server counter.** Random 6-character codes, a retry on local collision and a regenerate-on-sync-clash safety net.
- **Sync loops.** Records pulled from the server must not be queued for upload again, so the sync hook checks a flag on the pull transaction.
- **Newer Supabase projects need explicit table grants.** Added to the SQL.
- **Hooks that write to the sync queue need the queue inside the same transaction.**
- **Sync failures were invisible.** Added a tappable status badge with error details and a retry button.
- **A dialog appeared behind the page** because a sticky sidebar creates its own stacking layer. Fixed with a portal.
- **Two phones editing the same record.** Resolved by most recent edit; documented as a known trade-off because it relies on device clocks.

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

Prima is built local-first but standards-aware. Nigeria is moving toward FHIR and DHIS2: the National Digital Health Architecture, a Nigeria Core FHIR Implementation Guide (still under development), an immunization FHIR guide from NPHCDA, and DHIS2 as the national reporting platform. Prima aligns in layers rather than claiming compliance:

- FHIR R4 export and validation (Patient, Immunization, Encounter), aligned with Nigeria Core as it matures
- DHIS2-compatible aggregate reports
- ICD-10 coded diagnoses (WHO standard), starting with a small list
- ISO 8601 dates, UUID identifiers, E.164 phone numbers
- WCAG 2.1 AA accessibility targets
- Nigeria Data Protection Act principles: consent, data minimisation, access control, audit trail

## Plans

| Plan | Price | Includes |
|---|---|---|
| Free | ₦0 | 1 facility, 200 patients, no export |
| Basic | ₦500/month | Unlimited patients, CSV export, LGA report, PWA, 3 staff, offline sync |
| Pro | ₦900/month | Basic + FHIR/DHIS2 export, smart duplicate merge, follow-up due alerts |


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
