# Prima

**An offline-first patient register and visit record for Primary Health Centers (PHCs) in Nigeria.**

A nurse registers patients, records visits, tracks vaccines, links children to their guardians, sees who is due for follow-up, queues appointment reminders, cleans up duplicate records and produces the monthly LGA summary, on an Android phone, tablet or laptop, with or without network. Everything is saved on the device first and syncs both ways with the cloud in the background. Each facility's records are private to its own staff, and every sensitive action is logged.

> Status: built in public. Days 1-16 complete, Day 17 (FHIR and DHIS2 export, bigger ICD-10 list) in progress. The roadmap runs to Day 25, then continues with feedback from real PHCs.

---

## The problem

Paper registers at PHCs lose patients, create duplicates (the same woman registered three times under different spellings), make the monthly LGA report a slow manual count, and give nobody a way to see who is due for a follow-up or the next vaccine. Children are usually registered under their mother's phone, so the card of a baby and the antenatal card of the mother are never connected. Many PHCs also have unreliable network, so an app that needs the internet to save a record does not work for them. Prima is **offline-first** for that reason.

## What Prima does today

**Standards and a bigger diagnosis list (Day 17)**

- Pro: a standard health-record file (FHIR R4). Patients, visits, diagnoses (ICD-10), vital signs, vaccines (with international vaccine codes), allergies and pregnancy details. A child's parent or guardian is exported as a related person, and a mother who is also a patient is linked to that role. Deleted, merged and erased patients are never included. Choose one Bundle file or one record per line.
- Pro: a monthly DHIS2 data file from the same figures as the LGA report. A mapping step (which DHIS2 data element each Prima figure belongs to) is filled in once from a template, checked for valid codes, and kept on the phone. Prima creates the file; a person imports it. Nothing is sent automatically.
- HIV, STI, mental health and pregnancy-loss diagnoses are left out of the FHIR file by default (the visit itself is still exported, without diagnosis, complaint and treatment). The admin can include them for a specific, agreed purpose. Both exports are written to the audit log.
- The diagnosis picker now covers about 330 common primary-care conditions in 20 groups, understands plain words ("sugar", "piles", "miscarriage"), accepts codes typed with or without the dot, and offers the conditions this facility records most before anything is typed.
- Monthly service lines (antenatal, postnatal, child welfare, family planning) now count by code prefix, so the finer codes in the bigger list are counted. The app and the Python service use the same rule.

**Installable, offline-first app (Day 16)**

