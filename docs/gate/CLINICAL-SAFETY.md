# Prima: clinical safety gate

Written 4 November 2026 for the Day 27 gate. It follows the idea behind clinical risk management for health software (list what could go wrong, rate it, say what prevents it, and name who accepts what is left), kept small enough for a one person project. **It is a draft by the builder. A qualified clinician must review and sign it.** The builder is not that person.

**The rule:** no real patient data in Prima until every `MUST` box here and in `NDPA.md` is ticked. Run `npm run gate` to see what is still open.

## 1. What Prima is, and what it is not

**Intended use.** Prima is a patient register and visit record for primary health centres. It helps staff register patients, record visits, vitals and vaccines, find a patient again, see who is due, and report counts to the LGA. It works with no internet.

**Prima is not** a diagnostic tool, it does not choose a treatment or a dose, and it does not replace a clinician's judgement. Where it flags a value (a vital sign outside its range, a vaccine due) that is a prompt for the clinician, never an instruction. The clinician stays responsible for every clinical decision.

The intended-use statement above is shown to every user at first sign-in (onboarding wizard) and printed in the officer guide.

## 2. How risks are rated

Severity (S): 1 no harm, 2 minor, 3 delay or repeat care, 4 wrong or missed care likely to harm, 5 death or permanent harm. Likelihood (L): 1 rare, 2 unlikely, 3 possible, 4 likely, 5 very likely. **Risk = S x L** after the controls already in Prima.

- 6 or less: accepted, watched during the pilot.
- 7 to 12: **a named action before the pilot** (a `MUST` below).
- more than 12: blocks the pilot.

All the numbers below are the builder's first estimate. The clinician corrects them.

## 3. Hazard log

| ID  | What could go wrong                                                 | Harm                                        | What Prima already does                                                                                                                                                                                                                                 | S   | L   | Risk | Action                                                                         |
| --- | ------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | ---- | ------------------------------------------------------------------------------ |
| H1  | The wrong patient is opened and a visit or vaccine is saved on them | wrong history, a missed or repeated vaccine | search by name, phone and guardian; card number and printed QR; age and guardian shown on the patient page                                                                                                                                              | 4   | 2   | 8    | Training: read the name and age aloud. Count wrong-patient events in the pilot |
| H2  | The same child is registered twice                                  | split history, repeated or missed vaccine   | the exact-match warning runs on the phone; the "similar name" warning now also runs on the phone (the same scoring as the Python service), so it works with no internet and on every plan; the service is a second source online; the merge tool is Pro | 3   | 2   | 6    | none now. Watch in the pilot                                                   |

| H3 | A wrong age or date of birth | wrong vaccine schedule shown | age or date entry with checks; age shown on every screen | 4 | 3 | 12 | Check the age against the child's card at registration (training). Watch it in the pilot |
| H4 | A vital sign typed wrongly (36.5 as 365 or 96.5) | a danger sign missed or invented | steppers instead of free typing; range limits; a value flagged outside its range with words, not only colour | 4 | 2 | 8 | Confirm the ranges with the clinician |
| H5 | A vaccine recorded wrongly or twice | a child believed protected, or over-vaccinated | the schedule checklist; a date is required; the audit log shows who recorded it | 4 | 2 | 8 | Check that the same vaccine and dose cannot be saved twice for one child. Fix if it can |
| H6 | The reminders list is read as proof that families were told | a defaulter is not followed up | nothing is sent yet; screens say "list", not "sent" | 3 | 3 | 9 | Say so in training. When sending is built, show delivery status first |
| H7 | A reminder reaches the wrong person or tells others about a visit | privacy harm | explicit consent; the guardian's phone; the plan is no clinical detail in a message | 3 | 2 | 6 | Not live. Review before sending is built |
| H8 | Records are lost before they are uploaded (phone lost, broken or cleared) | history gone, care repeated | an upload queue and "waiting to upload" counts; the Devices tab shows who is behind; an encrypted backup; sync between phones; a changes file | 4 | 3 | 12 | Pilot routine: check "waiting to upload" every shift, a backup every week, the Devices tab every week |
| H9 | A sync replaces a newer entry with an older one | an old value shown | the newest change wins; phones more than 10 minutes apart refuse to sync; the cloud rejects an older copy | 3 | 2 | 6 | Known limit: a phone whose clock is set far behind has its cloud edits ignored (see H10) |
| H10 | A phone's clock is wrong | wrong visit dates, reminders off, its edits ignored | the phone measures its own clock against the server whenever there is a connection, remembers it offline, and warns the person from 5 minutes out, with the fix steps; the Devices tab shows the admin too; phones more than 10 minutes apart refuse to sync with each other | 3 | 2 | 6 | none now |

