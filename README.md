# Prima

**An offline-first patient register and visit record for Primary Health Centers (PHCs) in Nigeria.**

A nurse registers patients, records visits, tracks vaccines, links children to their guardians, sees who is due for follow-up, queues appointment reminders, cleans up duplicate records and produces the monthly LGA summary, on an Android phone, tablet or laptop, with or without network. Everything is saved on the device first and syncs both ways with the cloud in the background.

> Status: built in public. Days 1-11 complete, Day 12 (SMS reminders base) in progress. The roadmap runs to Day 25, then continues with feedback from real PHCs.

---

## The problem

Paper registers at PHCs lose patients, create duplicates (the same woman registered three times under different spellings), make the monthly LGA report a slow manual count, and give nobody a way to see who is due for a follow-up or the next vaccine. Children are usually registered under their mother's phone, so the card of a baby and the antenatal card of the mother are never connected. Many PHCs also have unreliable network, so an app that needs the internet to save a record does not work for them. Prima is **offline-first** for that reason.

## What Prima does today

**Registration**

- PHC-relevant fields: name, date of birth (age auto-calculated), gender, phone, village, LGA, state, next of kin, optional NHIS number, blood group, allergies.
- Women over 12 get Gravida, Para and Pregnant fields. Children under 5 get an immunization checklist. Anyone under 18 can be linked to a guardian.
- A "new admission" toggle records a chief complaint as the reason for first registration.
- Card numbers like `ANK-7K3F9Q` are generated on the device, so offline phones never wait for a server.
- Phone numbers are stored in international format (E.164) and shown in the familiar local style.

**Guardians and family links**

- A guardian is a person with a name, a phone and a relationship. One mother with three children is one guardian.
- A guardian can be linked to their own patient record, so a baby's profile shows the mother's record and her antenatal visits, and the mother's profile lists her children.
- Searching a phone number shows the guardian and all their children. Follow-up calls dial the guardian first.

**SMS reminders base (Day 12)**

- Consent is recorded where the phone is: on the patient for an adult's own number, on the guardian for a child. It is dated, and it resets if the phone number changes.
- Prima keeps a queue of appointment reminders that builds itself: when a visit has a follow-up date, or a child's next vaccine dose is due, a reminder is queued for the right person.
- Reminders cancel themselves when a visit is edited or deleted, consent is withdrawn, or a patient is merged or removed, and come back on Undo.
- Messages are generic (the date of the visit, never a diagnosis) and are shown exactly as they will be sent.
- The dashboard shows how many reminders are queued and how many patients can be reached by SMS. Nothing is sent yet.

**Duplicate protection**

- A live warning at registration (same name, date of birth, village) that works offline.
- A similar-name check at registration, using the Python service when one is configured and the device otherwise.
- **Duplicate merge tool (Pro):** scans the register on the device, shows why each pair matched, and merges them safely (visits and vaccines move, doses are not doubled, allergies are combined, guardian links move, undo for a few seconds).

**Visits and vaccines**

- Visits: date, complaints, blood pressure, temperature, weight, ICD-10 diagnosis (searchable in plain words), treatment, next follow-up date, with live vitals guidance flags.
- Complaints are pre-filled with "Follow-up for: <reason for first registration>".
- Later vaccine doses can be added from the profile, each recording which vaccine is due next and when.

**Edit, delete, undo, sync**

- Edit patients and visits. Delete patients, visits and vaccine records with confirmation and a timed Undo (soft delete).
- Two-way sync: changes made on one device appear on the others, and a cleared browser rebuilds itself from the cloud. Failed syncs are visible and retryable.

**Insight and reports**

- Dashboard with a month selector, charts computed on the device, a follow-up due list with one-tap calling, and a reminders queue.
- Monthly LGA summary by age group and sex, top diagnoses, vaccine doses and maternal and child services, with CSV export of the report and of the patient register.

**Plans and limits**

- Free: 1 facility, up to 200 patients, no export. A usage bar warns at 180 and registration stops at 200 with an upgrade prompt.
- Basic: unlimited patients, CSV export, LGA report. Pro: adds the follow-up list, the reminder queue, duplicate merge and FHIR/DHIS2 export.

**Python service (built, hosted later)**