- Prima is a progressive web app: it installs on an Android home screen from Chrome, opens without the browser bar, has a teal-cross icon and long-press shortcuts for registering and finding a patient.
- The app shell (all of Prima's own code) is stored on the phone, so Prima opens from the home screen with no signal at all, straight to the PIN screen. Patient data lives in the phone's database, never in the offline file cache, and calls to the cloud are never cached.
- Updates are announced, not forced: a small prompt above the bottom tabs says a new version is ready, "Later" hides it, "Update now" reloads. Nobody loses a half-saved form to a surprise reload.
- An install card on the Account page, with plain steps when the browser does not offer the install button.
- A Phone check page (Account, then Phone check) that reports the phone's capabilities, measures tapping accuracy at different target sizes with and without gloves, times the unlock step and local search, and produces a report to send back. A written device test sheet lives in `docs/DEVICE_TEST.md`.

**Reliability, limits and backups (Day 15)**

- A facility's plan is read from its record in the database, and the database itself enforces the Free plan's 200-patient cap and each plan's staff seats. A phone that is out of date can still register a patient offline; the cloud then says no politely and the patient waits safely on the phone until the plan changes.
- A calm degraded mode: when the cloud is paused, unreachable or the plan limit is hit, one short, non-alarming banner explains that everything is saved on the phone and will upload by itself. Raw error text is translated into plain language.
- Sync that holds up with hundreds of facilities: uploads go in batches of 100 in dependency order (guardians, patients, then visits, vaccines and reminders), a one-call "has anything changed?" check skips idle polls, polling happens only while the app is visible (every 3 minutes, with random jitter), and failed uploads back off instead of hammering the server.
- Encrypted backup and restore (admin only). A backup is a password-protected file the admin can save or share; restore adds missing records and keeps whichever copy is newer, never deletes anything, refuses a backup from another facility, and never brings back a patient who was erased.
- Storage protection: Prima asks the browser to keep its data from being cleared automatically, and shows how much space is used.
- A free keep-alive: a scheduled GitHub job calls a tiny database function every 3 days so a free Supabase project does not pause from inactivity.

**Privacy and security (Day 14)**

- A 6-digit PIN lock that works offline. The app locks after a period of inactivity, when it has been in the background, or on demand. Wrong PINs cause growing delays and eventually require the account password.
- Two roles. Admins manage the team, export data, delete or merge patients, read the audit log and handle data requests. Staff do all the clinical work. Deleting or merging a patient is also enforced by the database.
- An audit log of who did what and when (registering, editing, deleting, consent changes, exports, team changes). It records field names and card numbers, never diagnoses or names, and it cannot be edited or deleted through the app.
- A plain-language privacy notice page, a record of when the notice was explained to each patient, and a staff confidentiality agreement shown on first use.
- Data requests: an admin logs a request to see, correct or remove a record, exports one patient's record, or permanently erases a patient. Erasure wipes the identifying details everywhere, including on other phones.

**Accounts, facilities and staff**

- Sign in with email and password. A facility admin creates the facility and invites staff with a one-time code (shared by WhatsApp if wanted).
- Every facility's data is separated by database rules (row level security), so one facility can never read another's records, even with the app's public key.
- Prima opens and works with no internet once someone has signed in on the phone. The cloud session is only needed to sync.

**Registration**

- PHC-relevant fields: name, date of birth (age auto-calculated), gender, phone, village, LGA, state, next of kin, optional NHIS number, blood group, allergies.
- Women over 12 get Gravida, Para and Pregnant fields. Children under 5 get an immunization checklist. Anyone under 18 can be linked to a guardian.
- A "new admission" toggle records a chief complaint as the reason for first registration. A privacy notice checkbox records that the patient was told how their information is used.
- Card numbers like `ANK-7K3F9Q` are generated on the device, so offline phones never wait for a server.
- Phone numbers are stored in international format (E.164) and shown in the familiar local style.

**Guardians and family links**

- A guardian is a person with a name, a phone and a relationship. One mother with three children is one guardian.
- A guardian can be linked to their own patient record, so a baby's profile shows the mother's record and her antenatal visits, and the mother's profile lists her children.
- Searching a phone number shows the guardian and all their children. Follow-up calls dial the guardian first.

**SMS reminders base**

- Consent is recorded where the phone is, dated, and resets if the phone number changes. A reminder queue builds itself from follow-up dates and due vaccine doses. Nothing is sent yet.

**Duplicate protection**

- A live warning at registration and a similar-name check, with an on-device fallback for the Python service.
- **Duplicate merge tool (Pro, admin):** scans the register on the device, shows why each pair matched, and merges them safely.

**Visits and vaccines**

- Visits: date, complaints, blood pressure, temperature, weight, ICD-10 diagnosis, treatment, next follow-up date, with live vitals guidance flags.
- Later vaccine doses can be added from the profile, each recording which vaccine is due next and when.

**Edit, delete, undo, sync**

- Edit patients and visits. Delete with confirmation and a timed Undo (soft delete).
- Two-way sync: changes made on one device appear on the others, and a cleared browser rebuilds itself from the cloud.

**Insight and reports**

- Dashboard with charts computed on the device, a follow-up due list, a reminders queue, and a monthly LGA summary with CSV export.

**Plans and limits**

- Free: 1 facility, 1 account, up to 200 patients, no export. Basic: unlimited patients, CSV export, LGA report, 3 staff accounts. Pro: adds the follow-up list, the reminder queue, duplicate merge, FHIR/DHIS2 export and more staff accounts.

**Python service (built, hosted later)**

- `GET /api/lga-report`, `POST /api/fuzzy-check/batch` and `POST /api/fuzzy-check`. Every call checks the caller's sign-in and facility membership. 28 automated tests. Every feature has an on-device fallback.

**Comfort and polish**

- Glove mode, branded home screen, responsive layout, icons, toast confirmations with Undo, visible keyboard focus.

## Build log (everything we did, in order)

### Day 1: `phc-registry` (Next.js + Prisma)

Project setup and database design. Every field was chosen for a PHC nurse. Patient IDs were UUIDs from the start, and age was never stored.

### Day 2: `phc-registry`, made clinically smart

Para, Gravida and isPregnant, an immunization record model, human-readable card numbers, a validated API with clinical rules on the server, duplicate protection and search. About 30 REST Client requests tested it.

### The pivot: why a new repo called `prima`

Building the API showed that a server-first app is the wrong foundation for a rural clinic. If the network drops, a form that posts to a server fails, and a nurse with a queue of patients cannot wait.

|                   | `phc-registry` (Days 1-2)   | `prima` (Day 3 onward)                         |
| ----------------- | --------------------------- | ---------------------------------------------- |
| App               | Next.js, server-rendered    | React + Vite single-page app (PWA)             |
| Data on the phone | None                        | **IndexedDB (Dexie) is the source of truth**   |
| Database          | Prisma + PostgreSQL         | Supabase Postgres, as a background copy        |
| Saving a patient  | HTTP request, fails offline | Local write, instant, queued for sync          |
| Extra services    | None                        | FastAPI (Python), built now and deployed later |

A new repository was the cleaner choice, and `phc-registry` stays as an honest record of the learning. Carried over: the schema design, validation rules, age calculation, the duplicate rule and the card-number idea.

### Day 3: the offline engine

Vite + React + TypeScript + Tailwind with a colour system chosen for outdoor readability. A Dexie database with a unique card number index and a compound `[name+dob+villageKey]` index. A registration form with React Hook Form + Zod. Sync engine v1. Python from zero: Python 3.13, a virtual environment, FastAPI and rapidfuzz.

### Day 4: a real product shell

A routed app shell, a branded home screen, a patient profile and a responsive two-column form, after feedback that the app opened straight into a form.

### Day 5: visits

Visit records with BP as two integers, an ICD-10 picker, live vitals flags, the "Follow-up for:" prefill from a LinkedIn review, visit history, icons and toasts. Fixed a stuck sync badge and a dialog that rendered behind the page.

### Day 6: edit, delete and two-way sync

Edit forms, soft delete with Undo, sync v2 with a server-maintained clock and a pull of changes, later vaccine doses, and E.164 phone numbers.

### Day 7: insight

A Recharts dashboard computed on the device, a follow-up due list, a plans page, and glove mode in response to feedback that nurses work one-handed in gloves.

### Day 8: reports, export and plan limits

A monthly LGA summary using each patient's age on the visit date, CSV export that is safe for Excel, plan gating, and a costs and hosting plan. Prices: Basic ₦2,500 and Pro ₦5,000.

### Day 9: duplicate merge

A scan that sorts patients into groups before comparing, a typo-tolerant name score, hard rules that never match different genders, blood groups or NHIS numbers, and a merge that is one all-or-nothing operation with a short Undo.

### Day 10: the Python service

Split into small files, mirroring the app's rules exactly, reading Supabase with a secret key that never reaches the browser, with 21 automated tests and a deploy file ready for later.

### Day 11: guardians and family links

A `guardians` table, a guardian picker that searches before creating, a Family section on every profile, phone search that shows the guardian and children, and sync order that sends a guardian before the child.

### Day 12: SMS reminders base

Consent stored where the phone is, a reminder queue that reconciles itself from the data, deterministic reminder IDs, a database rule that makes "sent" final, and generic messages that never contain a diagnosis. Nothing is sent yet.

### Day 13: accounts, facilities and row level security

Email and password sign-in, facility creation and invite codes, row level security on every table (guardians and reminders included), team management through checked database functions, an offline-first sign-in record on the phone, a shared-phone safeguard, and a facility-membership check in the Python service.

### Day 14: privacy and security

- **PIN lock.** A 6-digit PIN stored only as a salted hash on the phone, with auto-lock, a lock-now button, growing delays after wrong PINs, and a password-based reset. The app stays mounted while locked, so a half-filled form is not lost.
- **Roles with teeth.** Admin-only actions are hidden from staff and, for deleting and merging patients, refused by a database trigger.
- **Audit log.** Written by the same database hooks that already queue sync, so a change cannot happen without a record. Entries sync to an insert-only table that nobody can edit or delete, and the server stamps who really sent each one. Team changes are logged by database triggers.
- **Consent and notice.** A draft privacy notice page, a per-patient record of when the notice was explained, and a staff confidentiality agreement recorded in the audit log.
- **Data requests and erasure.** A request log, one-patient record export, and an erase function that wipes identifying details on the server and on every phone, and refuses to be undone by a stale device.

### Day 15: reliability, plan limits and backups

- **Plan limits in the database.** A trigger refuses the 201st active patient on the Free plan (a custom error code the app understands), serialised per facility so two phones cannot both slip through. Staff seats were already enforced by the join function. A `plan_usage()` function reports usage, and members still have no way to change their own plan.
- **The app follows the facility's plan.** The old browser-storage plan switch now exists only in `npm run dev`. The plan refreshes when the app is opened, when the tab returns to the foreground, and after sign-in changes, and an upgrade automatically retries blocked uploads.
- **Calm degraded mode.** A small health store counts consecutive network failures; one banner at a time explains what is happening, always saying the records are safe.
- **Sync at scale.** Composite `(facility_id, synced_at)` indexes, a `facility_pulse()` check that lets idle devices skip five queries, visible-only jittered polling, batched dependency-ordered uploads with one-by-one fallback to find a bad record, and exponential backoff.
- **Backup and restore.** AES-GCM encryption with a PBKDF2 key from the admin's password, strict validation of the file, merge-never-delete restore, facility check, erased patients stay erased, restore uses the normal sync queue so the cloud is repopulated, and a single audit line instead of thousands.
- **Keep-alive.** A `keepalive()` database function and a GitHub Actions workflow every 3 days, with an optional second ping from a monitoring service.

### Day 16: the phone

- **Installable.** A web app manifest (name, teal theme, cream background, full-bleed icon so Android can shape it, shortcuts) and a service worker that stores Prima's own files. Chrome offers installation once both exist and the page is served over HTTPS.
- **Offline shell.** Navigations fall back to the stored page, so every route opens offline. Nothing from the cloud is cached by the worker; the database in the phone is the only home for patient data.
- **Update prompt.** The worker waits until the person agrees, then takes over and reloads. The app checks for a new version when it returns to the foreground and hourly while open.
- **Phone-first CSS.** No pull-to-refresh (it would reload the app and lose a form), no double-tap zoom delay, a brand-tinted tap highlight, and a stable chunk layout so an update downloads only what changed.
- **Testing on a real phone.** USB port forwarding (the phone treats `localhost` as safe) or a private test deploy to Cloudflare Pages. A plain local-network address cannot be used: without HTTPS there is no PIN hashing, no install and no offline worker.
- **Phone check page and device test sheet**, so the first real-phone test produces numbers, not impressions.

### Day 17: standards (in progress)

- **FHIR.** A pure function turns the register into FHIR R4 resources: Organization, Patient (card and NHIS numbers as identifiers, next of kin as a contact), RelatedPerson for guardians, Encounter, Condition (ICD-10), Observation (blood pressure, temperature, weight with LOINC and UCUM codes; pregnancy, gravida and para), Immunization (CVX codes, birth doses as text), AllergyIntolerance. Each resource gets a stable id, so loading a file twice updates instead of duplicating. The output was validated against an independent FHIR R4B library, with every reference resolving inside the file.
- **DHIS2.** Monthly `dataValueSets` JSON. Prima's 23 figures are mapped by the district officer's template; only mapped, valid figures are exported, and the rest are listed. A mapped vaccine with no doses in the month is exported as a real zero.
- **ICD-10 list.** From 45 to about 330 entries. Every code was checked to exist in a WHO ICD-10 dataset, labels were compared against it for mix-ups, and the 45 original entries kept their codes and labels so saved visits do not change. The list is plain-language summaries, not the official classification, and still needs a clinician's review before real use.
- **Prefix matching for service lines**, because exact matching would have silently undercounted antenatal visits coded Z34.0 or Z34.8. Changed in both the app and the Python service, with five new tests.

## Feedback queue

| Feedback                                                         | Decision                                                                                      | Status |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| Guardian link                                                    | Day 11                                                                                        | Done   |
| SMS base (consent, reminders table, dashboard count, no sending) | Day 12                                                                                        | Done   |
| Offline IDs like `ANK-{device}-{counter}` with a mapping table   | Not added: device UUIDs and random card numbers already solve it without ever rewriting an ID | Closed |
| A read-only supervisor role for LGA officers                     | Considered for Day 14, not built; needs careful read-only handling across the app             | Open   |

## Decisions and why

| Decision                                                                          | Reason                                                                                                                                          |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| IndexedDB first, server second                                                    | The UI must never wait for the network                                                                                                          |
| UUIDs and card numbers generated on the device                                    | Offline phones cannot ask a server for the next number                                                                                          |
| Soft delete                                                                       | Deletes must sync, be undoable, and leave an audit trail                                                                                        |
| Every Python feature gets an on-device fallback                                   | The app must never show an error because a server is not paid for yet                                                                           |
| SMS consent lives on whoever owns the phone, and resets when the number changes   | The person who receives the text consents, to that number                                                                                       |
| The app unlocks from a record on the phone, not from the network                  | A clinic with no signal must still open the app                                                                                                 |
| Facility access is decided by database rules, not by the app                      | The app's public key is visible to anyone                                                                                                       |
| The PIN is a lock for casual access, not encryption                               | A 6-digit PIN can be guessed offline by someone who copies the phone's storage; phone screen lock and device encryption are the real protection |
| The app stays mounted behind the lock screen                                      | Locking must never throw away a half-filled registration                                                                                        |
| Audit entries are created by database hooks, not by each screen                   | A change cannot be made without leaving a record, and no screen can forget                                                                      |
| Audit entries hold field names and card numbers, never names or diagnoses         | The log must not become a second copy of patient data                                                                                           |
| Audit entries are insert-only and the server stamps who sent them                 | Nobody, including an admin, can quietly edit history                                                                                            |
| Admin-only: delete, merge, export, audit, requests, team                          | Bulk and destructive actions have the fewest hands on them                                                                                      |
| Deleting or merging a patient is also checked in the database                     | A hidden button is not security                                                                                                                 |
| Erasure wipes identifying details and keeps a marker, instead of deleting the row | Other phones must receive the erasure, and a stale phone must not bring the data back                                                           |
| Erasure needs the card number typed and a log entry                               | It cannot be undone, and health records may have retention rules                                                                                |
| Privacy notice and staff agreement are drafts for legal review                    | Compliance wording must come from a lawyer or the facility's data protection officer                                                            |
| One facility per phone                                                            | Records from two facilities must never mix on one device                                                                                        |
| The database enforces what only the database can: patient cap and staff seats     | Exports, reports and follow-up lists run on the device from data it already holds, so they are a convenience gate, not a security boundary      |
| An over-limit upload is parked, not deleted                                       | The patient is already registered in front of a nurse; losing the record is worse than a delayed upload                                         |
| One calm banner at a time, always saying the records are safe                     | Frightened nurses stop trusting the app; most failures here are not their fault                                                                 |
| Uploads in dependency order and in batches, with one-by-one fallback              | Hundreds of queued items must not mean hundreds of requests, and one bad record must not hide the good ones                                     |
| Idle devices ask one cheap question before pulling                                | At 1,500 devices, five queries each every few minutes is the real load                                                                          |
| Exports are files a person imports, never automatic sends                         | Patient data leaves the clinic only through a decision and a channel someone chose                                                              |
| Sensitive diagnoses are left out of FHIR by default                               | HIV, STI, mental health and pregnancy loss carry stigma and, in some cases, legal risk                                                          |
| The DHIS2 mapping is filled in once, from a template, by the district officer     | Prima cannot know a district's data element codes, and guessing them would put figures in the wrong place                                       |
| Stable ids derived from the visit, not random ones                                | Re-exporting must update the receiving system, not create duplicates                                                                            |
| Service lines count by code prefix                                                | A bigger diagnosis list must never reduce the antenatal count                                                                                   |
| Updates wait for a tap, never reload by themselves                                | A nurse mid-registration must never lose her form to a version change                                                                           |
| The offline worker caches Prima's own files and nothing else                      | Patient data belongs in the phone's database under the PIN, not in a browser cache                                                              |
| Test on a real phone over HTTPS, with the gloves staff actually wear              | Targets that pass on a desk fail in a glove, and a plain local-network address disables the security features                                   |
| Backups are always encrypted with a password                                      | A full register in a Downloads folder or a WhatsApp chat is a data breach waiting to happen                                                     |
| Restore never deletes and never resurrects erased patients                        | A restore must not be able to undo a legal erasure or destroy newer work                                                                        |
| Confirmation email off, staff join by invite code                                 | The free built-in email only works for the project's own team                                                                                   |

## Costs and hosting: launch lean

| Item                   | Pilot (fake data)                               | Real patient data                   | When revenue covers it             |
| ---------------------- | ----------------------------------------------- | ----------------------------------- | ---------------------------------- |
| Database and sign-in   | Supabase Free                                   | Supabase Pro (about $25/month)      | Same                               |
| Frontend               | Cloudflare Pages (free, commercial use allowed) | Same                                | Same                               |
| Python service         | Built and tested locally, not hosted            | Not needed yet                      | Hosted when about 4 facilities pay |
| SMS sending            | Not built yet; the queue is ready               | Needs a provider account and credit | When facilities pay                |
| Email (password reset) | Off; invite codes instead                       | Custom mail provider, free tier     | At deploy time                     |
| Domain                 | Free `pages.dev` address                        | `.com.ng` (about ₦6,250/year)       | Optional `.ng`                     |

## Plans

| Plan  | Monthly | Yearly (2 months free) | Includes                                                                                                                      |
| ----- | ------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Free  | ₦0      | ₦0                     | 1 facility, 1 account, up to 200 patients, no export                                                                          |
| Basic | ₦2,500  | ₦25,000                | Unlimited patients, CSV export, LGA report, PWA, 3 staff accounts, offline sync                                               |
| Pro   | ₦5,000  | ₦50,000                | Basic + follow-up due list, SMS reminder queue (sending coming soon), duplicate merge, FHIR/DHIS2 export, more staff accounts |

Pilot offer: the first 5 PHCs get Pro free for 3 months in exchange for feedback and a testimonial. A facility's plan is set in the database (which is also how a pilot is granted until Paystack arrives on Day 19). The app reads it from the facility record, and the database enforces the patient cap and staff seats.

## Architecture

```
┌─────────────── Nurse's device ───────────────┐
│  PIN lock ─▶ React UI ──reads──▶ Dexie       │
│                 │                  ▲   ▲      │
│                 └───writes─────────┘   │      │
│   change hooks ──▶ audit table    syncQueue   │
│   local sign-in record            pull        │
└───────────────────────────┼───────┼──────────┘
        push (signed in)    │       │ changes since last sync
                            ▼       │
                    Supabase (Postgres)
          row level security: members only
          audit log: insert-only, admin-readable
                            ▲
                            │ secret key, server side only
                   Python service (FastAPI)
        built now, hosted later, with on-device fallbacks
```

## Standards approach

Nigeria is moving toward FHIR and DHIS2: the National Digital Health Architecture, a Nigeria Core FHIR Implementation Guide (still under development), an immunization FHIR guide from NPHCDA, and DHIS2 as the national reporting platform. Prima aligns in layers rather than claiming compliance: FHIR R4 export and validation (guardians map to RelatedPerson), DHIS2-compatible aggregate reports, ICD-10 diagnoses, ISO 8601 dates, UUID identifiers, E.164 phone numbers, WCAG 2.1 AA accessibility targets, and Nigeria Data Protection Act principles.

## Roadmap

| Phase               | Day   | Focus                                                                                        | Status      |
| ------------------- | ----- | -------------------------------------------------------------------------------------------- | ----------- |
| Foundation          | 1-3   | Reference build, pivot, offline engine                                                       | Done        |
| Product             | 4-6   | App shell, visits, edit/delete, two-way sync                                                 | Done        |
| Insight and revenue | 7-8   | Dashboard, follow-ups, LGA report, export, plan limits                                       | Done        |
| Data quality        | 9-10  | Duplicate merge tool, Python service                                                         | Done        |
| Families            | 11-12 | Guardians and family links, SMS reminders base                                               | Done        |
| Trust               | 13    | Accounts, facilities, row level security, staff accounts                                     | Done        |
|                     | 14    | PIN lock, roles, audit log, consent and privacy notice, data requests                        | Done        |
|                     | 15    | Server-side plan limits, calm degraded mode, scale hardening, backup and restore, keep-alive | Done        |
| Phone-ready         | 16    | PWA, install on Android, real-device test including gloves                                   | Done        |
| Standards and money | 17    | FHIR and DHIS2 export, larger ICD-10 list                                                    | In progress |
|                     | 18    | Chief-complaint term check, print card with QR, sticky save bar, vitals steppers             | Planned     |
|                     | 19    | Paystack, Edge Function payment check, subscriptions, annual plans                           | Planned     |
| Launch              | 20    | Polish, accessibility, onboarding, demo mode, NDPA and clinical-safety gate                  | Planned     |
|                     | 21    | Deploy, domain, custom mail, privacy policy and terms, PHC officer guide                     | Planned     |
|                     | 22    | Pilot launch kit, go live with 2 to 3 PHCs                                                   | Planned     |
| Discussions         | 23    | Cost and lean-launch review                                                                  | Planned     |
|                     | 24    | Scaling to 500 users, Enugu and Owerri playbook, economics                                   | Planned     |
|                     | 25    | Final Nigeria Data Protection Act check-in, clinical review wrap-up                          | Planned     |

After Day 25 the work is driven by feedback from real PHCs and reviewers.

## Run locally

Needs Node 20+, Python 3.13 and a Supabase project. Run `supabase/schema.sql` (plus the Day 5, 6, 9, 11, 12, 13, 14 and 15 SQL) in the Supabase SQL editor first. In Supabase, open Authentication and turn off "Confirm email" (until custom mail is set up) and set the minimum password length to 8.

```bash
npm install
cp .env.example .env.local     # only the Supabase URL and publishable key are needed
npm run dev                    # http://localhost:5173  (first run: Create account, create a facility, set a PIN)

cd python-service
py -3.13 -m venv venv
source venv/Scripts/activate   # Git Bash on Windows
python -m pip install -r requirements-dev.txt
cp .env.example .env           # fill in your Supabase values (never commit this file)
python -m pytest -q
python -m uvicorn main:app --reload
```

## Testing on a real phone

A phone only allows the PIN, installing and offline use on HTTPS pages or `localhost`, so a plain `http://192.168...` address will not work. Two options: plug the phone in with USB debugging on, forward port 4173 in Chrome's `chrome://inspect` page, run `npm run build && npm run preview`, and open `http://localhost:4173` on the phone; or publish `dist` to a private Cloudflare Pages project for a real HTTPS address. The full checklist, including the glove protocol, is in `docs/DEVICE_TEST.md`. Fake data only until the Day 20 gate.

## Keep the free database awake

Free Supabase projects pause after about a week without activity. Prima calls `keepalive()` every 3 days from GitHub Actions (`.github/workflows/keepalive.yml`). In the GitHub repository open Settings, then Secrets and variables, then Actions, and add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the publishable key). Run the workflow once by hand from the Actions tab to confirm it is green. For a second, independent ping, a free uptime monitor can call the same function over HTTPS. Scheduled GitHub jobs can be late, and GitHub may switch them off after a long period without repository activity, so make an occasional commit. This lowers the chance of a pause; it does not remove it, and a paused project resumes from the Supabase dashboard with nothing lost.

