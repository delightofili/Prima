# Prima: backup drill (about 20 minutes)

Do this once on the test version before the pilot, and again after any change to the backup code. A backup you have never restored is only a hope.

Words in bold are the words on the Prima screens. Fill in the table at the end.

## What you need

- One Android phone with Chrome, signed in to the **test** version of Prima.
- A second place to keep a file (your email or Google Drive).

## The drill: a phone that loses records that never reached the cloud

This is the real danger the backup button is for: records saved on the phone that never uploaded, on a phone that is then lost or cleared.

1. Turn on airplane mode.
2. Press **Register**. Register two patients called DRILL ONE and DRILL TWO. For DRILL ONE press **Record the visit** and save a visit.
3. Look at the sync badge. It should say **Offline**, with records **waiting to upload**.
4. Open **Account**, then **Backup and restore**. Press **Back up now**. A window called **Back up this register** opens. Type a password in **Password (8 or more characters)**, type it again in **Repeat the password**, and press **Create backup**.
5. You should see **Backup saved to your downloads** and a file name that ends in `.primabackup`. Write the password down on paper.
6. Keep a copy of the file somewhere else too (email it to yourself when you have internet).
7. Now lose the records on purpose: in Chrome open the site settings for the Prima address and choose Clear and reset. Prima is now empty on this phone.
8. Turn airplane mode off. Open Prima and press **Sign in**.
9. _Expected:_ DRILL ONE and DRILL TWO are not there. They never reached the cloud. This is the loss the backup protects against.
10. Open **Account**, then **Backup and restore**. Press **Restore**. In the window **Restore from a backup**, choose the **Backup file**, type the **Backup password**, and press **Check the backup**.
11. _Expected:_ a table with **Patients** and **Visits**. The **Added** column shows 2 patients and 1 visit.
12. Press **Restore now**. _Expected:_ the message **Backup restored. Uploading in the background.**
13. Open **Patients**. _Expected:_ DRILL ONE and DRILL TWO are back, and DRILL ONE has its visit.
14. Wait a minute. _Expected:_ the sync badge says **Synced**.

## Two quick extra checks

- Repeat steps 10 and 11 with a wrong password. _Expected:_ **Wrong password, or the file is damaged.** Nothing is restored.
- Repeat steps 10 and 11 with the right password again. _Expected:_ the button says **Nothing to restore**, because everything is already on the phone.

## Clean up

Press **Delete patient** on DRILL ONE and DRILL TWO. Do this on the test version only.

## It passes when

- both patients and the visit came back, and they uploaded;
- the wrong password was refused, with the message above;
- the whole drill took under 20 minutes and nobody needed to ask the builder anything.

## Record it

| Date | Who | Phone | Passed? | Minutes | What went wrong |
| ---- | --- | ----- | ------- | ------- | --------------- |
|      |     |       |         |         |                 |
|      |     |       |         |         |                 |

## Remember

The Free plan of the database has no backups you can restore from. Before any real patient data goes in, production needs the paid plan (daily backups), and the same drill must be done once against it. That is part of the Day 32 gate.