| H11 | A draft translation misleads a nurse | a button or instruction misread | English is the default; Igbo, Hausa and Yoruba are drafts; clinical terms (ICD-10, vaccine names) stay in English | 3 | 3 | 9 | No local-language use with real patients until the native-speaker review is done, or pilot in English |
| H12 | An unauthorised person sees records (a shared or stolen phone) | privacy harm, stigma | PIN lock and automatic lock; roles; the audit log; remove a person or phone; the clinic key changes when someone is removed | 4 | 2 | 8 | Records on the phone are not encrypted at rest (see NDPA R1). Training and the lost phone sheet |
| H13 | A record is erased by mistake, or an erased record comes back | lost history, or a rights breach | erasing asks for confirmation and is logged; an erasure always wins over sync | 3 | 1 | 3 | none |
| H14 | A Free clinic reaches 200 patients | a new child cannot be registered, OR (now) a patient exists only on one phone until an upgrade | registering is never blocked; a notice from 180 patients says how many places are left, and past 200 says new patients are saved on this phone only and asks for a backup; the database parks the upload and its visits until an upgrade; pilot clinics are on Pro | 4 | 2 | 8 | A patient past the limit lives on one phone until an upgrade (see H8): back up weekly, and upgrade a clinic that passes 200 |
| H15 | The app crashes while a visit is being typed | the visit is not saved, the work is repeated or lost | a crash screen that says saved records are safe and what to tap | 3 | 2 | 6 | **Check:** are unsaved forms kept as drafts? If not, build it |
| H16 | A printed card is wrong or its QR cannot be read | the wrong patient on a scan | the card number is printed beside the QR | 3 | 2 | 6 | Check that a scan shows name and age before anything is saved |
| H17 | Counts in the LGA, DHIS2 or FHIR export are wrong | wrong public health decisions | the exports are tested; counts are shown in the app | 3 | 2 | 6 | Compare one month with the paper register in the pilot |
| H18 | No battery, no signal, or an update that fails during clinic | care with no record | works offline; Low Battery Mode; the update is the person's choice | 2 | 4 | 8 | A paper fallback in the officer guide |
| H19 | A payment lapse takes features away in the middle of clinic | exports unavailable | seven days of patience; records always stay; clear messages | 2 | 2 | 4 | none |
| H20 | Staff treat a flag or a check as clinical judgement | a missed diagnosis | none beyond the wording | 4 | 2 | 8 | Intended-use statement at first sign-in and in the guide. No screen wording that sounds like advice |

## 4. What must be true before the pilot

- [ ] MUST: A named clinical safety lead, a qualified clinician who is not the builder, has read this log, corrected the ratings, and signed section 6. Name: **\*\***\_\_\_\_**\*\***.
- [ ] MUST: H14 is decided and done: a clinic can always register a patient at the point of care.
- [ ] MUST: H2 is decided: duplicate warnings at registration work on every plan.
- [ ] MUST: H15 is answered: unsaved registration and visit forms are kept as drafts, or this is built.
- [ ] MUST: H10 is decided: the phone warns when its clock is far from the server's.
- [ ] MUST: H5 is answered: the same vaccine and dose cannot be saved twice for one child.
- [ ] MUST: H16 is answered: a scan shows name and age before anything is saved.
- [ ] MUST: The intended-use statement is shown at first sign-in.
- [ ] MUST: Igbo, Hausa and Yoruba are used with real patients and staff only after the native-speaker review, or the pilot runs in English.
- [ ] MUST: **The pilot runs a paper register in parallel for the first four weeks**, and the two are counted against each other every week.
- [ ] MUST: Stop rules are agreed with each clinic: a wrong-patient event, lost data or a privacy incident pauses Prima at that clinic until it is reviewed.
- [ ] MUST: An incident log exists (what happened, how serious, what was done) and is read once a month by the clinical safety lead.
- [ ] MUST: Every clinic has had the training session: what Prima is not, read the name and age aloud, check "waiting to upload" every shift, the lost phone sheet.
- [ ] SHOULD: One month of exports is compared with the paper register (H17).
- [ ] SHOULD: This log is reviewed after every release that changes data entry, sync or reminders.

## 5. Pilot safeguards

1. **Shadow mode.** For the first four weeks the clinic keeps its paper register as before. Prima is the second record. Each week, someone counts patients, visits and vaccines in both and writes the difference.
2. **Stop rules.** See above. A pause is not a failure: it is the plan working.
3. **Every incident is written down,** even a near miss, and read at the monthly review.
4. **Change control.** No change to data entry, sync or reminders goes to a pilot clinic without re-reading the hazards it touches.

## 6. Sign-off

| Role                                       | Name | Date | Signature |
| ------------------------------------------ | ---- | ---- | --------- |
| Builder                                    |      |      |           |
| Clinical safety lead (qualified clinician) |      |      |           |
| First pilot clinic, officer in charge      |      |      |           |
