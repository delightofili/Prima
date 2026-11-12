# Prima: feedback tools for the pilot

*Status: a draft written by the builder on 12 November 2026.* These are the tools that make the safety rules in `docs/gate/CLINICAL-SAFETY.md` real: the weekly count, the incident log, and the stop rules. Print the forms. Keep the logs as the CSV files next to this document.

## 1. The weekly count: paper against Prima

*Why:* for four weeks the paper register is the main record and Prima is the second one. Counting them against each other is how we find out whether Prima can be trusted.

*When:* every Friday, after clinic, by the officer in charge or someone they choose, with the builder (in person or by phone).

*How:*

1. Count the new patients, the visits and the vaccine doses written in the paper register this week.
2. Count the same three things recorded in Prima this week. `[CHECK ON A PHONE: which screen gives each number most easily. The Activity per day chart on the Overview tab of the Dashboard, or the list on Patients.]`
3. Write both numbers, and the difference, in the table. Write why, if you know. "I don't know" is a good answer. Write it.
4. Send the table to the builder. It contains no patient names. It contains only numbers.

| Week starting | Patients on paper | Patients in Prima | Visits on paper | Visits in Prima | Vaccine doses on paper | Vaccine doses in Prima | Why they differ |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

*What happens next:* any difference that nobody can explain is read by the clinical safety lead. A difference in vaccine doses is always read, even if explained. `[DECIDE with the clinical safety lead: the number of unexplained differences that pauses Prima at a clinic]`

## 2. The incident form

*An incident is anything that went wrong, or nearly went wrong,* even if nobody was harmed. A near miss is the most useful kind: it costs nothing and teaches a lot. Nobody is blamed for reporting.

*Do not write a patient's name.* If the record must be found, write the card number.

| Question | Answer |
|---|---|
| Date and time | |
| Clinic | |
| Your role (not your name) | |
| What happened, in your own words | |
| On which screen | |
| What did you do? | |
| Was a patient affected? How? | |
| Was it caught before the patient was harmed? | |

### How serious is it

| Level | What it is | What happens |
|---|---|---|
| A: stop | A record saved on the wrong patient, records lost, or a privacy incident | *The stop rule.* Prima is paused at this clinic, the clinic uses paper, and the builder and the clinical safety lead are told the same day. Prima restarts only after they have looked at it together and the officer in charge has been told |
| B: near miss or error | A mistake caught before harm, a wrong value corrected, a sync problem that was fixed | Written in the log, and read at the monthly review |
| C: trouble using it | Confusing words, slow screens, a button hard to press | Written in the issues log |

## 3. The logs

- `pilot-incident-log.csv`: every level A and B incident. The clinical safety lead reads it once a month.
- `pilot-issues-log.csv`: every problem and wish, of any size.
- `weekly-count.csv`: the numbers from section 1, one row for each clinic and week.

Keep them in a private folder, not in the code repository. They hold no patient names, but they are about patients' care.

## 4. Staff check-in (5 questions, after week 1 and after week 4)

Ask each person on their own. Write the answers in their words.

1. How easy was it to register a patient? (1 hard to 5 easy) What was hard?
2. Did you ever not know what a button or a word meant? Which one?
3. Did Prima ever slow you down at the desk? When?
4. Did you ever feel unsure whether something was saved? When?
5. What is one thing you would change first?

## 5. The end of week interview (the officer in charge, 20 minutes)

1. Tell me about a day when Prima helped.
2. Tell me about a day when it got in the way.
3. Did the paper register and Prima ever disagree? What did you do?
4. Did anyone use Prima in a way we did not expect?
5. Were there days nobody used it? Why?
6. How did the sync badge look at the start and at the end of each shift?
7. Did a phone get lost, broken, or very slow?
8. What do patients and families say or ask when they see the screen?
9. Would you stop the pilot, continue it, or widen it? Why?
10. What should we have told you at the training that we did not?

## 6. What we measure (for Days 34 to 36)

| What | Where it comes from |
|---|---|
| Patients registered each week | The weekly count |
| Difference between paper and Prima | The weekly count |
| Incidents, by level | The incident log |
| Problems and wishes, by clinic and screen | The issues log |
| Staff who say registering is easy (4 or 5 out of 5) | The staff check-in |
| Days nobody used Prima | The end of week interview |
| Support messages and how fast they were answered | The support line |

## 7. Permission for a testimonial

*The pilot offer is Pro free for three months, in exchange for feedback and a testimonial.* A testimonial needs the clinic's written permission. It never contains patient information.

> We, [FILL IN: clinic name], allow Prima to quote the words below, with our clinic's name and the role of the person who said them, on its website and in its posts. The quote will not mention any patient. We may withdraw this permission at any time by writing to hello@primahealth.com.ng, and Prima will remove the quote from places it controls.
>
> The words: ______________________________________________
>
> Officer in charge: ______________________  Date: ____________
