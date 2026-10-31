# Prima

**An offline-first patient register and visit record for Primary Health Centers (PHCs) in Nigeria.**

A nurse registers patients, records visits, tracks vaccines, links children to their guardians, sees who is due for follow-up, queues appointment reminders, cleans up duplicate records and produces the monthly LGA summary, on an Android phone, tablet or laptop, with or without network. Everything is saved on the device first and syncs both ways with the cloud in the background. Each facility's records are private to its own staff, and every sensitive action is logged.

> Status: built in public. Days 1-23 are built. Still to do from earlier days: the Day 19 usability session with real CHEWs and nurses, buying the domain, the native-speaker check of Igbo, Hausa and Yoruba, and a real-phone test of the Day 23 device dashboard. Day 22 is complete except 9 admin screens that were parked on purpose. The roadmap runs to Day 34, then continues with feedback from real PHCs.

---

## The problem

Paper registers at PHCs lose patients, create duplicates (the same woman registered three times under different spellings), make the monthly LGA report a slow manual count, and give nobody a way to see who is due for a follow-up or the next vaccine. Children are usually registered under their mother's phone, so the card of a baby and the antenatal card of the mother are never connected. Many PHCs also have unreliable network, so an app that needs the internet to save a record does not work for them. Prima is **offline-first** for that reason.

## What Prima does today

**Which phone is behind (Day 23)**

- A **Devices** tab on the Dashboard (facility admins only) lists every phone and tablet that uses the facility, with the worst first: when it last made contact and last synced, how many records are waiting to upload and for how long, how many newer records it has not downloaded, who last used it, the app version and the battery.
- It warns about records that need attention, a phone not seen for days, records waiting for hours, a phone whose clock is wrong (which can make edits lose), a phone that is behind, and an old app version. An admin can name a device ("Front desk tablet") or take an old one off the list.
- Each phone reports a few counts and times about itself, never patient information. Nothing is sent while the phone is offline, the screen is off, or Low Battery Mode is on.

**Languages (Days 21 and 22)**

- A small translation framework with no extra packages: every sentence a nurse sees lives in one English dictionary, and each language is one separate file loaded only when chosen (so it works offline once installed). A missing line shows the English one, never a blank. Numbers, dates and plurals follow the language (English has "1 year" and "34 years", Igbo has one form).
- Igbo draft for the screens built so far: the bottom tabs and menu, registering a patient, the sync badge and banners, Low Battery Mode, the update prompt, the "finish this record" card and the whole Account page (account, facility, team and invite codes). A "Language / Asụsụ" card at the top of Account lets a person switch, and the choice is remembered on that phone. Hausa and Yoruba are offered the same way, as drafts.
- Names of conditions, complaints and medicines stay in English on purpose, so records and reports read the same everywhere.
- A review page for admins shows English and the translation side by side, flags lines that are missing, unchanged or much longer, and copies everything as a spreadsheet for a reviewer. A checker script catches a changed {blank}, a missing line, a wrong plural form, or letters saved in a split form.
- The Igbo is a draft written by an AI assistant. It must be checked by a native speaker before it is called ready.

**A landing page (Day 20)**

- A separate small website in `landing/`, so people can learn what Prima is before they install anything. No framework and no packages: plain HTML, CSS and about 4 KB of script. About 14 KB compressed for the first load, no images or fonts to download, no requests to other websites, and no cookies or trackers.
- Sections: a hero with an animated phone that tells the whole offline story (signal drops, a patient is saved on the phone, signal returns, it uploads), three promises, how it works in three steps, features labelled Built or Coming, questions people asked, a privacy section that says what is still to be reviewed, planned pricing, the story, a waitlist section, and straight answers.
- The page never claims what Prima does not have: no certification claims, no usage numbers, and the pictures are labelled as examples with made-up data.
- Works without JavaScript, respects the phone's "reduce motion" setting, passes colour contrast checks, and uses a strict security policy.
- A build script fills in the address, WhatsApp, LinkedIn, email and launch time from one config file, and a check script refuses to pass a page with broken links, missing contact details, other websites' scripts, low contrast or placeholder text. The countdown to the pilot shows only when a launch time is set.

**Quick register and Low Battery Mode (Day 19)**

- A one-screen quick registration is now the default Register form: name, sex, age (or birth date), village, reason for visit, and an optional phone. Villages and common reasons the clinic actually uses appear as tap-to-fill chips. Next of kin is left for later; the profile shows a "Finish this record" card for anything missing. The full form is one tap away.
- "Register and add visit" goes straight to the visit form. Duplicate checking works the same as before, and also covers estimated ages.
- When nobody knows a birth date, the age is saved as an estimate, marked as an estimate on the profile and the printed card, and flagged in the FHIR export.
- Low Battery Mode: on at 20% battery (off again at 30% or when charging), or switched on by hand. It pauses background syncing (a "Sync now" button stays available), skips optional network calls, slows the camera scanner, removes animations and switches to dark colours. Registering and saving still go straight to the phone's database, so nothing is lost.
- A rebuilt sync engine and a Sync Doctor page (admins). Failures are now told apart: no connection waits quietly, a missing column in the cloud database fails at once and says which, a record Prima cannot convert is retried with growing gaps without holding up the others, and a request that never answers is given up on after 40 seconds. The badge says what is really happening ("Syncing…" only while something is running, "Retrying in 40 s", "Database update needed"), and the Doctor checks the cloud database for every column and function this version needs.
- Registration speed measuring, for usability sessions only: off by default, records time and taps (no names), and stays on the phone.

**Faster, safer data entry (Day 18)**

