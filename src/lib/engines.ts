import { startReminderSync } from "./reminders";
import { startSync } from "./syncService";
import { requestPersistence } from "./storage";

let started = false;

// The background engines need a signed-in facility, so they start only after sign-in, and only once.
export function startEngines() {
  if (started) return;
  started = true;
  startSync();
  startReminderSync();
  void requestPersistence();
}
