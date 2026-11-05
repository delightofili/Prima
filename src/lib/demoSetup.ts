import { db } from "../db";
import { readLocal, writeLocal } from "./auth";
import { setCurrentFacility } from "./config";
import { DEMO_ACCOUNT, DEMO_FACILITY, isDemo, leaveDemo } from "./demo";
import { seedConsent, seedDemo, seedDuplicates, seedFamilies } from "./devSeed";

// Called once before the app is drawn. In practice mode it makes sure the practice database has a made-up nurse and clinic
// (so the app opens straight in, with no sign-in) and some made-up patients. In normal mode it does nothing at all.
export async function prepareDemo(): Promise<void> {
  if (!isDemo()) return;
  setCurrentFacility(DEMO_FACILITY); // in memory only: config.ts keeps nothing on disk, so this cannot overwrite the real facility
  try {
    if (!(await readLocal())) await writeLocal(DEMO_ACCOUNT, DEMO_FACILITY);
    if ((await db.patients.count()) === 0) {
      await seedDemo(40);
      await seedFamilies();
      await seedDuplicates(3);
      await seedConsent();
    }
  } catch {
    /* the practice opens with whatever could be made: registering a practice patient still works */
  }
}

// Delete the practice data and start the practice again from nothing (the practice database is the only thing touched)
export async function restartPractice(
  reload: () => void = () => window.location.reload(),
): Promise<void> {
  try {
    await db.delete();
  } finally {
    reload();
  }
}

// Delete the practice data, switch practice mode off, and go back to the real app
export async function leavePractice(go?: () => void): Promise<void> {
  try {
    await db.delete();
  } finally {
    leaveDemo(go);
  }
}