## Security and clinical notes

- Row level security separates facilities, and the audit log is insert-only. Keep using fake data until the Day 20 gate.
- The PIN lock and the audit log are protections against casual access and against disputes. They are not encryption. Records on a signed-in phone are stored unencrypted in the browser's storage, so a phone with a strong screen lock and device encryption is the real protection. Teach staff to report a lost phone to the facility admin immediately.
- A removed staff member's phone keeps its local copy until it next connects. The app then locks and offers to erase it.
- The privacy notice, the patient notice wording and the staff agreement are templates. They must be reviewed by a lawyer or the facility's data protection officer before real use, together with how long records must be kept before any erasure.
- Permanent erasure is irreversible. It wipes identifying details and visit contents, keeps a marker so every phone receives the erasure, and is recorded in the audit log.
- Password reset by email does not work until custom mail is configured. A locked-out staff member is removed and re-invited by the admin.
- Guardians' and patients' phone numbers and SMS consent are personal data. A reminder never goes to the next of kin and never contains a diagnosis.
- The Python service holds Supabase's secret key. It must live only in the server's settings, never in the app.
- A facility's plan comes from the database. The browser-storage testing switch works only in `npm run dev`. Only the patient cap and staff seats are enforced by the server; export, report and follow-up gates run on the device and can be bypassed by a technical user, so treat them as a product boundary, not a security one.
- Backups contain the full patient register. They are encrypted with the admin's password, and a forgotten password cannot be recovered by anyone. A backup taken before an erasure still contains that person, so delete old backups and do not keep them indefinitely. Restore never brings an erased patient back, but backups remain the facility's responsibility.
- Browsers can clear a site's storage if the phone runs low on space unless the site is granted persistent storage. Prima asks for it, but the browser decides; regular backups are the safety net.
- FHIR and DHIS2 files contain, or are derived from, identifiable health records. They are made on the phone and handed to a person; where they go next is the facility's responsibility. Prima's FHIR identifiers use `urn:prima:` names until the project has a web address of its own, and the vaccine codes use "unspecified formulation" entries where Prima records only a vaccine name, so a receiving system's owner should confirm the mapping.
- The ICD-10 list was checked for existence against a WHO ICD-10 dataset, but editions differ (for example dengue and haemorrhoids moved between editions) and a few three-character codes have finer sub-codes in the newest edition. Nigeria's national reporting rules decide what is required; confirm with a health worker or the state records officer before real use.
- Immunization intervals, vitals thresholds, follow-up rules, the ICD-10 list and the report groupings are simplified starting points. Confirm them with a health worker before real use.
- Before real PHC data, complete the Nigeria Data Protection Act and NDPC check planned for Day 20.

