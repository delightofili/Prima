# Prima: Terms of Use (DRAFT for the lawyer)

**Status: a draft written by the builder on 10 November 2026. It is not legal advice and it is not in force.** A Nigerian lawyer must review it before any clinic accepts it. Lines marked `[LAWYER: ...]` are questions for that review. Lines marked `[FILL IN: ...]` are facts the builder still has to supply. It follows `docs/gate/NDPA.md` and `docs/gate/CLINICAL-SAFETY.md`.

## 1. What Prima is, and what it is not

Prima is a patient register and visit record for primary health centres. It helps staff register patients, record visits, vital signs and vaccines, find a patient again, see who is due, and report counts to the Local Government Area (LGA). It works with no internet.

**Prima is not** a diagnostic tool. It does not choose a treatment or a dose. It does not replace a clinician's judgement. When Prima flags a value, such as a vital sign outside its range or a vaccine that is due, that is a prompt for the clinician and never an instruction. **The clinician stays responsible for every clinical decision.**

## 2. Who these terms are between

These terms are between the clinic that uses Prima (the clinic) and Prima. Prima is built and run by Chukwunonso Ofili from Enugu, Nigeria. `[LAWYER: What legal name, address and registration must appear here?]`

The person who accepts these terms for the clinic must be allowed to do so, for example the officer in charge. `[LAWYER: Is a signed paper agreement needed for each clinic, as well as acceptance in the app?]`

## 3. Accounts and roles

- Each person has their own account. Nobody shares a sign in or a PIN.
- Every person accepts a confidentiality statement the first time they sign in.
- An administrator adds and removes staff and phones. Removing someone also changes the clinic key.
- The clinic must remove a person who leaves, and must report a lost phone to an administrator at once.

## 4. What the clinic is responsible for

- Training its staff, including what is confidential, the PIN lock, and what to do with a lost phone.
- Checking each patient's name, age and card against what Prima shows before saving a visit or a vaccine.
- Keeping a screen lock on every phone. Records on the phone are not encrypted on the phone itself.
- Backing up on a regular routine, and checking each shift that nothing is waiting to upload for long.
- Keeping its own paper register alongside Prima during the pilot (four weeks).
- Checking its own registration with the Nigeria Data Protection Commission (NDPC) as a data controller. Prima does not register for the clinic.

## 5. Plans and payment

| Plan | Price a month | Price a year | What it includes |
|---|---|---|---|
| Free | free | free | a limited plan. The cloud copy holds up to 200 patients |
| Basic | ₦2,500 | ₦25,000 | unlimited patients, CSV export, the LGA report, offline sync, 3 staff accounts |
| Pro | ₦5,000 | ₦50,000 | everything in Basic, plus a follow up due list, a reminder queue (sending is coming, not live), duplicate merge, FHIR and DHIS2 export, and more staff accounts |

- Payment is taken by Paystack. Prima never holds card numbers.
- **Registration is never blocked.** If a clinic goes past its plan, a patient can still be registered at the visit. The clinic is marked over plan and is shown an upgrade message.
- If a payment lapses, the clinic has seven days before its plan changes. Its data is not deleted.
- Prices are in naira. `[LAWYER: Do prices include VAT? What is the refund and cancellation rule?]`
- `[FILL IN: the price for the pilot clinics. The pilot clinics are on the Pro plan.]`

## 6. The clinic's data

- The patient data belongs to the clinic. The clinic is the controller. Prima is the processor and follows the clinic's instructions.
- Prima does not sell patient data, share it for advertising, or look at it in the ordinary course of work.
- Prima opens real patient data only when a clinic asks in writing, for example to fix a fault, and logs that it did.
- The clinic can export its data at any time.
- When a clinic leaves, it gets an export, and Prima deletes its own copy `[FILL IN: within how many days?]`.
- The details are in the Privacy Policy and in the data processing agreement (Annex A).

## 7. Using Prima properly

The clinic and its staff will not:

- use Prima to harm anyone,
- try to reach another clinic's records,
- try to break or overload the service,
- share sign ins,
- enter data they have no right to enter.

## 8. Availability and changes

- Prima is built to work with no internet, so a poor connection does not stop registration.
- The cloud copy, sync and email depend on other companies and on the internet. Prima does not promise that they will always be available. `[LAWYER: What availability wording is fair for a pilot, and later?]`
- Prima may change or improve the service, and will tell clinics about changes that matter.
- A phone whose clock is wrong can have its changes ignored. The app warns when a clock is more than five minutes out. Set the date and time to automatic.

## 9. Languages

English is the default. The Igbo, Hausa and Yoruba versions are drafts until native speakers have checked them. Clinical terms, such as ICD-10 codes and vaccine names, stay in English. A clinic that uses a draft translation with real patients does so knowing this. `[LAWYER: Should this be a term, or a notice in the app?]`

## 10. The pilot

The pilot is with two or three clinics. No real patient data goes in until the data protection and clinical reviews are done. The clinic keeps its paper register for four weeks. Either side may stop the pilot with `[FILL IN: how many days]` notice.

## 11. Suspending or ending the service

Prima may suspend an account that breaks these terms or puts other people's data at risk. The clinic may stop at any time. Section 6 says what happens to the data.

## 12. Limits on what Prima is responsible for

`[LAWYER: Please write the limit of liability, and what happens when Prima's service fails. Prima is not responsible for a clinical decision. Please say how far that goes, and what insurance, if any, the builder needs.]`

## 13. Changes to these terms

Prima will tell clinics before a change to these terms starts, and a clinic that does not agree may stop using Prima. `[LAWYER: How much notice?]`

## 14. The law that applies

These terms are governed by the law of Nigeria. `[LAWYER: Which state's courts, and should disputes go first to mediation or arbitration?]`

## 15. Contact

hello@primahealth.com.ng

## Annex A: what the data processing agreement must cover

For the lawyer. It is a MUST item in `docs/gate/NDPA.md`, and each pilot clinic signs it before any real data goes in.

1. The purpose of the processing, and that Prima follows the clinic's instructions.
2. Confidentiality of staff.
3. The security measures (see the Privacy Policy, section 7).
4. The list of sub-processors: Supabase, Cloudflare, Paystack and Resend.
5. That Prima tells the clinic of a breach within 24 hours, so the clinic can meet its own 72 hours.
6. What happens to the data when the clinic leaves: the clinic gets an export, and Prima deletes its copy.
7. The clinic's right to audit.

*Questions to settle before this is used: see `QUESTIONS-FOR-THE-LAWYER.md`.*
