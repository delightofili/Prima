# Prima

**An offline-first patient register and visit record for Primary Health Centers (PHCs) in Nigeria.**

A nurse registers patients, records visits, tracks vaccines, links children to their guardians, sees who is due for follow-up, queues appointment reminders, cleans up duplicate records and produces the monthly LGA summary, on an Android phone, tablet or laptop, with or without network. Everything is saved on the device first and syncs both ways with the cloud in the background. Each facility's records are private to its own staff.

> Status: built in public. Days 1-12 complete, Day 13 (accounts, facilities, row level security) in progress. The roadmap runs to Day 25, then continues with feedback from real PHCs.

---

## The problem

Paper registers at PHCs lose patients, create duplicates (the same woman registered three times under different spellings), make the monthly LGA report a slow manual count, and give nobody a way to see who is due for a follow-up or the next vaccine. Children are usually registered under their mother's phone, so the card of a baby and the antenatal card of the mother are never connected. Many PHCs also have unreliable network, so an app that needs the internet to save a record does not work for them. Prima is **offline-first** for that reason.

## What Prima does today

**Accounts, facilities and staff (Day 13)**

- Sign in with email and password. A facility admin creates the facility and invites staff with a one-time code (shared by WhatsApp if wanted). Roles: admin and staff.
- Every facility's data is separated by database rules (row level security), so one facility can never read another's records, even with the app's public key.
- Prima opens and works with no internet once someone has signed in on the phone. The cloud session is only needed to sync, and a clear banner asks for a sign-in again if it lapses.
- Removing a staff member locks their phone out the next time it connects. A phone that holds another facility's data must be erased before a new facility signs in.

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

**SMS reminders base**

- Consent is recorded where the phone is (the adult patient, or the guardian for a child), dated, and resets if the phone number changes.
- A reminder queue builds itself from follow-up dates and due vaccine doses, cancels itself when things change, and never contains a diagnosis. Nothing is sent yet.

**Duplicate protection**

- A live warning at registration (same name, date of birth, village) that works offline.
- A similar-name check at registration, using the Python service when one is configured and the device otherwise.
- **Duplicate merge tool (Pro):** scans the register on the device, shows why each pair matched, and merges them safely.

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

- Free: 1 facility, 1 account, up to 200 patients, no export. Basic: unlimited patients, CSV export, LGA report, 3 staff accounts. Pro: adds the follow-up list, the reminder queue, duplicate merge, FHIR/DHIS2 export and more staff accounts.

**Python service (built, hosted later)**

- `GET /api/lga-report`, `POST /api/fuzzy-check/batch` and `POST /api/fuzzy-check`. Every call checks the caller's sign-in, and the two facility calls also check that the caller belongs to that facility. 23 automated tests cover it. Every feature has an on-device fallback, so nothing needs the service to be hosted.

**Comfort and polish**

- Glove mode, branded home screen, responsive layout, icons, toast confirmations with Undo, visible keyboard focus.

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

Split into small files (settings, models, matching rules, report logic, Supabase loading, API routes). The batch duplicate finder and the LGA report mirror the app's TypeScript rules exactly. The server reads Supabase with a secret key that never reaches the browser, and every request is checked for a valid sign-in. 21 automated tests run with no network. The registration similar-name check falls back to the device. A `render.yaml` and a deploy checklist are ready for the day money allows hosting.

### Day 11: guardians and family links

A `guardians` table and a `guardianId` on every patient. A reusable guardian picker that searches before creating, so siblings share one guardian. A Family section on every profile with the mother's antenatal visit count, a children list, phone search that shows the guardian and children, follow-up calls to the guardian, merge support, and sync order that sends a guardian before the child that needs it.

### Day 12: SMS reminders base

Consent stored where the phone is, dated, and reset when the number changes. A reminder queue that reconciles itself from the data (so edits, deletes, undo, merges and sync are all handled in one place), deterministic reminder IDs so two phones cannot create duplicates, a database rule that makes "sent" final, generic messages that never contain a diagnosis, and dashboard counts. Nothing is sent yet.

### Day 13: accounts, facilities and row level security (in progress)

