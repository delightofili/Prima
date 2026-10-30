# Checking Prima's words in your language

Thank you for helping. This guide is for **native speakers of Igbo, Hausa or Yoruba** who are checking the words in Prima, a patient register that nurses and community health workers use in clinics across Nigeria. It takes about an hour. You do not need to know anything about computers.

## Why your help matters

A nurse reads these words many times a day. A word that is unnatural slows her down. A wrong word on a clinical screen can cause a mistake. A computer helped to write the first version, so it is a **draft**. You know how the words really sound in a clinic. Where you and the draft disagree, you are right.

Nothing in the spreadsheet is patient information. It only has the words on the screens.

## What you will get

A spreadsheet (a CSV file that opens in Excel or Google Sheets) with these columns:

| Column                | What it is                                                                    |
| --------------------- | ----------------------------------------------------------------------------- |
| `key`                 | The line's name inside the program. Do not change it.                         |
| `where_it_appears`    | Where on the phone you would see it.                                          |
| `english`             | The English sentence.                                                         |
| `current_translation` | What Prima says now in your language.                                         |
| `your_version`        | **You fill this.** Your better words, only if the current ones need a change. |
| `status`              | **You fill this.** `ok`, `change` or `unsure`.                                |
| `comment`             | **Optional.** Why, or a question.                                             |

## What to do with each row

1. Read the English and where it appears.
2. Read `current_translation`. Say it aloud as you would to a patient or a colleague.
3. Then choose one:
   - It is correct and natural: type `ok` in `status`.
   - It is wrong, stiff or confusing: type your better version in `your_version` and `change` in `status`.
   - You are not sure: type `unsure` in `status` and write what worries you in `comment`.

## Rules for your version

1. **Keep every `{blank}` exactly as it is.** For example `{count}` becomes a number and `{name}` becomes a person's name when the phone shows it. Move it where it fits the sentence, but do not change the letters or the curly brackets. Rows with a broken blank are rejected automatically.
2. **Do not translate names of conditions, complaints or medicines.** They stay in English on purpose, so reports look the same in every clinic. You will see a few English words inside sentences (for example "Plans", "CSV", "LGA", "Sync Doctor"). Leave them.
3. **Write the way people really speak in a clinic**, not like a textbook. Plain and short is better than correct and long: many of these words sit on buttons.
4. **Use the same word for the same thing everywhere.** If you change how "patient" or "upload" is said, tell us in a comment so we can fix every row.
5. **Use the proper letters and marks.** Igbo: ị ọ ụ ṅ. Hausa: ɓ ɗ ƙ ƴ and the apostrophe. Yoruba: ẹ ọ ṣ with the tone marks.
6. **Dialects.** Choose the form most clinics in your area would understand. If two forms are common, put the second one in a comment.
7. Hausa and Yoruba sentences should not point to a man or a woman unless the English does.

## Check these words first

The same words appear on many screens. If one is wrong here, it is wrong in many places. Please check them before the rest.

### Igbo

| English                               | Prima says                                          | Is it right? Better word? |
| ------------------------------------- | --------------------------------------------------- | ------------------------- |
| Patients                              | Ndị ọrịa                                            |                           |
| Register (button)                     | Debanye aha                                         |                           |
| Register and add visit                | Debanye aha ma tinye nleta                          |                           |
| Record the visit                      | Dekọọ nleta                                         |                           |
| Date of birth                         | Ụbọchị amụrụ                                        |                           |
| Reason for visit                      | Ihe kpatara ọbịbịa                                  |                           |
| Village or area                       | Obodo ma ọ bụ mpaghara                              |                           |
| Female                                | Nwanyị                                              |                           |
| Male                                  | Nwoke                                               |                           |
| Pregnant now                          | Ọ dị ime ugbu a                                     |                           |
| Next of kin                           | Onye ikwu kacha nso                                 |                           |
| Parent or guardian                    | Nne, nna ma ọ bụ onye na-elekọta                    |                           |
| Synced                                | E bulitela                                          |                           |
| Syncing…                              | Na-ebulite…                                         |                           |
| Sync now                              | Bulite ugbu a                                       |                           |
| Offline                               | Enweghị ịntanetị                                    |                           |
| {count} need attention                | {count} chọrọ nlekọta                               |                           |
| Everything is in the cloud (sentence) | Ihe niile dị n'ekwentị a dị n'igwe ojii.            |                           |
| Low Battery Mode                      | Ọnọdụ batrị dị ala                                  |                           |
| Sign out                              | Pụọ                                                 |                           |
| Account                               | Akaụntụ                                             |                           |
| Dashboard                             | Nchịkọta                                            |                           |
| Invite code                           | Koodu oku                                           |                           |
| The Free plan is full (sentence)      | Atụmatụ efu juru. Lee Plans iji tinye ndị ọrịa ọzọ. |                           |

### Hausa

