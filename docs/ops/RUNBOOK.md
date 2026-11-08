# Prima operations runbook

Updated 7 November 2026. Owner: Chuwkunonso Ofili. Keep this file short and true. Never write a secret in it.

## 1. The two environments

|                    | Staging (test)                                                | Production                                                     |
| ------------------ | ------------------------------------------------------------- | -------------------------------------------------------------- |
| App                | https://prima-test-axo.pages.dev (Pages project `prima-test`) | https://app.primahealth.com.ng (Pages project `prima-app`)     |
| Landing page       |                                                               | https://primahealth.com.ng (Pages project `prima-landing-cut`) |
| Database           | Supabase project "Prima", ref `uofscztdvhaqbrqinwzj`          | Supabase project "prima-production", ref `__________`          |
| Payments           | Paystack test, its webhook points here                        | Paystack test until Day 34, then live                          |
| Data               | made-up patients only                                         | real patients only after the gate is passed                    |
| Deploy             | `npm run deploy:test`                                         | `npm run deploy:prod`                                          |
| Settings file      | `.env.local`                                                  | `.env.prod.local`                                              |
| Keep-alive secrets | `SUPABASE_URL`, `SUPABASE_ANON_KEY`                           | `PROD_SUPABASE_URL`, `PROD_SUPABASE_ANON_KEY`                  |

Two rules. Never put a real patient into staging. Never try something new on production.

## 2. Where every secret lives (names only)

| Secret                                                                                   | Lives in                                                         | Notes                                                  |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| Supabase database password                                                               | password manager                                                 | reset it in the Supabase dashboard                     |
| Supabase anon key                                                                        | `.env.prod.local`, the GitHub secret, and the app itself         | public by design; row-level security protects the data |
| Supabase service_role key                                                                | inside Supabase only                                             | never in a file, a `VITE_` variable, GitHub, or a chat |
| Paystack secret key                                                                      | Supabase function secret `PAYSTACK_SECRET_KEY` (one per project) | roll it in the Paystack dashboard if it ever leaks     |
| Accounts: GitHub, Cloudflare, Supabase, Whogohost, Paystack, and the email used for them | password manager                                                 | two-step login ON for every one                        |

Anything starting with `VITE_` is copied into the app that everyone downloads. A secret must never start with `VITE_`.

## 3. Deploying

- Staging: `npm run deploy:test`, then `npm run verify:deploy`.
- Production: `npm run deploy:prod` (it asks you to type DEPLOY PRODUCTION), then `npm run verify:deploy -- https://app.primahealth.com.ng` and `npm run verify:prod`.
- Landing page: in the `landing` folder, `npm run build`, `npm run check`, `npx wrangler pages deploy dist --project-name prima-landing-cut --branch main`, then `npm run verify:prod -- --landing`.
- A database change: write the SQL file, run it on staging, run `supabase/gate.sql`, run it on production, then run `supabase/inventory.sql` on both and compare with `npm run schema:diff -- staging.csv production.csv`. It must say IDENTICAL.
- Order: database first, app second. New app code must never meet an old database.

## 4. Rolling back

- The app: Cloudflare, Workers & Pages, `prima-app`, Deployments, pick the previous one, Rollback. Phones pick it up at their next hourly check, or the next time they open the app.
- The database: the Free plan has no backups. Pro keeps daily backups for 7 days (Supabase dashboard, Database, Backups). So test every change on staging first.

## 5. If something breaks

| What people see                   | Look at                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Nobody can sign in                | Supabase status page. Is the project paused? Authentication, URL configuration: is the Site URL still `https://app.primahealth.com.ng`? |
| Records are not uploading         | The banner on the phone, the Devices tab, the keep-alive runs. Patients "waiting for an upgrade" are the Free limit, not a fault        |
| A payment did not change the plan | Supabase, Edge Functions, `paystack-webhook` logs. Is the webhook address in Paystack right? Is `APP_URLS` right?                       |
| An old version keeps showing      | `npm run verify:prod`: is `sw.js` stored? On the phone: Account, App version, Update now                                                |
| The project says "paused"         | Supabase dashboard, Restore project. Then check the keep-alive secrets                                                                  |
| The address does not load         | Cloudflare: is the domain Active? Pages, Custom domains: is it Active? Whogohost: has the domain expired (renews 7 November 2027)?      |

While any of this is broken, phones keep working offline. Records are safe on the phone and upload later.

## 6. If personal data may have been seen by the wrong person

1. Stop it: rotate the keys, switch off the account, take the page down.
2. Write down what happened, when, who is affected, and what data it was.
3. The 72-hour clock to the data protection regulator starts when you learn of it. Follow the breach plan in `docs/gate/NDPA.md`.
4. Tell the affected clinics.
5. Add a line to the log below.

| Date | What happened | Who was affected | What was done | Closed |
| ---- | ------------- | ---------------- | ------------- | ------ |
|      |               |                  |               |        |

## 7. Backups and the restore drill

Four things protect the data: every phone keeps its own copy; the cloud copy; the daily backups on Pro; and the encrypted backup file made in the app. The drill proves they work. Do it before go-live, then every month.

1. On staging with test patients: Account, Backup, make a backup file. Write down the number of patients (N).
2. Open the app in a private window (an empty phone). Sign in and wait. Is the count N? That tests the cloud copy.
3. Open another private window, go offline, then Account, Restore from the file. Is the count N?
4. Try a wrong passphrase. It must be refused.
5. Rebuild from files: create a scratch Supabase project, run `supabase/schema.sql`, the day files and `supabase/permissions.sql`, then compare with `supabase/inventory.sql`. It must say IDENTICAL.

| Date | Who | What was tested | Result | Minutes it took |
| ---- | --- | --------------- | ------ | --------------- |
|      |     |                 |        |                 |

## 8. Every month (15 minutes)

- Both keep-alive jobs are green (GitHub, Actions).
- The uptime monitor shows no incidents.
- `npm audit`, and `npm run gate -- --strict`.
- Supabase: any unusual sign-ups? Database size against the plan.
- The restore drill, if it is due.
- The domain renewal date and the card used for Supabase.

## 9. People

| Role                                                       | Name  | Phone | Email |
| ---------------------------------------------------------- | ----- | ----- | ----- |
| Owner                                                      | Nonso |       |       |
| A second person who can reach the accounts in an emergency |       |       |       |
| Lawyer or data protection adviser                          |       |       |       |
| Clinical reviewer                                          |       |       |       |