- **Real accounts.** Email and password through Supabase Auth. A new user creates a facility (becoming its admin) or joins one with an invite code. Facility details now come from the database instead of settings in the app.
- **Row level security.** The temporary open policies were removed and the anonymous role lost all access. Every clinical table, including guardians and reminders, is readable and writable only by members of the same facility. Deleting is not allowed at all (records are soft deleted).
- **Team management through database functions**, not direct table access: create a facility, join, invite, revoke an invite, list members, remove a member, edit the facility. Each function checks who is calling and whether they are an admin. A staff cap by plan is enforced in the database (Free 1, Basic 3, Pro 10 as a placeholder).
- **Offline-first sign-in.** The app unlocks from a record stored on the phone, never from the network. The cloud session is only needed to sync; if it lapses, a banner asks for a fresh sign-in while everything keeps working.
- **Safe on shared phones.** Signing in to a different facility on a phone that holds another facility's data requires erasing it first. A removed staff member sees an "access ended" screen the next time the phone connects.
- **The Python service now checks facility membership**, not just sign-in, so a signed-in user cannot ask for another facility's report.
- **Email without a mail server.** Supabase's built-in email is only for testing, so confirmation emails are switched off for now and staff join by invite code. Password reset by email arrives when custom mail is set up at deploy time.

## Feedback queue