- A chief-complaint check under the complaint box: it recognises what the nurse typed (including Nigerian English and Pidgin such as "hot body" and "running stomach"), offers "Did you mean fever?" for a likely typo, and warns when a phone number or email has been typed into the complaint. It never blocks saving. The same word list and rules run on the phone and in the Python service.
- A printable patient card at bank-card size with a QR code that holds only the card number. A Scan card page opens the patient from the QR, or from a typed card number, using the phone's camera.
- Save and Cancel stay in view on forms: above the bottom tabs on a phone, above the keyboard while typing, and stuck to the bottom of the screen on a tablet. Closing the tab with unsaved changes asks first.
- Vitals steppers for blood pressure, temperature and weight: large minus and plus buttons, hold to run faster, typing still works, and values stay inside safe limits.

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

### Day 17: standards

- **FHIR.** A pure function turns the register into FHIR R4 resources: Organization, Patient (card and NHIS numbers as identifiers, next of kin as a contact), RelatedPerson for guardians, Encounter, Condition (ICD-10), Observation (blood pressure, temperature, weight with LOINC and UCUM codes; pregnancy, gravida and para), Immunization (CVX codes, birth doses as text), AllergyIntolerance. Each resource gets a stable id, so loading a file twice updates instead of duplicating. The output was validated against an independent FHIR R4B library, with every reference resolving inside the file.
- **DHIS2.** Monthly `dataValueSets` JSON. Prima's 23 figures are mapped by the district officer's template; only mapped, valid figures are exported, and the rest are listed. A mapped vaccine with no doses in the month is exported as a real zero.
- **ICD-10 list.** From 45 to about 330 entries. Every code was checked to exist in a WHO ICD-10 dataset, labels were compared against it for mix-ups, and the 45 original entries kept their codes and labels so saved visits do not change. The list is plain-language summaries, not the official classification, and still needs a clinician's review before real use.
- **Prefix matching for service lines**, because exact matching would have silently undercounted antenatal visits coded Z34.0 or Z34.8. Changed in both the app and the Python service, with five new tests.

### Day 18: faster entry

- **Complaint check.** About 90 plain-language complaint names with roughly 600 ways people say them, a rule that corrects only likely typos of those words (same first letter, one edit up to 8 letters), a list of everyday words that must never be "corrected", and checks for phone numbers and emails. Tested against 228 recorded cases that give identical answers in TypeScript and Python.
- **Card and scan.** The QR holds `PRIMA:` plus the card number. Drawn as an SVG on the phone, and read back with an independent QR decoder in testing, including at small size and with blur.
- **Sticky save bar.** Fixed above the tab bar on phones using the keyboard-aware visual viewport, sticky on larger screens.
- **Steppers.** Pure step logic (no rounding drift: 36.8 plus ten presses of 0.1 is exactly 37.8), accessible buttons, hold-to-repeat that speeds up.

### Day 23: which phone is behind (built, test on real phones pending)