## Facts for the LinkedIn post

- Problem: paper registers lose and duplicate patients; the LGA report is counted by hand; follow-ups depend on a nurse's memory; nobody can say who looked at a record.
- Origin: a public health graduate learning software engineering, building for PHCs.
- Pivot: started server-first, then rebuilt offline-first after seeing that network drops break clinic workflow.
- Numbers: 2 repos (1 reference, 1 product); 28 automated Python tests; about 330 ICD-10 conditions searchable in plain language; a 25-day roadmap.
- Day 14 headline: a PIN that works with no signal, an audit log that nobody can edit (not even an admin), and a "right to be forgotten" button that really reaches every phone. The log records which fields changed and which card, never a name or a diagnosis.
- Day 17 headline: Prima can now speak the standards health systems use. A Pro facility can export its records as FHIR, with a mother's baby linked to her as a related person, and a monthly DHIS2 file. HIV and mental-health diagnoses stay out by default. The diagnosis list grew from 45 to about 330 conditions, and a test caught that a bigger list would have quietly undercounted antenatal visits.
- Day 16 headline: Prima now installs on an Android home screen and opens with no signal at all, straight to the PIN screen. Updates ask first instead of reloading under a nurse's thumb, and the app has a built-in tap test so gloves get measured, not guessed.
- Day 15 headline: the database now says no to the 201st free patient, but a nurse's patient is never lost: the record waits on the phone and uploads when the plan changes. Uploads travel in batches in dependency order, idle phones skip the server entirely, and backups are encrypted so a full register never sits in a chat as plain text.
- Lesson: security features should not live in each screen. The audit log is written by the same database hooks that already queue sync, so a change cannot happen without a record. And a PIN is a lock, not a vault, so say so.
- Learned: Python from zero, FastAPI dependencies and testing, Dexie hooks, transactions and live queries, offline-first design, Postgres row level security, security-definer functions, triggers, insert-only audit tables, PBKDF2 PIN hashing, offline-first authentication.
- Feedback loops so far: product feedback produced Para/Gravida and immunizations; a LinkedIn review produced the chief complaint field and the follow-up prefill; a commenter pushed for global standards; a UI critique produced the Day 4 redesign; a clinic-practice note produced glove mode; clinic-workflow feedback produced guardian links and SMS reminders.
