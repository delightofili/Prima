# Prima: Privacy Policy (DRAFT for the lawyer)

**Status: a draft written by the builder on 10 November 2026. It is not legal advice and it is not in force.** A Nigerian data protection lawyer or a licensed Data Protection Compliance Organisation (DPCO) must review it before any real patient data goes into Prima. Lines marked `[LAWYER: ...]` are questions for that review. Lines marked `[FILL IN: ...]` are facts the builder still has to supply. It is built from `docs/gate/NDPA.md`. If the two disagree, fix both.

## 1. Who we are and how to reach us

Prima is an offline patient register for primary health centres in Nigeria. It is built and run by Chukwunonso Ofili from Enugu, Nigeria. `[LAWYER: Prima is not a registered company yet. Which legal name and address must appear here, and should Prima be registered as a business before the pilot?]`

Contact: hello@primahealth.com.ng

Data protection officer: `[FILL IN: name, email and phone. If it is the builder at first, write why they have the knowledge, and consider an outside DPCO.]`

## 2. Two different roles

| Who | Role | Why |
|---|---|---|
| Each clinic (primary health centre) | Data controller for its patients' data | It decides why and how patients are recorded |
| Prima | Data processor for patient data | It stores, syncs and backs the data up for the clinic, on the clinic's instructions |
| Prima | Data controller for its own data | Staff accounts, sign in, billing, support and the website |

If you are a patient, your clinic decides what is recorded about you. Ask the clinic first. Prima helps the clinic answer you.

`[LAWYER: Please confirm these roles, and write them into the agreement between Prima and each clinic.]`

## 3. What we hold

| Data | Examples | Where it is kept | Who can see it |
|---|---|---|---|
| Patient identity | name, sex, age or date of birth, phone, community, card number | the clinic's phones, and the cloud database | staff of that clinic |
| Visits | complaints, vital signs, diagnosis (ICD-10 code), notes | the clinic's phones, and the cloud database | staff of that clinic |
| Vaccines | vaccine, date, dose | the clinic's phones, and the cloud database | staff of that clinic |
| Guardians and children | guardian name and phone, relationship, SMS consent | the clinic's phones, and the cloud database | staff of that clinic |
| Reminders | due date and status (nothing is sent yet) | the clinic's phones, and the cloud database | staff of that clinic |
| Staff accounts | name, email address, role | the sign in service | the clinic's administrator and Prima |
| Audit log | who did what, and when | the cloud database | the clinic's administrator |
| Device reports | a device label (it includes the staff name), counts, battery level, app version. No patient data | the cloud database | the clinic's administrator |
| Backups, changes files and sync codes | patient data, locked with a passphrase or the clinic key | wherever the clinic puts them | whoever holds the file and the key |
| Billing | payment reference, amount, plan, Paystack customer code | the cloud database and Paystack | the clinic's administrator and Prima |
| Crash log | an error message with numbers, ids and email addresses removed | the phone only | the person who copies it |

Health information is sensitive personal data. Many patients are children.

**What we do not collect:** a national identity number, a bank verification number, a photo or any biometric. We collect what a paper register already holds.

## 4. Why we use it, and on what basis

- To run the register: record patients, visits and vaccines, and find a patient again.
- To keep the data safe and available: sync between phones, back up, and restore.
- To sign staff in and keep accounts secure, including by email.
- To take payment for a paid plan.
- To give support and fix problems.
- To meet our legal duties.

`[LAWYER: For each use above, which lawful basis applies? For patient data the clinic is the controller and chooses the basis. For staff and billing data Prima is the controller. Please also advise on consent, and on how a clinic proves it.]`

## 5. Who else handles data