- **What it is.** A new **Devices** tab on the Dashboard, for facility admins only. It lists every phone and tablet that uses the facility: when it last made contact, when it last synced, how many records are waiting to upload (and how long the oldest has waited), how many newer records it has not downloaded yet, who last used it, the app version and the battery. The worst cases come first, under four counts: up to date, behind or waiting, need attention, and records waiting.
- **How a phone reports.** Each phone makes a random id once (kept with its other settings) and sends a small report when something changed (never more often than every 30 seconds), and every 15 minutes while the app is open and visible even if nothing changed, so the admin can tell "quiet" from "gone". Nothing is sent while the screen is hidden, the phone is offline, or Low Battery Mode is on. A report holds counts, times, the app version, the battery level and a device name made from the browser (for example "Android · Chrome 129 · 7F3A"). It never holds patient information.
- **How "behind" is measured.** The cloud already knows the facility's newest change (the shortcut the sync uses to skip pointless downloads). Each phone reports the newest change it has downloaded, and the cloud counts the records changed after that (up to 500). A phone is called behind only when the facility is more than 10 minutes ahead of it and at least one such record exists, because an open phone catches up every few minutes by itself.
- **The warnings** are decided in one file, `src/lib/deviceHealth.ts`, with every number at the top: records that need attention (bad); not seen for 3 days (warning, bad if records are waiting on it); records waiting 2 hours (warning) or 24 hours (bad); the clock more than 5 minutes wrong (warning) or 1 hour (bad); behind; has never downloaded anything; an app version a day or more older than the newest in the facility; and two quiet hints, battery at 15% or less and Low Battery Mode, which never turn a device red.
- **Why the clock check matters.** Prima settles two edits to one record by the newer time on the phone, so a phone with a wrong clock can lose edits or overwrite newer ones. The report carries the phone's own time next to the server's, so the dashboard can say "The clock on this device is 3 hours wrong". How long records have waited is measured on the phone's own clock at both ends, so a wrong clock cannot fake or hide it.
- **What an admin can do.** Rename a device ("Front desk tablet") and remove an old one from the list. Removing deletes nothing on the phone or in any patient record; the device appears again if it is used again. The page loads again every minute while it is open. With no internet, or before the SQL has been run, it says so and still shows this phone from what it knows itself.
- **Security.** The new table `device_status` has row level security on, no policy and no direct access for anyone. Four functions are the only way in: `report_device` (the facility and the person come from the sign-in, never from the app, and it cannot take over a device id that belongs to another facility), and `list_devices`, `rename_device` and `remove_device` (facility admins only). The SQL is `supabase/day23.sql` and was tested on a real PostgreSQL engine (PGlite): 31 checks, including staff, another facility and signed-out callers.
- **Files.** `supabase/day23.sql`; `src/lib/deviceHealth.ts` (rules, names, report shape), `deviceApi.ts` (admin calls), `deviceStatus.ts` (the phone's side); `src/hooks/useDevices.ts`; `src/components/DevicesView.tsx`; `src/pages/DashboardPage.tsx` (the Devices tab); two lines in `src/main.tsx` (`startDeviceReports()`). 56 more dictionary lines in four languages: 650 English lines, Igbo and Yoruba 627, Hausa 650.
- **Tested.** 57 checks of the rules and the report (`scripts/day23-checks.ts`); 31 checks of the SQL; strict type-check and lint clean; in a real browser (Firefox) in all four languages with six sample phones that trigger every warning: the order, the counts, every sentence, the dialogs, the offline, "SQL not run yet", "sign in again", "not allowed" and empty states, and that staff see no Devices tab. **Not tested:** against your real Supabase project and on real phones.
- **Known limits.** A phone reports only while its screen is on and it is online, so a tablet asleep in a drawer shows as "not seen", which is true. A phone in Low Battery Mode does not report. The battery level is available only on Chrome for Android. Modern Chrome hides the phone model, so the automatic name is a browser and a short code, and the admin renames it. Records parked because the Free plan is full count as "need attention". There are no alerts: an admin has to look. The count of missing records includes any very recent upload from the phone itself, which clears at its next download.

### Day 22: languages II (done, except 9 admin screens parked for later)

- **Hausa and Yoruba drafts.** Every line of the dictionary is translated into both (Hausa has a singular and a plural form like English; Yoruba, like Igbo, has one form). Hausa uses the hooked letters (ɓ ɗ ƙ ƴ); Yoruba uses the dot-below letters with tone marks (ẹ ọ ṣ, à á è é). All three show a "Draft" label in the app until native speakers have been through every line.
- **Native-speaker review pack.** `npm run i18n:export ig` (or `ha`, `yo`) writes a spreadsheet with the English, the current words, where on the phone each line appears, and columns for the reviewer's version, a status (ok, change, unsure) and a comment. `docs/TRANSLATION_REVIEW.md` is the guide to send with it, with a table of the 24 key words to check first, made from the real files. `npm run i18n:import <language> <file>` reads the reviewer's spreadsheet back. It shows what would change, refuses a line that lost a {blank} or names a line the app does not have, writes unsure lines to `review/<language>-questions.md`, and only changes the file with `--write`. A line deleted from the file is added back. Tested with a deliberately broken spreadsheet, with comma and semicolon files, and with a missing line.
- **Fonts and formats.** Phone check has a "Letters and formats" card (replacing the Igbo-only box). It draws the special letters of all three languages, including stacked tone marks, and shows a date, a number and naira in the selected language. In the test browser every letter and tone mark drew correctly; the real answer comes from a low-cost Android phone. Naira is written without kobo (₦2,500). Dates use the phone's own calendar (Igbo "Ọktoba", Hausa "Oktoba", Yoruba "Oṣù Ọ̀wàrà") and fall back to Nigerian English if a phone lacks the language. No font is bundled: system fonts come first, and a small font would only be added if a real phone shows broken letters.
- **Finding the English that is left.** `npm run i18n:scan` reads every screen and lists the words still written inside it, by file and count (`--all` includes the staff tools that stay English, `--strict` fails if anything remains). On the original Account page and shell it found 49 and 4; on the converted ones, none. It needs TypeScript 5 or 6 and says so otherwise.
- **The review page** now has a language picker for Igbo, Hausa and Yoruba.
- **Screens converted, in five batches, in all four languages.** A: the patient page, the full registration form, edit patient and new visit. B: the visit form and card, vaccines, the diagnosis box, guardians and the family section. C: the home page, patient list and search, the printed card and its page, card scanning, the plan bar and upgrade window, and the visit-form leftovers (visit rules, number steppers, reading notes). D: sign-in, sign-up and facility setup, the PIN screens, the Security card and the "sign in again" banner. E: the dashboard with its Follow-ups tab, month arrows, the not-found page, confirm and modal windows and the glove-mode switch.
- **What was added to the engine for this.** `isoDate` for calendar days. `tv()` turns a message written by a form rule into the person's language: `schema.ts`, `visitSchema.ts` and `guardians.ts` now write dictionary keys (a field name goes after a `|`, as in `err.fieldShort|register.fullName`), and plain English passes through unchanged so screens can be converted one at a time. `friendlyErrorKey` in `auth.ts` does the same for sign-in errors. `useMonthLabel` gives month names from the browser's calendar. `NOTE_KEY` in `vitals.ts` translates reading notes while the English text stays for other code. The old English-returning functions (`friendlyError`, `validateGuardianChoice`, `RELATIONSHIPS`, `relationshipLabel`) still exist.
- **The printed card follows the phone's language.** Birth date, "Female" and "Male", the card number label and the closing note are translated; the name, the card number and the QR code are not. The card text was checked to fit inside the 54 mm box in all four languages.
- **Reading notes** ("Fever", "High fever", "High", "Very high", "Low") keep their English text inside `vitals.ts` for other code, and `NOTE_KEY` says which dictionary line shows the same note in the person's language. These are safety lines: a health worker should check them.
- **Kept in English on purpose:** the SMS consent wording and the staff confidentiality promise (legal text, translated only after the Day 27 privacy review), the clinical terms Gravida and Para, and the staff tools (Sync Doctor, Translations, Phone check, the timing card).
- **Still English only because their source files have not been sent:** the "PIN too easy to guess" message (`lib/pin.ts`), the notices after a forced sign-out (the auth provider), follow-up item titles such as "Follow-up visit" (`hooks/useFollowUps.ts`), chart legends (`Charts.tsx`) and backup error messages (`lib/backup.ts`).
- **Parked by choice:** the 9 admin screens (146 pieces): `BackupCard`, `PlansPage`, `PlanCard`, `InstallCard`, `AppVersionCard`, `RemindersView`, `SmsSection`, `DuplicatesPage` and `MergeDialog`. `npm run i18n:scan` lists exactly these, and the work continues whenever the files are sent. Plans and prices are the most important of them.
- **Dictionary at the end of Day 22:** 594 English lines (Igbo and Yoruba 577, Hausa 594). A reviewer needs about 3 hours for a language, so send the export in rounds.
- **Tested in a real browser** (Firefox) in all four languages on every converted screen: nothing cut off, nothing scrolling sideways, no English left over, every error message, every plural, and the printed card fitting its 54 mm box. Type-check and lint clean.

### Day 21: languages I (done)

- **Why a small custom engine.** About 120 lines, no libraries, typed keys (a typo in a key is a compile error), plural forms from the browser's own rules (`Intl.PluralRules`), and a safe English fallback. A library would add weight on every phone for features this app does not need yet.
- **Logic returns messages, screens translate them.** The sync status and the form checks return keys and numbers, not sentences, so they follow the language and stay easy to test.
- **The dictionary.** 223 English lines in `src/i18n/locales/en.ts`; the Igbo draft in `ig.ts` has every line it needs (215 of 215, because Igbo has no singular form). `npm run i18n:check` catches a changed {blank}, a missing or misspelt key, a wrong plural form and letters saved in a split form. `npm run i18n:test` runs 27 checks on the engine, the files and the sync and form messages.
- **Converted so far:** the app shell (tabs, Lock, Account), the quick registration form and its error messages, the register page, the sync badge, panel and banners, the complaint hint, the finish-this-record card, Low Battery Mode, the update prompt and the Account page. Dates on the Account page follow the language too (Igbo month names).
- **Staff tools stay English:** Sync Doctor, Translations, Phone check and the usability timing card.
- **Tested in a real browser** (Firefox): start in English, choose Igbo from the card, the badge and every button change at once and the choice survives a reload; no text is cut off and nothing scrolls sideways; Hausa and Yoruba cannot be picked yet; and the dot-below Igbo letters (ị ọ ụ) draw correctly. Strict TypeScript and the project's React lint rules pass on every converted file.
- **Account page layout bug.** In a one-column grid, one card holding a long unbreakable piece of text (an email, a link, a code) made every card as wide as that text: 865 px on a 488 px screen, with the page scrolling sideways. Fixed by `grid-cols-1` on the card grid and `.card { min-width: 0; overflow-wrap: anywhere }` in `index.css`; after the fix the cards are 456 px, in English and Igbo.
- **Editor errors in `scripts/`.** The scripts sit outside `src/`, so the editor did not know Node's types. Fixed with `npm install --save-dev @types/node` and a `scripts/tsconfig.json`; `tsc -b` never included them.
- **Still to do (Day 22):** the home page, patients list, patient profile, visit form, the full registration form, the Security, Plan, Install and Backup cards, and the messages in `src/lib/auth.ts` are still English. The WhatsApp invite message stays English until the sign-in screens are translated.

### Day 19: quick register and low battery

- **Quick form.** Pure logic for validation, converting to the existing registration function, and estimating a birth date (tested over every day of ten years: the estimate always shows the same age today, including 29 February and month ends). The full form stays for people who want it, and editing a patient still uses it.
- **What a quick registration leaves empty.** Next of kin is stored as empty text (the database already accepts it), and a profile card lists what is missing. One new database column, `dob_estimated`.
- **Duplicates with an estimated age.** The check also looks two years either side of the estimate, but only among patients of the same sex from the same village.
- **Low Battery Mode.** A small shared store, with hysteresis so it does not flicker at 20%. The sync engine asks it before every automatic upload and download; the Sync now buttons override it.
- **Sync fix.** The Day 15 engine treated any error without a database code as "no connection", so a missing column (the Day 19 SQL not yet run) or a mistake inside Prima looked like a bad network and the badge said "Syncing 1…" for ever. It also let a patient waiting out a delay lose its visits' tries, and one hung request could block all uploading until a reload. Rebuilt with an error classifier, per-record backoff, a 40-second request limit, a run watchdog, held-back dependents, and 47 automated checks against a real local database.
- **A usability session guide** in `docs/USABILITY_TEST.md` for testing the quick form with real CHEWs and nurses, with made-up patients only.

### Day 20: landing page (in progress)

- **Why static.** The pages are plain files, so they load fast on mobile data, work with JavaScript off, and carry their own share preview text for WhatsApp and LinkedIn (which do not run scripts).
- **Pictures made of code.** The hero phone, the step pictures and the clinic illustration are HTML, CSS and SVG: sharp on any screen, a few KB, and honest (marked as examples). Real screenshots can be added later.
- **Tested in a real browser** (Firefox, headless) at 390 px and 1280 px wide: no sideways scrolling, every section reveals, the phone story cycles through all five states, "reduce motion" shows one still picture, the strict security policy blocks nothing the page needs, and the countdown, contact buttons and mobile menu work. Plus 8 automated tests for the build and the check.
- **To do:** buy the domain, set the address and contact details in `landing/site.config.json`, deploy to Cloudflare Pages, and check the share preview on WhatsApp and LinkedIn.

## Feedback queue

| Feedback                                                                                     | Decision                                                                                                          | Status                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Guardian link                                                                                | Day 11                                                                                                            | Done                           |
| SMS base (consent, reminders table, dashboard count, no sending)                             | Day 12                                                                                                            | Done                           |
| Offline IDs like `ANK-{device}-{counter}` with a mapping table                               | Not added: device UUIDs and random card numbers already solve it without ever rewriting an ID                     | Closed                         |
| A read-only supervisor role for LGA officers                                                 | Considered for Day 14, not built; needs careful read-only handling across the app                                 | Open                           |
| Simplify the register flow, too many taps (LinkedIn comments, CHEW usability)                | Day 19: quick register built; the timed test with real nurses is still to do (`docs/USABILITY_TEST.md`)           | Built, test pending            |
| Hausa, Igbo and Yoruba language switch                                                       | Day 21: framework and Igbo draft built; Day 22: Hausa and Yoruba, review pack, remaining screens                  | In progress                    |
| Low Battery Mode: stop background sync, dim, save at once                                    | Day 19: built; needs a test on a real phone with a low battery                                                    | Built, test pending            |
| Sync with no internet over the clinic's Wi-Fi (3 tablets, power and a router, no data)       | Days 25 and 26: pairing by QR code, plus a shared changes file as a fallback                                      | Planned                        |
| Sync status dashboard: which tablet last synced, how many records are waiting, who is behind | Day 23: Devices tab on the Dashboard (admins)                                                                     | Built, real-phone test pending |
| A landing page that explains Prima before anyone installs it                                 | Day 20: built, tested and deployed; domain still to buy                                                           | Built                          |
| A waitlist with a launch countdown, then a week of marketing                                 | Moved to the last day (Day 34), after the privacy and clinical review; marketing plan in `docs/MARKETING_PLAN.md` | Planned                        |

## Decisions and why

| Decision                                                                                                     | Reason                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IndexedDB first, server second                                                                               | The UI must never wait for the network                                                                                                                                      |
| UUIDs and card numbers generated on the device                                                               | Offline phones cannot ask a server for the next number                                                                                                                      |
| Soft delete                                                                                                  | Deletes must sync, be undoable, and leave an audit trail                                                                                                                    |
| Every Python feature gets an on-device fallback                                                              | The app must never show an error because a server is not paid for yet                                                                                                       |
| SMS consent lives on whoever owns the phone, and resets when the number changes                              | The person who receives the text consents, to that number                                                                                                                   |
| The app unlocks from a record on the phone, not from the network                                             | A clinic with no signal must still open the app                                                                                                                             |
| Facility access is decided by database rules, not by the app                                                 | The app's public key is visible to anyone                                                                                                                                   |
| The PIN is a lock for casual access, not encryption                                                          | A 6-digit PIN can be guessed offline by someone who copies the phone's storage; phone screen lock and device encryption are the real protection                             |
| The app stays mounted behind the lock screen                                                                 | Locking must never throw away a half-filled registration                                                                                                                    |
| Audit entries are created by database hooks, not by each screen                                              | A change cannot be made without leaving a record, and no screen can forget                                                                                                  |
| Audit entries hold field names and card numbers, never names or diagnoses                                    | The log must not become a second copy of patient data                                                                                                                       |
| Audit entries are insert-only and the server stamps who sent them                                            | Nobody, including an admin, can quietly edit history                                                                                                                        |
| Admin-only: delete, merge, export, audit, requests, team                                                     | Bulk and destructive actions have the fewest hands on them                                                                                                                  |
| Deleting or merging a patient is also checked in the database                                                | A hidden button is not security                                                                                                                                             |
| Erasure wipes identifying details and keeps a marker, instead of deleting the row                            | Other phones must receive the erasure, and a stale phone must not bring the data back                                                                                       |
| Erasure needs the card number typed and a log entry                                                          | It cannot be undone, and health records may have retention rules                                                                                                            |
| Privacy notice and staff agreement are drafts for legal review                                               | Compliance wording must come from a lawyer or the facility's data protection officer                                                                                        |
| One facility per phone                                                                                       | Records from two facilities must never mix on one device                                                                                                                    |
| The database enforces what only the database can: patient cap and staff seats                                | Exports, reports and follow-up lists run on the device from data it already holds, so they are a convenience gate, not a security boundary                                  |
| An over-limit upload is parked, not deleted                                                                  | The patient is already registered in front of a nurse; losing the record is worse than a delayed upload                                                                     |
| One calm banner at a time, always saying the records are safe                                                | Frightened nurses stop trusting the app; most failures here are not their fault                                                                                             |
| Uploads in dependency order and in batches, with one-by-one fallback                                         | Hundreds of queued items must not mean hundreds of requests, and one bad record must not hide the good ones                                                                 |
| Idle devices ask one cheap question before pulling                                                           | At 1,500 devices, five queries each every few minutes is the real load                                                                                                      |
| Exports are files a person imports, never automatic sends                                                    | Patient data leaves the clinic only through a decision and a channel someone chose                                                                                          |
| Sensitive diagnoses are left out of FHIR by default                                                          | HIV, STI, mental health and pregnancy loss carry stigma and, in some cases, legal risk                                                                                      |
| The DHIS2 mapping is filled in once, from a template, by the district officer                                | Prima cannot know a district's data element codes, and guessing them would put figures in the wrong place                                                                   |
| Stable ids derived from the visit, not random ones                                                           | Re-exporting must update the receiving system, not create duplicates                                                                                                        |
| Service lines count by code prefix                                                                           | A bigger diagnosis list must never reduce the antenatal count                                                                                                               |
| The quick form is the default, the full form stays one tap away                                              | Most registrations need five things; the rest can be asked at the next visit without holding up the queue                                                                   |
| An age with no birth date is saved as an estimate and labelled as one                                        | An honest "about 34" is better than an invented date of birth, and reports only need the age                                                                                |
| Next of kin can be added later, and the profile says it is missing                                           | A queue at the door should not be held up by a question the patient may not be able to answer yet                                                                           |
| A card can never be wider than the screen                                                                    | One long unbreakable word (an email or link) stretched every card in a one-column grid and made the page scroll sideways on a phone                                         |
| Every language is a draft until a native speaker has been through every line                                 | The first Hausa and Yoruba were written by an AI assistant; a wrong word on a clinical screen is a safety problem, so the app says "Draft" until the review pack comes back |
| Reviewers work in a spreadsheet, not in code                                                                 | Nurses and CHEWs know Excel and WhatsApp; the import script checks every change so a typing slip cannot break a screen                                                      |
| The translation engine is small and has no library                                                           | Typed keys, the browser's own plural rules, and one small file per language that works offline                                                                              |
| Clinical names stay in English in every language                                                             | Records and monthly reports must read the same in every clinic, and local-language medical words need clinician review first                                                |
| A language shows "Draft" until a native speaker has checked it                                               | A wrong word on a clinical screen is a safety problem, not a style problem                                                                                                  |
| The waitlist is the last day of the roadmap                                                                  | It collects personal data, so it comes after the privacy and clinical review, and pilot clinics are invited directly                                                        |
| The landing page is plain static files, not a React app                                                      | Speed on mobile data, share previews that work without scripts, and nothing that can break a build                                                                          |
| The landing page loads nothing from other websites and has no tracker                                        | Faster, private, and a strict security policy can be used. Measure visits with Cloudflare's own cookie-free analytics if needed                                             |
| Contact buttons appear only when contact details are set, and the check refuses a page with none             | A waitlist section with no way to reach you is worse than no section                                                                                                        |
| Pictures on the landing page are drawn in code and labelled as examples                                      | No stock photos of people who never used Prima, no fake testimonials, no real patient                                                                                       |
| Every sync failure is classified before anything is retried                                                  | A bug, a missing column and a dead connection need different responses, and treating them all as "no network" hid the real problem                                          |
| A record that cannot upload is retried with growing gaps and never holds up the others                       | One bad record must not stop a clinic's whole day of work reaching the cloud                                                                                                |
| Every cloud request gives up after 40 seconds                                                                | A request that never answers would otherwise keep "Syncing…" on screen for ever                                                                                             |
| Low Battery Mode pauses the network, never the saving                                                        | A nurse must never lose a record because the battery is low                                                                                                                 |
| Low Battery Mode turns on at 20% and off at 30%                                                              | A single threshold flickers on and off as the battery hovers                                                                                                                |
| Measuring registration speed is off unless someone switches it on                                            | Timing staff can feel like monitoring them; it is meant for a usability session, with their knowledge                                                                       |
| The complaint check suggests, it never blocks or auto-corrects                                               | An emergency must always be savable, and a wrong silent fix is worse than a typo                                                                                            |
| A QR on the patient card holds only the card number                                                          | A lost card must tell a stranger nothing                                                                                                                                    |
| Save and Cancel stay in view                                                                                 | A nurse should never have to scroll to find Save, or lose a form by tapping away                                                                                            |
| Stepper buttons start from a typical value only when the box is empty, and values are clamped                | One tap should be useful, but a plausible number must never replace a measured one                                                                                          |
| The device dashboard reads reports the phones send, not live connections                                     | Phones are often offline, so the honest question is "when did you last hear from it, and what did it say then"                                                              |
| A device report holds counts and times, never patient information                                            | The dashboard must be safe to show a supervisor, and must not add a new place where health data lives                                                                       |
| The device table is reachable only through four functions, and the person and facility come from the sign-in | A phone must not be able to claim to be someone else's device, or read another facility's list                                                                              |
| A wrong phone clock is shown as a warning                                                                    | Prima settles two edits to one record by the newer time on the phone, so a wrong clock can silently lose work                                                               |
| How long records have waited is measured on the phone's own clock at both ends                               | A wrong clock must not be able to fake or hide a long wait                                                                                                                  |
| Battery and Low Battery Mode are hints, never red                                                            | A phone on its last 10% is not a fault, and a red card should always mean someone must act                                                                                  |
| The Devices tab is for admins only                                                                           | Staff see their own phone's sync badge; comparing phones is a supervisor's job                                                                                              |
| Languages are drafted by me and published only after native-speaker review                                   | A wrong word in a clinical screen is a safety problem, not a style problem                                                                                                  |
| Clinic Wi-Fi sync pairs devices in person by QR code, with a file-sharing fallback                           | There is no server to introduce two phones, and some routers block phones from talking to each other                                                                        |
| Updates wait for a tap, never reload by themselves                                                           | A nurse mid-registration must never lose her form to a version change                                                                                                       |
| The offline worker caches Prima's own files and nothing else                                                 | Patient data belongs in the phone's database under the PIN, not in a browser cache                                                                                          |
| Test on a real phone over HTTPS, with the gloves staff actually wear                                         | Targets that pass on a desk fail in a glove, and a plain local-network address disables the security features                                                               |
| Backups are always encrypted with a password                                                                 | A full register in a Downloads folder or a WhatsApp chat is a data breach waiting to happen                                                                                 |
| Restore never deletes and never resurrects erased patients                                                   | A restore must not be able to undo a legal erasure or destroy newer work                                                                                                    |
| Confirmation email off, staff join by invite code                                                            | The free built-in email only works for the project's own team                                                                                                               |

## Costs and hosting: launch lean

| Item                   | Pilot (fake data)                                                                                      | Real patient data                   | When revenue covers it             |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------- | ---------------------------------- |
| Database and sign-in   | Supabase Free                                                                                          | Supabase Pro (about $25/month)      | Same                               |
| Frontend               | Cloudflare Pages (free, commercial use allowed)                                                        | Same                                | Same                               |
| Python service         | Built and tested locally, not hosted                                                                   | Not needed yet                      | Hosted when about 4 facilities pay |
| SMS sending            | Not built yet; the queue is ready                                                                      | Needs a provider account and credit | When facilities pay                |
| Email (password reset) | Off; invite codes instead                                                                              | Custom mail provider, free tier     | At deploy time                     |
| Domain                 | Free `pages.dev` address until Day 20, then `.com.ng` (about ₦6,250/year) so shared links never change | Same                                | Optional `.ng`                     |

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

| Phase               | Day   | Focus                                                                                                                                                                                                             | Status                                           |
| ------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Foundation          | 1-3   | Reference build, pivot, offline engine                                                                                                                                                                            | Done                                             |
| Product             | 4-6   | App shell, visits, edit/delete, two-way sync                                                                                                                                                                      | Done                                             |
| Insight and revenue | 7-8   | Dashboard, follow-ups, LGA report, export, plan limits                                                                                                                                                            | Done                                             |
| Data quality        | 9-10  | Duplicate merge tool, Python service                                                                                                                                                                              | Done                                             |
| Families            | 11-12 | Guardians and family links, SMS reminders base                                                                                                                                                                    | Done                                             |
| Trust               | 13-14 | Accounts, facilities, row level security; PIN lock, roles, audit log, privacy notice, data requests                                                                                                               | Done                                             |
| Phone-ready         | 15-16 | Plan limits, degraded mode, scale, backup; PWA and real-phone test                                                                                                                                                | Done                                             |
| Standards           | 17    | FHIR and DHIS2 export, larger ICD-10 list                                                                                                                                                                         | Done                                             |
| Fast and frugal     | 18    | Complaint check, printed card with QR and scan, sticky save bar, vitals steppers                                                                                                                                  | Done                                             |
|                     | 19    | Quick register for CHEWs (fewer taps), Low Battery Mode                                                                                                                                                           | Done (usability session pending)                 |
| Be found            | 20    | Landing page: story, pictures, icons, animation, speed                                                                                                                                                            | Done (domain still to buy)                       |
| Everyone can use it | 21    | Languages I: translation framework, English baseline, Igbo                                                                                                                                                        | Done                                             |
|                     | 22    | Languages II: Hausa, Yoruba, native-speaker review pack, fonts and formats, convert the remaining screens (home, patients, profile, visit form, full registration form, Security, Plan, Install and Backup cards) | Done, except 9 admin screens parked (146 pieces) |
| Works anywhere      | 23    | Sync status dashboard: per-tablet last sync, waiting records, who is behind                                                                                                                                       | Built (real-phone test pending)                  |
|                     | 24    | Clinic Wi-Fi sync I: pairing by QR code, sync protocol, security                                                                                                                                                  | Planned                                          |
|                     | 25    | Clinic Wi-Fi sync II: "devices nearby" card, automatic re-sync, shared changes file, three-phone test                                                                                                             | Planned                                          |
| Money and launch    | 26    | Paystack test mode, Edge Function payment check, subscriptions, annual plans                                                                                                                                      | Planned                                          |
|                     | 27    | Polish, accessibility, onboarding wizard, demo mode, error boundaries, NDPA and clinical-safety gate                                                                                                              | Planned                                          |
|                     | 28    | Deploy the app, custom mail, keep-alive live, privacy policy and terms, PHC officer guide                                                                                                                         | Planned                                          |
|                     | 29    | Pilot launch kit: training sheet, onboarding visit, direct invitations to pilot clinics, feedback forms                                                                                                           | Planned                                          |
|                     | 30    | Go live with 2 to 3 PHCs                                                                                                                                                                                          | Planned                                          |
| Discussions         | 31    | Cost and lean-launch review                                                                                                                                                                                       | Planned                                          |
|                     | 32    | Scaling to 500 users, Enugu and Owerri playbook, economics                                                                                                                                                        | Planned                                          |
|                     | 33    | Final NDPA check-in, clinical review wrap-up                                                                                                                                                                      | Planned                                          |
| Public launch       | 34    | Waitlist form, launch countdown, referral position, admin export; public marketing starts                                                                                                                         | Planned                                          |

The waitlist moved from Day 21 to the last day, on purpose. It collects personal data, so it now comes after the data protection and clinical review (Days 27 and 33), and the first 2 to 3 pilot clinics are invited directly by WhatsApp, LinkedIn and in person, which does not need a waitlist. Until Day 34 the landing page says "Get in touch" instead of "Join the waitlist".

The numbers are build days, not dates. They move with the pace, and go-live also depends on PHCs agreeing to take part.

After Day 34 the work is driven by feedback from real PHCs and reviewers.

## Run locally

Day 18 adds two small libraries: `npm install qrcode jsqr` and `npm install -D @types/qrcode`. Day 21 adds `npm install --save-dev @types/node` (types for the scripts folder only).

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

## The release routine

Run these from the project folder, in order. Pushing to GitHub only saves the code; it does not update the phone.

```bash
npx tsc -b                  # types
npm run lint                # code rules
npm run i18n:check          # translations against English
npm run i18n:test           # translation engine, three languages and messages
npm run i18n:scan           # English still written inside screens (what is left to convert)
npx tsx scripts/day23-checks.ts   # device dashboard rules and the report a phone sends (57 checks)
npm run dev                 # look at it on the PC (http://localhost:5173), then Ctrl+C
npm run build && npm run preview   # the real built app with the offline engine (http://localhost:4173)
git add . && git commit -m "Day N: what changed" && git push
npm run deploy:test         # build and upload the app to Cloudflare for the phone
curl -s https://prima-test-axo.pages.dev/version.json   # the live build time
```

On the phone: open Prima online, wait 20 seconds, tap "Update now" when the card appears (or swipe the app away and reopen it). Phone check, first line "Build", should match the `curl` time. The landing page is a separate site: `npm run landing:deploy`.

Optional shortcuts for `package.json`: `"check:all": "tsc -b && npm run lint && npm run i18n:check && npm run i18n:test"` and `"ship": "npm run check:all && npm run deploy:test"`.

## Testing on a real phone

A phone only allows the PIN, installing and offline use on HTTPS pages or `localhost`, so a plain `http://192.168...` address will not work. Two options: plug the phone in with USB debugging on, forward port 4173 in Chrome's `chrome://inspect` page, run `npm run build && npm run preview`, and open `http://localhost:4173` on the phone; or publish `dist` to a private Cloudflare Pages project for a real HTTPS address. The full checklist, including the glove protocol, is in `docs/DEVICE_TEST.md`. Fake data only until the Day 20 gate.

## Keep the free database awake

Free Supabase projects pause after about a week without activity. Prima calls `keepalive()` every 3 days from GitHub Actions (`.github/workflows/keepalive.yml`). In the GitHub repository open Settings, then Secrets and variables, then Actions, and add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the publishable key). Run the workflow once by hand from the Actions tab to confirm it is green. For a second, independent ping, a free uptime monitor can call the same function over HTTPS. Scheduled GitHub jobs can be late, and GitHub may switch them off after a long period without repository activity, so make an occasional commit. This lowers the chance of a pause; it does not remove it, and a paused project resumes from the Supabase dashboard with nothing lost.