| English                               | Prima says                                                | Is it right? Better word? |
| ------------------------------------- | --------------------------------------------------------- | ------------------------- |
| Patients                              | Marasa lafiya                                             |                           |
| Register (button)                     | Yi rajista                                                |                           |
| Register and add visit                | Yi rajista kuma ƙara ziyara                               |                           |
| Record the visit                      | Rubuta ziyara                                             |                           |
| Date of birth                         | Ranar haihuwa                                             |                           |
| Reason for visit                      | Dalilin zuwa                                              |                           |
| Village or area                       | Ƙauye ko yanki                                            |                           |
| Female                                | Mace                                                      |                           |
| Male                                  | Namiji                                                    |                           |
| Pregnant now                          | Tana da ciki yanzu                                        |                           |
| Next of kin                           | Dangi na kusa                                             |                           |
| Parent or guardian                    | Iyaye ko mai kula                                         |                           |
| Synced                                | An daidaita                                               |                           |
| Syncing…                              | Ana daidaitawa…                                           |                           |
| Sync now                              | Daidaita yanzu                                            |                           |
| Offline                               | Babu intanet                                              |                           |
| {count} need attention                | {count} suna buƙatar kulawa                               |                           |
| Everything is in the cloud (sentence) | Duk abin da ke wannan waya yana gajimare.                 |                           |
| Low Battery Mode                      | Yanayin batir ƙasa                                        |                           |
| Sign out                              | Fita                                                      |                           |
| Account                               | Asusu                                                     |                           |
| Dashboard                             | Taƙaitawa                                                 |                           |
| Invite code                           | Lambar gayyata                                            |                           |
| The Free plan is full (sentence)      | Tsarin kyauta ya cika. Duba Plans don ƙara marasa lafiya. |                           |

### Yoruba

| English                               | Prima says                                       | Is it right? Better word? |
| ------------------------------------- | ------------------------------------------------ | ------------------------- |
| Patients                              | Àwọn aláìsàn                                     |                           |
| Register (button)                     | Forúkọsílẹ̀                                       |                           |
| Register and add visit                | Forúkọsílẹ̀ kí o sì fi àbẹ̀wò kún un               |                           |
| Record the visit                      | Ṣe àkọsílẹ̀ àbẹ̀wò                                 |                           |
| Date of birth                         | Ọjọ́ ìbí                                          |                           |
| Reason for visit                      | Ìdí àbẹ̀wò                                        |                           |
| Village or area                       | Abúlé tàbí agbègbè                               |                           |
| Female                                | Obìnrin                                          |                           |
| Male                                  | Ọkùnrin                                          |                           |
| Pregnant now                          | Ó lóyún báyìí                                    |                           |
| Next of kin                           | Ẹbí tó sún mọ́ jù                                 |                           |
| Parent or guardian                    | Òbí tàbí olùtọ́jú                                 |                           |
| Synced                                | A ti gbé e sókè                                  |                           |
| Syncing…                              | Ń gbé sókè…                                      |                           |
| Sync now                              | Gbé sókè báyìí                                   |                           |
| Offline                               | Kò sí íntánẹ́ẹ̀tì                                  |                           |
| {count} need attention                | {count} nílò àbójútó                             |                           |
| Everything is in the cloud (sentence) | Gbogbo ohun tó wà lórí fóònù yìí wà ní àwọsánmà. |                           |
| Low Battery Mode                      | Ipò bátìrì kéré                                  |                           |
| Sign out                              | Jáde                                             |                           |
| Account                               | Àkáǹtì                                           |                           |
| Dashboard                             | Àkópọ̀                                            |                           |
| Invite code                           | Kóòdù ìpè                                        |                           |
| The Free plan is full (sentence)      | Ètò ọ̀fẹ́ ti kún. Wo Plans láti fi aláìsàn kún un. |                           |

## Lines to read most carefully

Misunderstanding these could make a nurse think records are lost, or leave a patient uninformed. Please read them slowly:

- Anything that says records are **safe on this phone** (keys starting `sync.` and `syncErr.`).
- The **privacy notice** lines (`register.noticeTitle`, `register.noticeHelp`).
- The **Low Battery Mode** lines (`power.`).
- The lines that **remove a person from the team** (`team.removeTitle`, `team.removeMessage`).
- The **error messages** under boxes (keys starting `err.`).

## When you are done

Save the spreadsheet as **CSV (UTF-8)** if you can, or share the Google Sheet. Send it back by WhatsApp or email. Please say:

- your name and how you would like to be thanked (or that you prefer not to be named), and
- whether you work in health care and, if so, where (a general answer is fine).

---

## For the developer (not for the reviewer)

1. `npx tsx scripts/i18n-export.ts ig` (or `ha`, `yo`) makes `review/<language>-review.csv`.
2. Send the CSV and this guide to the reviewer.
3. When it comes back, save it in `review/` and check what would change: `npx tsx scripts/i18n-import.ts ig review/ig-reviewed.csv`
4. Apply it: add `--write`. Read `review/<language>-questions.md` for the lines marked `unsure`.
5. `npm run i18n:check` and `npm run i18n:test`, then test the language on a phone.
6. Mark a language `reviewed` in `src/i18n/languages.ts` only when at least one native speaker has been through **every** line, and a health worker who uses that language daily has read the safety lines above. For Hausa and Yoruba, aim for two reviewers.