| Company | What it does for us | What it can see | Where `[FILL IN]` |
|---|---|---|---|
| Supabase | the cloud database, sign in, server functions | everything stored in the cloud, including patient data | `[FILL IN: the production region from Supabase, Project Settings, General. The test project is in Ireland.]` |
| Cloudflare | serves the app's files, the website and the domain name. It also forwards mail sent to hello@primahealth.com.ng | internet addresses and the pages asked for. No patient data | `[FILL IN]` |
| Paystack | takes payments | the paying administrator's email address and the amount. Prima never holds card numbers | `[FILL IN]` |
| Resend | sends the sign in emails (confirmation and password reset) | the email address and the code or link in the message | Ireland |
| GitHub | keeps the program code | code only. A secret in the code would change this, so we check for that | not applicable |
| An SMS provider | not chosen, and sending is not built | not applicable | `[FILL IN: add it here before it is used]` |
| A name matching service | not used. Names are compared on the phone | not applicable | not applicable |

We will update this policy before we start using any new company or any new kind of data.

`[LAWYER: Which data processing terms must we accept or obtain from each company above, and keep on file?]`

## 6. Data leaving Nigeria

Prima's cloud database is hosted by Supabase in `[FILL IN: region]`. Resend sends email from Ireland.

`[LAWYER: If the data is stored outside Nigeria, which legal basis for the transfer do we record? What must the clinic agreement and this notice say?]`

## 7. How we protect data

- Records are on the clinic's phones first. The app works with no internet.
- A PIN lock, an automatic lock, and roles for administrators and staff.
- Every person has their own account. Staff must not share a sign in.
- The cloud database lets a clinic reach only its own records. We check this with a test before every release.
- Connections are encrypted. Secret keys stay on the server, never in the app.
- Backups and changes files are locked with a passphrase.
- An administrator can remove a person or a phone. The clinic key then changes.
- An audit log records who did what.
- A log of crashes keeps no patient details, and stays on the phone.

**What is not yet protected:** records on the phone are protected by the PIN lock but are not encrypted on the phone itself. A lost phone is therefore a risk. Clinics must keep a screen lock on, and report a lost phone at once. We plan to encrypt local data in future.

`[LAWYER: How should this limit be worded in a notice that patients and clinics will read?]`

## 8. How long we keep data

- Records stay until the clinic erases them, or leaves Prima.
- A record that has been erased stays erased. A later sync cannot bring it back.
- When a clinic leaves, it receives an export of its data, and Prima deletes its own copy.
- A crash log is never sent unless a person copies it.

`[FILL IN: the retention schedule, decided with the clinics and the lawyer. How long are records kept, and how long are backups, the audit log, billing records and staff accounts kept after a clinic stops?]`

`[LAWYER: Which retention periods does Nigerian health or tax law require?]`

## 9. Your rights

You may ask to see your data, correct it, delete it, object to how it is used, or receive a copy that you can move. The law calls these access, correction, erasure, objection and portability.

- **Patients:** ask the clinic. The clinic uses the data requests screen in Prima, and writes down the request and the answer.
- **Staff and administrators:** write to hello@primahealth.com.ng.
- We will check who you are before we act. `[LAWYER: How fast must we answer? Please set the time limit.]`

If you are unhappy, you may complain to the Nigeria Data Protection Commission (ndpc.gov.ng).

## 10. Children

Many patients are children. We collect only what the register needs. When SMS reminders exist, consent for a child under 18 will come from a parent or guardian, and it will be explicit, separate from other consent, and recorded with the date and who recorded it. Nothing is sent today.

`[LAWYER: Please review the wording of the SMS consent and of this section before any message is sent.]`

## 11. If something goes wrong

If personal data is lost, stolen or seen by someone who should not see it, Prima will tell the clinic within 24 hours. The clinic, as controller, tells the Nigeria Data Protection Commission within 72 hours when people's rights are likely to be at risk. If the risk is high, the people affected are told, in plain words.

`[LAWYER: Please confirm that this split of duties is right.]`

## 12. The website, the app and email

- The website has no cookies, no analytics and no advertising. It loads nothing from other companies.
- The app keeps its settings on your phone only, such as your language and PIN lock details. It does not track you.
- Sign in emails are sent by Resend. We keep its click tracking and open tracking switched off.

## 13. Changes

We will change this policy when we start collecting new data or using a new company. We will say what changed and when.

*Questions to settle before this is published: see `QUESTIONS-FOR-THE-LAWYER.md`.*
