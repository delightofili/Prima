# Prima: data protection gate (Nigeria Data Protection Act 2023)

Written 4 November 2026 for the Day 27 gate. **This is a working document by the builder, not legal advice.** A Nigerian data protection lawyer or a licensed Data Protection Compliance Organisation (DPCO) must review it before any real patient data goes into Prima.

**The rule:** no real patient data in Prima until every `MUST` box in this file and in `CLINICAL-SAFETY.md` is ticked, `npm run gate -- --strict` passes, and `supabase/gate.sql` shows no FAIL. Until then only demo and test data are used.

Run `npm run gate` to see how many boxes are still open.

## 1. What the law asks, in plain words

These points come from law firm summaries of the Act and of the NDPC's guidance (Legal 500, Mondaq, LexMundi, PwC, BusinessDay), read on 4 November 2026. The section numbers are the ones those summaries give. **Read the originals at ndpc.gov.ng before relying on any number.**

| Topic                                    | What it says                                                                                                                                 | What it means for Prima                                                                                                                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Health data                              | Health data is _sensitive personal data_, with stricter rules than ordinary data                                                             | Everything a clinic records about a patient is in this class                                                                                                                                                           |
| Lawful basis (s.24, s.25)                | Fair, lawful, transparent, limited to a stated purpose, no more data than needed. Bases include consent, legal obligation, public interest   | Collect only what the register needs. Write the basis down for each use                                                                                                                                                |
| Consent (s.26)                           | The controller must be able to prove consent was freely given                                                                                | Record who consented, when, and to what                                                                                                                                                                                |
| Children (s.31)                          | Consent for a child under 18 comes from a parent or guardian                                                                                 | The SMS consent for a child must be the guardian's                                                                                                                                                                     |
| Data protection impact assessment (s.28) | Needed where processing is likely to be high risk, and filing it with the NDPC before processing may be required                             | Section 7 below is the draft. Ask the lawyer whether it must be filed                                                                                                                                                  |
| Data protection officer (s.32)           | Organisations of major importance must appoint one with expert knowledge                                                                     | Name one (section 5)                                                                                                                                                                                                   |
| Rights (s.34 to 38)                      | Access, correction, deletion, objection, portability                                                                                         | The in-app data requests (Day 14) must be answered by a written procedure                                                                                                                                              |
| Breach (s.40)                            | Tell the NDPC within **72 hours** of becoming aware of a breach likely to risk people's rights. Tell the people affected if the risk is high | Section 8 is the plan                                                                                                                                                                                                  |
| Registration (s.44)                      | Controllers and processors of _major importance_ register with the NDPC                                                                      | The NDPC's 2024 guidance notice names the health sector. The 2025 directive (GAID) changed some registration rules, so **confirm the current tier, fee and deadline for Prima and for each clinic on the NDPC portal** |
| Fines (s.48)                             | For major importance organisations, the higher of ₦10,000,000 or 2% of the previous year's gross revenue                                     | The cost of getting this wrong                                                                                                                                                                                         |
| Old rules                                | The 2019 regulation (NDPR) still applies where it does not conflict with the Act                                                             | Ask the DPCO which parts still matter                                                                                                                                                                                  |

## 2. Who is who

| Party                | Role                                       | Why                                                                                                        |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Each clinic (PHC)    | **Data controller** for its patients' data | It decides why and how patients are recorded                                                               |
| Prima (the business) | **Data processor** for patient data        | It stores, syncs and backs it up for the clinic, on the clinic's instructions                              |
| Prima (the business) | **Data controller** for its own data       | Staff accounts, sign-in, billing, support, the website                                                     |
| Supabase             | Sub-processor                              | Database, sign-in, server functions. **Region to confirm** (Supabase dashboard, Project Settings, General) |
| Cloudflare           | Sub-processor                              | Serves the app's files. Sees IP addresses. No patient data                                                 |
| Paystack             | Sub-processor (payments)                   | Sees the paying admin's email and the amount. Prima never holds card                                       |
| numbers              | The matching service (Python)              | Sub-processor, only if `VITE_PYTHON_API_URL` is set                                                        | When online, receives the name of the patient being registered and the names of patients with the same date of birth (names and local ids, nothing else). **Host to confirm.** Leave the address empty and no name ever leaves the phone |
| GitHub               | Not a processor of personal data           | Code only. A secret in the code would change that: the gate checks for it                                  |
| An SMS provider      | Not chosen yet                             | Sending is not built. It must be added to this table before it is used                                     |

- [ ] MUST: These roles are written into the clinic agreement (section 4) and a lawyer has confirmed them.

## 3. What data Prima holds (record of processing)