- `GET /api/lga-report`, `POST /api/fuzzy-check/batch` and `POST /api/fuzzy-check`. Sign-in is checked on every call, the matching rules are identical to the app's, and 21 automated tests cover it. Every feature has an on-device fallback, so nothing needs the service to be hosted.

**Comfort and polish**

- Glove mode enlarges controls for gloved or one-handed use.
- Branded home screen, responsive layout, icons throughout, toast confirmations with Undo, visible keyboard focus.

## Build log (everything we did, in order)

### Day 1: `phc-registry` (Next.js + Prisma)

Project setup and database design. Every field was chosen for a PHC nurse. Patient IDs were UUIDs from the start, and age was never stored (date of birth is stored and age is calculated).

### Day 2: `phc-registry`, made clinically smart

Product feedback said the system had to reflect real clinical situations. Added Para, Gravida and isPregnant, an immunization record model for children under 5, human-readable card numbers, a validated API with clinical rules on the server (no pregnant men, no gravida for a 10-year-old, para cannot exceed gravida, no vaccine before birth), duplicate protection, unique NHIS numbers and search. About 30 REST Client requests tested it.

### The pivot: why a new repo called `prima`

Building the API showed that a server-first app is the wrong foundation for a rural clinic. If the network drops, a form that posts to a server fails, and a nurse with a queue of patients cannot wait. The architecture changed:

|                   | `phc-registry` (Days 1-2)   | `prima` (Day 3 onward)                         |
| ----------------- | --------------------------- | ---------------------------------------------- |
| App               | Next.js, server-rendered    | React + Vite single-page app (PWA)             |
| Data on the phone | None                        | **IndexedDB (Dexie) is the source of truth**   |
| Database          | Prisma + PostgreSQL         | Supabase Postgres, as a background copy        |
| Saving a patient  | HTTP request, fails offline | Local write, instant, queued for sync          |
| Extra services    | None                        | FastAPI (Python), built now and deployed later |

A new repository was the cleaner choice: the architectures are fundamentally different, `phc-registry` stays as an honest record of the learning (kept as a reference), and a clean repo is easier to read and review. Carried over: the schema design, validation rules, age calculation, the duplicate rule and the card-number idea. Left behind: Next.js API routes and the Prisma client.

### Day 3: the offline engine

Vite + React + TypeScript + Tailwind with a colour system chosen for outdoor readability. Supabase tables with explicit grants and RLS. A Dexie database with a unique card number index and a compound `[name+dob+villageKey]` index. `usePatients()` with `useLiveQuery()` and `Map` caches. A registration form with React Hook Form + Zod. Sync engine v1. Python from zero: Python 3.13, a virtual environment, FastAPI, rapidfuzz and a first `/api/fuzzy-check` endpoint.

### Day 4: a real product shell

Feedback: the app opened straight into a form and only worked well on a phone. Added a routed app shell, a branded home screen, a patient profile, a responsive two-column form and reusable components.

### Day 5: visits

A `Visit` record synced through the same queue, a visit form with BP as two integers, an ICD-10 picker (about 45 common conditions plus free text), live vitals flags, the "Follow-up for:" prefill from a LinkedIn review, visit history, icons and toasts. Fixed a stuck "1 need attention" sync badge and a dialog that rendered behind the page (portal).

### Day 6: edit, delete and two-way sync

Edit forms, soft delete with Undo, sync v2 with a server-maintained `synced_at` clock and a pull of changes since the last sync, later vaccine doses, and E.164 phone numbers with a one-time migration.

### Day 7: insight

A Recharts dashboard computed on the device, a follow-up due list built from indexed Dexie range queries and gated to Pro, a plans page, and glove mode in response to feedback that nurses work one-handed in gloves.

### Day 8: reports, export and plan limits

A monthly LGA summary using each patient's age on the visit date, CSV export that is safe for Excel (UTF-8, quoting, formula-injection guard), plan gating for the report, export and the 200-patient limit, a developer-only demo data tool, and a costs and hosting plan. Prices were raised to Basic ₦2,500 and Pro ₦5,000 from a single constant.

### Day 9: duplicate merge

A scan that sorts patients into groups before comparing, a typo-tolerant name score that also catches swapped names, visible reasons for each match, hard rules that never match different genders, blood groups or NHIS numbers, and a merge that is one all-or-nothing operation with a short Undo.

### Day 10: the Python service

