# Prima: pilot agreement with a clinic (DRAFT for the lawyer)

**Status: a draft written by the builder on 12 November 2026. It is not legal advice and it is not in force.** A Nigerian lawyer must review it before any clinic signs it. Lines marked `[LAWYER: ...]` are questions for that review. Lines marked `[FILL IN: ...]` are facts to supply for each clinic. It follows `docs/gate/NDPA.md`, `docs/gate/CLINICAL-SAFETY.md`, `PRIVACY-POLICY-DRAFT.md` and `TERMS-DRAFT.md`.

**No real patient data goes into Prima until this agreement is signed and every MUST box in the two gate documents is ticked.**

## 1. The parties

Prima, built and run by Chukwunonso Ofili from Enugu, Nigeria. `[LAWYER: What legal name and address must appear here?]`

The clinic: `[FILL IN: name of the primary health centre, address, LGA, state]`, represented by its officer in charge, `[FILL IN: name]`. `[LAWYER: Does the officer in charge have the power to sign for the clinic, or must the LGA or the owner sign as well?]`

## 2. What this agreement is

A pilot of four weeks, starting on `[FILL IN: date]`. It also holds the data terms (section 6) and the stop rules (section 7). The Terms of Use apply as well. `[LAWYER: How do this agreement and the Terms of Use fit together, and which one wins if they disagree?]`

## 3. What Prima gives the clinic

- Prima on the Pro plan, free for three months from the day the pilot starts. The free time does not renew by itself. A clinic that wants Pro after that pays the price in the Terms, and its paid time starts after the free time.
- A training session before anyone uses Prima.
- A support line, with answer times written in section 3 of `SUPPORT-LINE.md`. `[FILL IN: the times you can keep]`
- A check against the hazard log before any change to data entry, sync or reminders reaches the clinic.

## 4. What the clinic agrees to

1. Keep its paper register as it is for the four weeks, and count the paper register against Prima every week.
2. Send everyone who will use Prima to the training session, and let nobody use Prima for real until they have passed it (8 of 10).
3. Give each person their own account and PIN. Nobody shares a sign in. Remove a person who leaves. Report a lost or stolen phone at once.
4. Read the name and the age aloud before saving a patient.
5. Look at the sync badge at the start and at the end of every shift.
6. Report every incident, including a near miss, on the incident form.
7. Give feedback: the weekly count, the staff check-in and the end of week interview.
8. Enter no real patient until Prima has told the officer in charge, in writing, that the pilot has started.
9. Check its own registration with the Nigeria Data Protection Commission as a data controller, and keep it up to date. Prima does not register for the clinic. `[LAWYER: Is this wording enough? The 2024 notice put primary health centres in the lowest tier: please confirm today's tier and fee.]`
10. Use the English version of Prima.

## 5. The language

The pilot runs in English. The Igbo, Hausa and Yoruba versions are drafts, and are not used with real patients until native speakers have checked them. Clinical terms, such as ICD-10 codes and vaccine names, stay in English.

## 6. The data

**6.1 Roles.** The clinic is the data controller for its patients' data. Prima is the data processor for that data. Prima is the controller for its own data: staff accounts, sign in, billing, support and the website. `[LAWYER: Please confirm these roles.]`

**6.2 Purpose and instructions.** Prima uses patient data only to run the register, to sync and back it up, to sign people in, to take payment, to give support, and to meet legal duties. Prima follows the clinic's instructions.

**6.3 Confidentiality.** Everyone at Prima who can reach the data keeps it confidential. Every person at the clinic accepts a confidentiality statement the first time they sign in.

**6.4 Security.** The measures are in section 7 of the Privacy Policy. Records on the phone are protected by the PIN lock but are not encrypted on the phone itself. The clinic keeps a screen lock on every phone. `[LAWYER: How should this limit be worded in a contract?]`

**6.5 Other companies.** Prima uses Supabase, Cloudflare, Paystack and Resend. Prima will tell the clinic before it adds another company that can reach patient data. `[LAWYER: How much notice, and may the clinic object?]`

**6.6 Access by Prima.** Prima opens real patient data only when the clinic asks in writing, for example to fix a fault, and records that it did.

**6.7 If something goes wrong.** Prima tells the clinic within 24 hours of finding that personal data was lost, stolen or seen by someone who should not see it. The clinic, as controller, tells the Nigeria Data Protection Commission within 72 hours when people's rights are likely to be at risk.

**6.8 Patients' rights.** A patient who asks to see, correct or delete their data asks the clinic. Prima helps the clinic answer, and the request and the answer are recorded in the app. `[LAWYER: How fast must the clinic answer?]`

**6.9 Where the data is kept.** Prima's cloud database is hosted by Supabase in `[FILL IN: region]`. `[LAWYER: Which legal basis for the transfer outside Nigeria do we record?]`

**6.10 When the pilot ends.** The clinic receives an export of its data. Prima deletes its own copy `[FILL IN: within how many days]`. `[FILL IN: the retention schedule, decided with the clinics and the lawyer]`

**6.11 Checking.** The clinic may ask Prima for information that shows these terms are followed. `[LAWYER: How far does this go?]`

## 7. The stop rules

If any of these happens, the clinic stops using Prima, uses its paper register, and tells Prima the same day:

- a record is saved on the wrong patient;
- records are lost;
- a patient's information is seen by someone who should not see it.

Prima then tells the clinical safety lead the same day, and may pause the clinic's account. Prima restarts only after Prima and the clinical safety lead have looked at what happened, and the officer in charge has been told. A pause is not a breach of this agreement. It is how the agreement is meant to work.

## 8. Incidents and reviews

Prima keeps an incident log. The clinical safety lead, `[FILL IN: name]`, a qualified clinician who is not the builder, reads it once a month. The clinic receives a summary.

## 9. Feedback and a testimonial

The pilot offer is given in exchange for feedback and a testimonial. A testimonial is used only with the clinic's written permission (the form is in `FEEDBACK-TOOLS.md`). It never contains patient information, and the clinic may withdraw its permission at any time. `[LAWYER: Is it right to link the free months to a testimonial, and what if the clinic gives none?]`

## 10. Ending the pilot

Either side may end the pilot with `[FILL IN: how many days]` notice. A stop rule event that is not resolved allows the clinic to end it at once. Section 6.10 says what happens to the data.

## 11. Responsibility

`[LAWYER: Please write the limit of liability for a pilot. Clinical decisions stay with the clinicians. Please say how far that goes, and what insurance, if any, the builder needs.]`

## 12. The law that applies

The law of Nigeria. `[LAWYER: Which state's courts, and should disputes go first to mediation or arbitration?]`

## 13. Signatures

| For | Name | Date | Signature |
|---|---|---|---|
| Prima | | | |
| The clinic (officer in charge) | | | |
| The clinical safety lead (witness) | | | |

## Annex A: the people at the clinic who will use Prima

| Name | Role | Passed the training (date) |
|---|---|---|
| | | |
| | | |
| | | |

## Annex B: who to call

| For | Name | Phone |
|---|---|---|
| Prima support | `[FILL IN]` | `[FILL IN]` |
| The clinic's officer in charge | `[FILL IN]` | `[FILL IN]` |
| The clinical safety lead | `[FILL IN]` | `[FILL IN]` |
| Prima's data protection officer | `[FILL IN]` | `[FILL IN]` |
