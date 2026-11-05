import { startReminderSync } from "./reminders";
import { startSync } from "./syncService";
import { requestPersistence } from "./storage";
import { isDemo } from "./demo";

let started = false;

// The background engines need a signed-in facility, so they start only after sign-in, and only once.
export function startEngines() {
  if (started || isDemo()) return; // practice mode never syncs
  started = true;
  startSync();
  startReminderSync();
  void requestPersistence();
}