## Security and clinical notes

- Row level security separates facilities, and the audit log is insert-only. Keep using fake data until the Day 27 gate.
- The PIN lock and the audit log are protections against casual access and against disputes. They are not encryption. Records on a signed-in phone are stored unencrypted in the browser's storage, so a phone with a strong screen lock and device encryption is the real protection. Teach staff to report a lost phone to the facility admin immediately.
- A removed staff member's phone keeps its local copy until it next connects. The app then locks and offers to erase it.
- The privacy notice, the patient notice wording and the staff agreement are templates. They must be reviewed by a lawyer or the facility's data protection officer before real use, together with how long records must be kept before any erasure.
- Permanent erasure is irreversible. It wipes identifying details and visit contents, keeps a marker so every phone receives the erasure, and is recorded in the audit log.
- Password reset by email does not work until custom mail is configured. A locked-out staff member is removed and re-invited by the admin.
- The device dashboard stores, per phone: a random id, a device name made from the browser, the app version, counts and times of waiting records, the battery level, and the name of the person who last used it. That is personal data about staff, not patients: say so in the privacy policy (Day 28), and decide how long an unused device stays on the list.
- Guardians' and patients' phone numbers and SMS consent are personal data. A reminder never goes to the next of kin and never contains a diagnosis.
- The Python service holds Supabase's secret key. It must live only in the server's settings, never in the app.
- A facility's plan comes from the database. The browser-storage testing switch works only in `npm run dev`. Only the patient cap and staff seats are enforced by the server; export, report and follow-up gates run on the device and can be bypassed by a technical user, so treat them as a product boundary, not a security one.
- Backups contain the full patient register. They are encrypted with the admin's password, and a forgotten password cannot be recovered by anyone. A backup taken before an erasure still contains that person, so delete old backups and do not keep them indefinitely. Restore never brings an erased patient back, but backups remain the facility's responsibility.
- Browsers can clear a site's storage if the phone runs low on space unless the site is granted persistent storage. Prima asks for it, but the browser decides; regular backups are the safety net.
- FHIR and DHIS2 files contain, or are derived from, identifiable health records. They are made on the phone and handed to a person; where they go next is the facility's responsibility. Prima's FHIR identifiers use `urn:prima:` names until the project has a web address of its own, and the vaccine codes use "unspecified formulation" entries where Prima records only a vaccine name, so a receiving system's owner should confirm the mapping.
- The ICD-10 list was checked for existence against a WHO ICD-10 dataset, but editions differ (for example dengue and haemorrhoids moved between editions) and a few three-character codes have finer sub-codes in the newest edition. Nigeria's national reporting rules decide what is required; confirm with a health worker or the state records officer before real use.
- Immunization intervals, vitals thresholds, follow-up rules, the ICD-10 list and the report groupings are simplified starting points. Confirm them with a health worker before real use.
- Before real PHC data, complete the Nigeria Data Protection Act and NDPC check planned for Day 27, and repeat it on Day 33. The waitlist (Day 34) collects names and contact details, which are personal data too: it needs its own privacy notice and consent from the day it opens.