Split into small files (settings, models, matching rules, report logic, Supabase loading, API routes). The batch duplicate finder and the LGA report mirror the app's TypeScript rules exactly. The server reads Supabase with a secret key that never reaches the browser, pages through large tables, and converts timestamps to Lagos time. Sign-in is verified on every request. 21 automated tests run with no network. The registration similar-name check falls back to the device. A `render.yaml` and a deploy checklist are ready for the day money allows hosting.

### Day 11: guardians and family links

A `guardians` table (cloud and device) and a `guardianId` on every patient. A reusable guardian picker that searches before creating, so siblings share one guardian. A Family section on every profile with the mother's antenatal visit count, a children list, phone search that shows the guardian and children, follow-up calls to the guardian, merge support, and sync order that sends a guardian before the child that needs it.

### Day 12: SMS reminders base (in progress)

- **Consent where the phone is.** Adults consent for their own number, guardians for theirs. Consent is dated, can be withdrawn, and resets when the phone changes, because the person agreed to a specific number.
- **A reminder queue that builds itself.** One background process looks at the data that matters (the latest visit's follow-up date, a child's next vaccine dose, who is reachable) and keeps the queue in line with it. Because it is a reconciliation, every edit, deletion, undo, merge and sync from another device is handled in one place.
- **Deterministic reminder IDs** built from what the reminder is about and the date, so two phones that create the same reminder create the same record, and a rescheduled appointment is a new reminder.
- **The cloud treats "sent" as final.** A database rule stops an offline device from turning a sent reminder back into pending, which would cause a double text.
- **Generic messages** that give a date and never a diagnosis, shown exactly as they will be sent. The next of kin is never texted, because they have not consented.
- **Dashboard** tiles for queued reminders and patients reachable by SMS, and a Reminders tab with the queue (Pro). No SMS is sent yet.

## Feedback queue

