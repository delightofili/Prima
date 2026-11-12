# Prima: first visit to a clinic (onboarding script)

*Status: a draft written by the builder on 12 November 2026. About 2 hours and 30 minutes, including the training session.*

This is for the builder. It says what to bring, what to do in order, what to say, and what not to do.

## The rule that comes first

*No real patient is entered at this visit.* Real data starts only after the pre-flight check (Day 32) says go, every MUST box in `docs/gate/NDPA.md` and `docs/gate/CLINICAL-SAFETY.md` is ticked, and the clinic's agreement is signed. If any of that is not true, this visit is for setting up and training with practice patients only, and you tell the officer in charge so.

## Before you go (the day before)

- [ ] The signed pilot agreement for this clinic (`docs/legal/PILOT-AGREEMENT-DRAFT.md`, after the lawyer has read it).
- [ ] Printed: quick cards (one for each person, and two spare), the lost or stolen phone page, the training sheet, the sign in table, the weekly count sheet, the incident form.
- [ ] Your own phone and a charger, with the test version of Prima ready, and mobile data for yourself.
- [ ] The officer in charge's email address, and an email address for each person who will use Prima.
- [ ] You know how many phones the clinic has, and who is the admin.
- [ ] You told the officer in charge to keep the paper register as it is.

## At the clinic

| Minutes | What you do |
|---|---|
| 0 to 10 | Greet the officer in charge. Explain what will happen. Ask who the facility admin will be. Say again that the paper register stays for four weeks |
| 10 to 25 | *Create the clinic.* On the admin's phone press **Create account**, then type **Your name**, **Email** and **Password**. An email arrives with a code. Type it and press **Confirm email**. On **Set up your facility** press **Create a facility**, type the **Facility name** and the **Facility code**, and press **Create facility**. Read the welcome, tick the confidentiality box and press **Start using Prima** |
| 25 to 35 | *Set the admin's PIN.* **Account**, then **Security**, then **Change PIN**. The PIN is 6 digits. Check the phone's own screen lock is on. Check the date and time are on automatic |
| 35 to 50 | *Add the staff.* **Account**, then **Team**, then **Create invite code**. Press **Share on WhatsApp**. Each person signs up, presses **Join with a code**, types the **Invite code** and presses **Join facility**. Each person sets their own PIN. Nobody shares a phone sign in |
| 50 to 60 | *Install it.* On each phone, **Account**, then **Install Prima**. Open it from the home screen. Check it works with airplane mode on |
| 60 to 120 | *The training session.* Follow `TRAINING-SHEET.md`, with practice patients only |
| 120 to 135 | *Close.* Collect the signed table. Pin the quick card by the paper register. Agree the first week (see below). Give them the support number. Ask: "What worries you?" Write the answer down |
| 135 to 150 | *Tidy up.* **Leave practice mode** on every phone. Check that no practice patient is in the real register. Check the sync badge on every phone |

## Give the clinic its pilot offer (the builder does this, on the dashboard)

In the Supabase SQL Editor of the *production* project, first find the clinic's id:

```sql
select id, name, code from public.facilities order by created_at desc limit 20;
```

Then give it Pro free for three months (copy the id from the row above):

```sql
select public.grant_pilot('PASTE-THE-ID-HERE');
```

- *You should see:* `{"ok":true,"until":"..."}`.
- If you see `"reason":"pilot_full"`, five clinics already have the offer. The sixth is refused. Stop and decide.
- If you see `"reason":"unknown_facility"`, the id was copied wrongly.
- The offer does not renew by itself. A clinic that wants to keep Pro after three months pays, and its paid time starts after the free time.

## The first week (agree it before you leave)

| When | What happens |
|---|---|
| Day 1 | The clinic starts only if the go message has been sent in writing. The builder phones at the end of the day. Ask: "How many patients today? What went wrong? What was confusing?" |
| Day 3 | A message check: "Is the sync badge fine at every shift?" |
| Day 7 | Count the week together: patients, visits and vaccines, on paper and in Prima (see `FEEDBACK-TOOLS.md`). Write the difference. Hold the first review |

## What not to do

- Do not enter a real patient at this visit.
- Do not take a photo of a screen that shows a patient, and do not let anyone send you one.
- Do not promise a feature. Say "we will look at it" and write it down.
- Do not fix a problem silently. Every problem goes in the issues log, even a small one.
- Do not leave without the signed table and the name of the facility admin.

## Before you leave: a last check

- [ ] The clinic exists and every person has their own account and PIN.
- [ ] Every phone has Prima installed and has been used offline once.
- [ ] Every phone is out of practice mode.
- [ ] The training table is signed, and everyone scored at least 8 of 10.
- [ ] The paper register is on the desk, and the quick card is pinned beside it.
- [ ] The officer in charge has the support number and the stop rules in writing.
- [ ] The first week is agreed, and the pilot offer is recorded.