## Facts for the LinkedIn post

- Problem: paper registers lose and duplicate patients; the LGA report is counted by hand; follow-ups depend on a nurse's memory; nobody can say who looked at a record.
- Origin: a public health graduate learning software engineering, building for PHCs.
- Pivot: started server-first, then rebuilt offline-first after seeing that network drops break clinic workflow.
- Numbers: 2 repos (1 reference, 1 product); 28 automated Python tests; about 330 ICD-10 conditions searchable in plain language; a 25-day roadmap.
- Day 14 headline: a PIN that works with no signal, an audit log that nobody can edit (not even an admin), and a "right to be forgotten" button that really reaches every phone. The log records which fields changed and which card, never a name or a diagnosis.
- Day 19 headline: a nurse can now register a patient from one screen with a handful of taps: sex, age, a village chip, a reason chip, Register. No one knows the birthday? It saves the age as an honest estimate and says so. And when the battery drops to 20%, Prima stops syncing in the background and goes dark and quiet, while every record is still saved at once.
- Day 18 headline: Prima now checks a nurse's complaint as she types ("hot body" is understood, "feaver" becomes a suggestion, a phone number typed by mistake gets a warning), prints a bank-card patient card with a QR, and keeps Save in reach on a small screen. The tap test from Day 16 now guides the button sizes.
- Day 17 headline: Prima can now speak the standards health systems use. A Pro facility can export its records as FHIR, with a mother's baby linked to her as a related person, and a monthly DHIS2 file. HIV and mental-health diagnoses stay out by default. The diagnosis list grew from 45 to about 330 conditions, and a test caught that a bigger list would have quietly undercounted antenatal visits.
- Day 16 headline: Prima now installs on an Android home screen and opens with no signal at all, straight to the PIN screen. Updates ask first instead of reloading under a nurse's thumb, and the app has a built-in tap test so gloves get measured, not guessed.
- Day 15 headline: the database now says no to the 201st free patient, but a nurse's patient is never lost: the record waits on the phone and uploads when the plan changes. Uploads travel in batches in dependency order, idle phones skip the server entirely, and backups are encrypted so a full register never sits in a chat as plain text.
- Lesson: security features should not live in each screen. The audit log is written by the same database hooks that already queue sync, so a change cannot happen without a record. And a PIN is a lock, not a vault, so say so.
- Learned: Python from zero, FastAPI dependencies and testing, Dexie hooks, transactions and live queries, offline-first design, Postgres row level security, security-definer functions, triggers, insert-only audit tables, PBKDF2 PIN hashing, offline-first authentication.
- Feedback loops so far: product feedback produced Para/Gravida and immunizations; a LinkedIn review produced the chief complaint field and the follow-up prefill; a commenter pushed for global standards; a UI critique produced the Day 4 redesign; a clinic-practice note produced glove mode; clinic-workflow feedback produced guardian links and SMS reminders.