| Data                               | Examples                                                                          | Where                         | Who can see it                     | Sensitive                |
| ---------------------------------- | --------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------- | ------------------------ | ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Patient identity                   | name, sex, age or date of birth, phone, community, card number                    | phone storage, Supabase       | staff of that clinic               | yes, in a health setting |
| Visits                             | complaints, vitals, diagnosis (ICD-10), notes                                     | phone storage, Supabase       | staff of that clinic               | yes (health)             |
| Vaccines                           | vaccine, date, dose                                                               | phone storage, Supabase       | staff of that clinic               | yes (health)             |
| Guardians and children             | guardian name and phone, relationship, SMS consent                                | phone storage, Supabase       | staff of that clinic               | yes, children under 18   |
| Reminders                          | due date, status (nothing is sent yet)                                            | phone storage, Supabase       | staff of that clinic               | yes                      |
| Staff accounts                     | name, email, role                                                                 | Supabase sign-in              | the clinic admin, Prima            | no                       |
| Audit log                          | who did what, and when                                                            | Supabase                      | the clinic admin                   | no, but it names staff   |
| Device reports                     | device label (includes staff name), counts, battery, app version. No patient data | Supabase                      | the clinic admin                   | no                       |
| Backups, changes files, sync codes | patient data, locked with a passphrase or the clinic key                          | wherever the clinic puts them | whoever holds the file and the key | yes                      |
| Billing                            | payment reference, amount, plan, Paystack customer code                           | Supabase, Paystack            | the clinic admin, Prima            | no                       |
| Crash log                          | an error message with numbers, ids and emails removed                             | stays on the phone            | the person who copies it           | no                       | Resend | Sub-processor | Sends the sign-in emails (confirmation and password reset). Receives the person's email address and the code or link. **Contract and region to confirm** (Ireland, eu-west-1). |

Update this table after every build day that adds data.

## 4. Contracts and notices

- [ ] MUST: A data processing agreement template (Prima and a clinic), signed by each pilot clinic before it enters real data. It states: purpose, that Prima follows the clinic's instructions, staff confidentiality, security measures, the sub-processors above, that Prima tells the clinic of a breach within 24 hours so the clinic can meet its 72 hours, what happens to the data when the clinic leaves (the clinic gets an export, Prima deletes its copy), and the right to audit.
- [ ] MUST: The Supabase, Cloudflare and Paystack data processing terms are accepted or obtained and kept on file.
- [ ] MUST: The in-app privacy notice and the SMS consent wording are reviewed by the lawyer or DPCO **in English**. Only after that are they translated into Igbo, Hausa and Yoruba, and the translations checked by native speakers.
- [ ] MUST: SMS consent is explicit, separate from other consent, recorded with the date and who recorded it, and for a child under 18 it comes from a parent or guardian.
- [ ] MUST: Every user accepts a confidentiality statement at first sign-in (this is in the onboarding wizard).
- [ ] MUST: Decide about the matching service: either its host is written in the table above and its terms are accepted, or `VITE_PYTHON_API_URL` is left empty so the phone does all the matching itself.

## 5. Registration and people