| Feedback                                                                                             | Decision                                                                                                                                                         | Status                                                                             |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Guardian link (guardians table, phone search shows guardian and children, link mother's ANC to baby) | Added as Day 11, before sign-in and row level security                                                                                                           | Done                                                                               |
| SMS base (consent, reminders table, auto-create on visit, dashboard count, no sending)               | Added as Day 12; consent on the recipient; reminders go to the guardian's phone; `next_visit_date` on the patient skipped because it duplicates the latest visit | In progress                                                                        |
| Offline IDs like `ANK-{device}-{counter}` with a mapping table                                       | Not added                                                                                                                                                        | Device UUIDs and random card numbers already solve it without ever rewriting an ID |

## Decisions and why

| Decision                                                                    | Reason                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| IndexedDB first, server second                                              | The UI must never wait for the network                                                  |
| UUIDs and card numbers generated on the device                              | Offline phones cannot ask a server for the next number, and IDs never change after sync |
| Store date of birth, not age; dates as `YYYY-MM-DD` strings                 | No stale ages, no timezone bugs                                                         |
| Soft delete                                                                 | Deletes must sync, be undoable, and leave an audit trail                                |
| Pull cursor uses a server clock, not the phone's                            | Phone clocks are often wrong                                                            |
| Dashboard, reports and duplicate scanning computed on the device            | Instant, works offline, no server cost                                                  |
| Hard exclusions in duplicate matching (gender, blood group, NHIS)           | Better to miss a duplicate than to merge two different people                           |
| Every Python feature gets an on-device fallback                             | The app must never show an error because a server is not paid for yet                   |
| A guardian is its own record, optionally linked to a patient                | A caregiver is not always a patient, and siblings must share one guardian               |
| SMS consent lives on whoever owns the phone                                 | The person who receives the text is the person who consents                             |
| Consent resets when the phone number changes                                | The person agreed to a specific number                                                  |
| The reminder queue is reconciled from source data, not written at each save | One place handles edits, deletes, undo, merges and sync, so nothing is missed           |
| Reminder IDs are built from the reminder's content                          | Two devices cannot create duplicates, and a new date is a new reminder                  |
| "Sent" cannot be reverted in the cloud                                      | An offline device must never cause a second text                                        |
| Messages contain a date, never health details                               | Phones are shared and messages are read by others                                       |
| Payments verified by a Supabase Edge Function, not Python                   | No extra hosting needed                                                                 |

## Costs and hosting: launch lean

| Item           | Pilot (fake data)                               | Real patient data                   | When revenue covers it             |
| -------------- | ----------------------------------------------- | ----------------------------------- | ---------------------------------- |
| Database       | Supabase Free                                   | Supabase Pro (about $25/month)      | Same                               |
| Frontend       | Cloudflare Pages (free, commercial use allowed) | Same                                | Same                               |
| Python service | Built and tested locally, not hosted            | Not needed yet                      | Hosted when about 4 facilities pay |
| SMS sending    | Not built yet; the queue is ready               | Needs a provider account and credit | When facilities pay                |
| Domain         | Free `pages.dev` address                        | `.com.ng` (about ₦6,250/year)       | Optional `.ng`                     |

The app is offline-first, so a paused or unreachable server delays syncing but never stops a nurse from working. A scheduled keep-alive request will stop the free Supabase project pausing, and a Backup and Restore feature protects the data because the free tier has no automatic backups.

## Plans

| Plan  | Monthly | Yearly (2 months free) | Includes                                                                                                 |
| ----- | ------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Free  | ₦0      | ₦0                     | 1 facility, up to 200 patients, no export                                                                |
| Basic | ₦2,500  | ₦25,000                | Unlimited patients, CSV export, LGA report, PWA, 3 staff, offline sync                                   |
| Pro   | ₦5,000  | ₦50,000                | Basic + follow-up due list, SMS reminder queue (sending coming soon), duplicate merge, FHIR/DHIS2 export |

Pilot offer: the first 5 PHCs get Pro free for 3 months in exchange for feedback and a testimonial.

## Architecture

```
┌─────────────── Nurse's device ───────────────┐
│  React UI ──reads──▶ Dexie (IndexedDB)       │
│      │                    ▲   ▲              │
│      └───writes───────────┘   │              │
│        reminder reconciler     │              │
│                        syncQueue  pull        │
└───────────────────────────┼───────┼──────────┘
                    push    │       │ changes since last sync
                            ▼       │
                    Supabase (Postgres)
                            ▲
                            │ secret key, server side only
                   Python service (FastAPI)
        built now, hosted later, with on-device fallbacks
```

## Standards approach

Nigeria is moving toward FHIR and DHIS2: the National Digital Health Architecture, a Nigeria Core FHIR Implementation Guide (still under development), an immunization FHIR guide from NPHCDA, and DHIS2 as the national reporting platform. Prima aligns in layers rather than claiming compliance: FHIR R4 export and validation (guardians map to RelatedPerson), DHIS2-compatible aggregate reports, ICD-10 diagnoses, ISO 8601 dates, UUID identifiers, E.164 phone numbers, WCAG 2.1 AA accessibility targets, and Nigeria Data Protection Act principles.

## Roadmap

| Phase               | Day  | Focus                                                                                        | Status      |
| ------------------- | ---- | -------------------------------------------------------------------------------------------- | ----------- |
| Foundation          | 1-3  | Reference build, pivot, offline engine                                                       | Done        |
| Product             | 4-6  | App shell, visits, edit/delete, two-way sync                                                 | Done        |
| Insight and revenue | 7-8  | Dashboard, follow-ups, LGA report, export, plan limits                                       | Done        |
| Data quality        | 9-10 | Duplicate merge tool, Python service                                                         | Done        |
| Families            | 11   | Guardians and family links                                                                   | Done        |
|                     | 12   | SMS reminders base (consent, reminder queue, dashboard count)                                | In progress |
| Trust               | 13   | Supabase Auth, facility setup, row level security, staff accounts                            | Planned     |
|                     | 14   | Passcode lock, roles, audit log, consent screen, privacy notice                              | Planned     |
|                     | 15   | Server-side plan limits, calm degraded mode, scale hardening, backup and restore, keep-alive | Planned     |
| Phone-ready         | 16   | PWA, install on Android, real-device test including gloves                                   | Planned     |
| Standards and money | 17   | FHIR and DHIS2 export, larger ICD-10 list                                                    | Planned     |
|                     | 18   | Chief-complaint term check, print card with QR, sticky save bar, vitals steppers             | Planned     |
|                     | 19   | Paystack, Edge Function payment check, subscriptions, annual plans                           | Planned     |
| Launch              | 20   | Polish, accessibility, onboarding, demo mode, NDPA and clinical-safety gate                  | Planned     |
|                     | 21   | Deploy, domain, privacy policy and terms, PHC officer guide                                  | Planned     |
|                     | 22   | Pilot launch kit, go live with 2 to 3 PHCs                                                   | Planned     |
| Discussions         | 23   | Cost and lean-launch review                                                                  | Planned     |
|                     | 24   | Scaling to 500 users, Enugu and Owerri playbook, economics                                   | Planned     |
|                     | 25   | Final Nigeria Data Protection Act check-in, clinical review wrap-up                          | Planned     |

After Day 25 the work is driven by feedback from real PHCs and reviewers. Sending SMS is a later feature that needs a provider account, credit, a stop-message handler and a check of the current Nigerian rules for sender IDs and do-not-disturb numbers.

## Run locally

Needs Node 20+, Python 3.13 and a Supabase project. Run `supabase/schema.sql` (plus the Day 5, 6, 9, 11 and 12 SQL) in the Supabase SQL editor first.

```bash
npm install
cp .env.example .env.local     # fill in your values; leave VITE_PYTHON_API_URL empty to use on-device matching
npm run dev                    # http://localhost:5173

cd python-service
py -3.13 -m venv venv
source venv/Scripts/activate   # Git Bash on Windows
python -m pip install -r requirements-dev.txt
cp .env.example .env           # fill in your Supabase values (never commit this file)
python -m pytest -q            # automated tests, no network needed
python -m uvicorn main:app --reload      # http://127.0.0.1:8000/docs
```

## Security and clinical notes

- The current Supabase policies are temporary and open, for fake test data only. Day 13 replaces them with authentication and per-facility row level security. Do not enter real patient data before then.
- Guardians' and patients' phone numbers and SMS consent are personal data. The consent screen and privacy notice (Day 14) must cover them, and the audit log must record consent changes.
- A reminder never goes to the next of kin and never contains a diagnosis. The stop-message line in the draft text is a placeholder: a working stop handler must exist before any SMS is sent.
- The Python service holds Supabase's secret key. It must live only in the server's settings, never in the app, and must be rotated if it is ever exposed. Do not host it before the facility-membership check exists.
- Plan checks in the app are presentation only. A paid plan is verified server-side from Day 19.
- Deletes and merges are soft. Permanent erasure on request needs a process, planned with the audit log on Day 14.
- Conflicts between two devices are resolved by the most recent edit time, which depends on device clocks.
- Duplicate matching is a suggestion, and a nurse confirms every merge. Thresholds are starting points to tune with real PHC data.
- Immunization intervals, vitals thresholds, follow-up rules, the ICD-10 list and the report groupings are simplified starting points. Confirm them with a health worker against national guidance before real use.
- Before real PHC data, complete the Nigeria Data Protection Act and NDPC check planned for Day 20.

## Facts for the LinkedIn post

- Problem: paper registers lose and duplicate patients; the LGA report is counted by hand; follow-ups depend on a nurse's memory; a baby's card and the mother's antenatal card are never connected; missed appointments are never chased.
- Origin: a public health graduate learning software engineering, building for PHCs.
- Pivot: started server-first, then rebuilt offline-first after seeing that network drops break clinic workflow.
- Numbers: 2 repos (1 reference, 1 product); about 30 API tests on Day 2; 21 automated Python tests on Day 10; about 45 ICD-10 conditions searchable in plain language; 20 vaccine doses in the schedule; a 25-day roadmap.
- Day 12 headline: Prima now keeps a reminder queue that builds itself from visits and vaccine schedules, only for people who consented, to the right phone (the mother's for a baby), with messages that never contain a diagnosis. No SMS is sent yet, so there is no cost, and the cloud refuses to let an offline phone cause a double text.
- Feedback loop: reviewer ideas were evaluated before building. One was already solved by the design, two became their own days because they change the data model.
- Learned: Python from zero, FastAPI dependencies and testing, supabase-py, Dexie hooks, transactions and live queries, offline-first design, reconciliation instead of scattered writes, deterministic IDs for sync, Postgres triggers, consent-aware design.
- Feedback loops so far: product feedback produced Para/Gravida and immunizations; a LinkedIn review produced the chief complaint field and the follow-up prefill; a commenter pushed for global standards; a UI critique produced the Day 4 redesign; a clinic-practice note produced glove mode; clinic-workflow feedback produced guardian links and SMS reminders.