| Feedback                                                                                             | Decision                                                                                                                                                         | Status                                                                             |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Guardian link (guardians table, phone search shows guardian and children, link mother's ANC to baby) | Added as Day 11, before sign-in and row level security                                                                                                           | Done                                                                               |
| SMS base (consent, reminders table, auto-create on visit, dashboard count, no sending)               | Added as Day 12; consent on the recipient; reminders go to the guardian's phone; `next_visit_date` on the patient skipped because it duplicates the latest visit | Done                                                                               |
| Offline IDs like `ANK-{device}-{counter}` with a mapping table                                       | Not added                                                                                                                                                        | Device UUIDs and random card numbers already solve it without ever rewriting an ID |

## Decisions and why

| Decision                                                                        | Reason                                                                                  |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| IndexedDB first, server second                                                  | The UI must never wait for the network                                                  |
| UUIDs and card numbers generated on the device                                  | Offline phones cannot ask a server for the next number, and IDs never change after sync |
| Store date of birth, not age; dates as `YYYY-MM-DD` strings                     | No stale ages, no timezone bugs                                                         |
| Soft delete                                                                     | Deletes must sync, be undoable, and leave an audit trail                                |
| Pull cursor uses a server clock, not the phone's                                | Phone clocks are often wrong                                                            |
| Dashboard, reports and duplicate scanning computed on the device                | Instant, works offline, no server cost                                                  |
| Every Python feature gets an on-device fallback                                 | The app must never show an error because a server is not paid for yet                   |
| SMS consent lives on whoever owns the phone, and resets when the number changes | The person who receives the text is the person who consents, to that number             |
| The reminder queue is reconciled from source data                               | One place handles edits, deletes, undo, merges and sync                                 |
| "Sent" cannot be reverted in the cloud                                          | An offline device must never cause a second text                                        |
| The app unlocks from a record on the phone, not from the network                | A clinic with no signal must still open the app; the cloud session is only for syncing  |
| Facility access is decided by database rules, not by the app                    | The app's public key is visible to anyone, so only the database can be trusted          |
| New accounts get no access until they create or join a facility                 | Signing up must never expose anyone's records                                           |
| Team changes go through checked database functions, with no direct table access | Each action verifies the caller is an admin of the facility                             |
| Invite codes are single-use and expire after 7 days                             | A leaked code has a short, narrow life                                                  |
| A removed staff member is locked out, not auto-erased                           | A bug must never wipe a facility's data; the user chooses to erase                      |
| One facility per phone; a different facility needs an erase first               | Records from two facilities must never mix on one device                                |
| Confirmation email off, staff join by invite code                               | The free built-in email only works for the project's own team                           |
| Payments verified by a Supabase Edge Function, not Python                       | No extra hosting needed                                                                 |

## Costs and hosting: launch lean

| Item                                     | Pilot (fake data)                               | Real patient data                   | When revenue covers it             |
| ---------------------------------------- | ----------------------------------------------- | ----------------------------------- | ---------------------------------- |
| Database and sign-in                     | Supabase Free                                   | Supabase Pro (about $25/month)      | Same                               |
| Frontend                                 | Cloudflare Pages (free, commercial use allowed) | Same                                | Same                               |
| Python service                           | Built and tested locally, not hosted            | Not needed yet                      | Hosted when about 4 facilities pay |
| SMS sending                              | Not built yet; the queue is ready               | Needs a provider account and credit | When facilities pay                |
| Email (password reset, invites by email) | Off; invite codes instead                       | Custom mail provider, free tier     | At deploy time                     |
| Domain                                   | Free `pages.dev` address                        | `.com.ng` (about ₦6,250/year)       | Optional `.ng`                     |

The app is offline-first, so a paused or unreachable server delays syncing but never stops a nurse from working. A scheduled keep-alive request will stop the free Supabase project pausing, and a Backup and Restore feature protects the data because the free tier has no automatic backups.

## Plans

| Plan  | Monthly | Yearly (2 months free) | Includes                                                                                                                      |
| ----- | ------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Free  | ₦0      | ₦0                     | 1 facility, 1 account, up to 200 patients, no export                                                                          |
| Basic | ₦2,500  | ₦25,000                | Unlimited patients, CSV export, LGA report, PWA, 3 staff accounts, offline sync                                               |
| Pro   | ₦5,000  | ₦50,000                | Basic + follow-up due list, SMS reminder queue (sending coming soon), duplicate merge, FHIR/DHIS2 export, more staff accounts |

Pilot offer: the first 5 PHCs get Pro free for 3 months in exchange for feedback and a testimonial. A facility's plan is set in the database, which is also how a pilot is granted.

## Architecture

```
┌─────────────── Nurse's device ───────────────┐
│  React UI ──reads──▶ Dexie (IndexedDB)       │
│      │                    ▲   ▲              │
│      └───writes───────────┘   │              │
│   local sign-in record         │ pull         │
│   reminder reconciler     syncQueue           │
└───────────────────────────┼───────┼──────────┘
        push (signed in)    │       │ changes since last sync
                            ▼       │
                    Supabase (Postgres)
              row level security: members only
                            ▲
                            │ secret key, server side only
                   Python service (FastAPI)
        built now, hosted later, with on-device fallbacks
```

## Standards approach

Nigeria is moving toward FHIR and DHIS2: the National Digital Health Architecture, a Nigeria Core FHIR Implementation Guide (still under development), an immunization FHIR guide from NPHCDA, and DHIS2 as the national reporting platform. Prima aligns in layers rather than claiming compliance: FHIR R4 export and validation (guardians map to RelatedPerson), DHIS2-compatible aggregate reports, ICD-10 diagnoses, ISO 8601 dates, UUID identifiers, E.164 phone numbers, WCAG 2.1 AA accessibility targets, and Nigeria Data Protection Act principles.

## Run locally

Needs Node 20+, Python 3.13 and a Supabase project. Run `supabase/schema.sql` (plus the Day 5, 6, 9, 11, 12 and 13 SQL) in the Supabase SQL editor first. In Supabase, open Authentication and turn off "Confirm email" (until custom mail is set up) and set the minimum password length to 8.

```bash
npm install
cp .env.example .env.local     # only the Supabase URL and publishable key are needed; leave VITE_PYTHON_API_URL empty to use on-device matching
npm run dev                    # http://localhost:5173  (first run: Create account, then create a facility)

cd python-service
py -3.13 -m venv venv
source venv/Scripts/activate   # Git Bash on Windows
python -m pip install -r requirements-dev.txt
cp .env.example .env           # fill in your Supabase values (never commit this file)
python -m pytest -q            # automated tests, no network needed
python -m uvicorn main:app --reload      # http://127.0.0.1:8000/docs
```

## Security and clinical notes

- Row level security now separates facilities. Anonymous access to patient data is removed, and the app's public key cannot read anything without a signed-in member of the facility.
- A phone that has been signed in keeps the facility's records on the device, readable by anyone who has the unlocked phone and by browser developer tools. The passcode lock (Day 14) and an assessment of on-device encryption address this. Do not use real patient data before then.
- A removed staff member's phone keeps its local copy until it next connects. The app then locks and offers to erase it.
- Password reset by email does not work until custom mail is configured. Until then a locked-out staff member is removed and re-invited by the admin, and a locked-out admin needs help from the project owner.
- Guardians' and patients' phone numbers and SMS consent are personal data. The consent screen and privacy notice (Day 14) must cover them, and the audit log must record consent and membership changes.
- A reminder never goes to the next of kin and never contains a diagnosis. The stop-message line in the draft text is a placeholder: a working stop handler must exist before any SMS is sent.
- The Python service holds Supabase's secret key. It must live only in the server's settings, never in the app, and must be rotated if it is ever exposed.
- A facility's plan is stored in the database but the app's plan checks still use the testing switch until Day 15.
- Deletes and merges are soft. Permanent erasure on request needs a process, planned with the audit log on Day 14.
- Conflicts between two devices are resolved by the most recent edit time, which depends on device clocks.
- Immunization intervals, vitals thresholds, follow-up rules, the ICD-10 list and the report groupings are simplified starting points. Confirm them with a health worker against national guidance before real use.
- Before real PHC data, complete the Nigeria Data Protection Act and NDPC check planned for Day 20.