- [ ] MUST: Check on the NDPC portal whether Prima must register as a data processor of major importance (the health sector is named in the 2024 notice). Register if so, and write down the date and the reference.
- [ ] MUST: Each pilot clinic is told in writing that it must check its own NDPC registration as a controller. Prima does not register for it. (The 2024 notice put primary health centres in the lowest tier: confirm today's tier and fee.)
- [ ] MUST: A data protection officer is named for Prima, with name, email and phone written here: **\*\***\_\_\_\_**\*\***. If it is the founder at first, write why they have the knowledge, and consider an outside DPCO.
- [ ] SHOULD: Plan the yearly compliance audit by a licensed DPCO. Ask what the current filing deadline is.
- [ ] SHOULD: A 30 minute session with every pilot clinic: what is confidential, the PIN lock, what to do with a lost phone.

## 6. Security and rights

- [ ] MUST: `supabase/gate.sql` shows no FAIL, and every REVIEW line has been read and written down as fixed or accepted, with the reason.
- [ ] MUST: `npm run gate -- --strict` passes.
- [ ] MUST: In Supabase Authentication: email confirmation is on, passwords are at least 8 characters, and the redirect addresses list only Prima's own.
- [ ] MUST: A backup is restored on a test phone and the patient counts match (the app's own backup and restore).
- [ ] MUST: A one page "lost or stolen phone" instruction for clinics: the admin removes the person and the phone (this also changes the clinic key), and tells the clinic's officer in charge.
- [ ] MUST: A written procedure for patient requests (access, correction, deletion): who answers, how identity is checked, how fast (set the time limit with the lawyer), and where each request and answer is recorded.
- [ ] MUST: Where Supabase keeps the data is written down. If it is outside Nigeria, the lawyer records which legal basis for the transfer is used (the Act allows transfers on stated bases, such as adequate protection or safeguards like contract clauses), and the clinic agreement and privacy notice say so.
- [ ] MUST: A retention schedule is decided with the clinics and the lawyer: how long records are kept, and what happens when a clinic stops using Prima.
- [ ] SHOULD: Review this file again at Day 33, and after any feature that collects new data (SMS sending, the Python service).

## 7. Impact assessment (draft)

**What is processed:** patient identity, visits, vaccines, guardians and reminders of people who come to primary health centres, many of them children. **Why:** a register that works without internet, so each clinic keeps better records and can report to the LGA. **Scale at the pilot:** 2 to 3 clinics. **Scale planned:** up to 500 users in two months.

**Is it necessary and proportionate?** Prima asks for no national ID, BVN, photo or biometric. It collects what a paper register already holds.

| #   | Risk to patients                                          | Controls now                                                                                                             | What remains                                                                                                                                              |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | A lost or stolen phone exposes records                    | PIN lock and automatic lock, roles, remove the person and the phone, the clinic key changes when someone is removed      | **Records on the phone are not encrypted at rest** (browser storage). The PIN protects them, not encryption. Medium risk. Future work: encrypt local data |
| R2  | Staff look at records they have no reason to see          | roles, the audit log, records limited to the clinic, training                                                            | Medium. Audit is only useful if someone reads it: set a monthly review                                                                                    |
| R3  | Cloud database leak or mistake                            | row level security on every table, `supabase/gate.sql`, secrets only on the server, the service key never in the app     | Low if the gate stays green. Re-run it after every database change                                                                                        |
| R4  | Interception while phones sync                            | encrypted connections, a shared clinic key proves who is who, codes hold no patient data, changes files are locked (AES) | Low                                                                                                                                                       |
| R5  | Data kept longer than needed                              | erasure that wins over sync, the retention schedule (to write)                                                           | Open until the schedule exists                                                                                                                            |
| R6  | A child's data processed without a guardian's consent     | guardian consent for SMS, minimal child data                                                                             | Open until consent wording is reviewed                                                                                                                    |
| R7  | A reminder reaches the wrong person (when sending exists) | explicit consent, the guardian's phone, no clinical detail in a message                                                  | Not live yet: review before sending is built                                                                                                              |
| R8  | Data stored outside Nigeria                               | the region is disclosed, the processing terms are accepted                                                               | Open until the transfer basis is recorded                                                                                                                 |
| R9  | Wrong records harm care                                   | see `CLINICAL-SAFETY.md`                                                                                                 | see there                                                                                                                                                 |
| R10 | Support or the developer sees real data                   | no routine access, the service key stays on the server, admin actions are logged                                         | Rule: the developer opens real patient data only on a clinic's written request                                                                            |
| R11 | Payment details leak                                      | Prima stores no card data, Paystack does                                                                                 | Low                                                                                                                                                       |
| R12 | Crash or debug data leaks                                 | scrubbed, kept on the phone, sent only when a person copies it                                                           | Low. A name inside an error message cannot be removed automatically                                                                                       |

- [ ] MUST: The impact assessment is read and corrected by the DPO and the lawyer, and the lawyer says whether it must be filed with the NDPC before processing begins.

## 8. If there is a breach (the 72 hour clock)

A breach is any loss, theft, leak or unauthorised access of personal data, including a lost phone with records on it.

| When                              | What                                                                                                                                                               | Who                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| At once                           | Write down the time you learned of it. Contain it: remove the person or phone, change the clinic key, rotate any exposed secret, take a function offline if needed | whoever finds it, then the DPO |
| Within 1 hour                     | Tell the DPO                                                                                                                                                       | everyone                       |
| Within 24 hours                   | Find out what data, whose, how many people, and whether it is likely to put them at risk. **Tell the affected clinic's officer in charge**                         | DPO                            |
| Within 72 hours of becoming aware | **If a risk to people's rights is likely, the controller (the clinic) notifies the NDPC.** Prima prepares the notice with the clinic                               | DPO and the clinic             |
| Without delay                     | If the risk is high, tell the people affected, in plain words                                                                                                      | the clinic, helped by Prima    |
| Afterwards                        | Write what happened, what was done, and what changes. Add it to the incident log                                                                                   | DPO                            |

Contacts to fill in before the pilot: NDPC (from ndpc.gov.ng): **\_\_\_\_** ; DPO: **\_\_\_\_** ; lawyer: **\_\_\_\_** ; Supabase support: **\_\_\_\_** ; each clinic's officer in charge: **\_\_\_\_** .

Incident log columns: date and time known, who found it, what data and how many people, cause, what was done, who was told and when, what changes.

- [ ] MUST: The contact list above is filled in.
- [ ] MUST: One drill is done: pretend a phone with records is lost and a secret was exposed, walk through the table above, and write down how long each step took.

## 9. Sign-off

| Role                                     | Name | Date | Signature |
| ---------------------------------------- | ---- | ---- | --------- |
| Builder (controller of Prima's own data) |      |      |           |
| Data protection officer                  |      |      |           |
| Lawyer or DPCO who reviewed this         |      |      |           |
| First pilot clinic, officer in charge    |      |      |           |

## Sources read (4 November 2026)

Health Ethics and Law Consulting, "Nigeria Data Protection Act 2023: Relevant Provisions for Health Care Delivery in Nigeria" (Legal 500, April 2024). Law firm summaries of the 2025 General Application and Implementation Directive and of the Act (Mondaq, LexMundi, PwC regulatory alert August 2023, BusinessDay). They are summaries: the Act, the NDPC guidance notice and the directive are the authorities.
