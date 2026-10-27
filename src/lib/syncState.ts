// One place that decides what the sync badge, the banner and the Sync Doctor say, so they can never disagree.
export type SyncStateId =
  | "synced"
  | "offline"
  | "signin"
  | "schema"
  | "working"
  | "paused"
  | "attention"
  | "upgrade"
  | "cloud-down"
  | "retrying"
  | "waiting";

export interface SyncInput {
  online: boolean;
  cloudOk: boolean; // signed in to the cloud on this phone
  powerActive: boolean; // Low Battery Mode is on
  waiting: number; // records not yet uploaded (not counting the ones that need attention)
  failed: number; // records that need attention, including those parked by the plan limit
  parked: number; // of the failed, how many are waiting for a plan upgrade
  schemaProblem: string | null;
  working: boolean; // an upload or download is running right now
  failures: number; // consecutive network failures
  nextRetryAt: number | null;
  now: number;
}

export interface SyncState {
  id: SyncStateId;
  label: string; // short, for the badge
  detail: string; // a sentence, for the panel and the Doctor
  tone: "ok" | "busy" | "calm" | "attention";
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export function describeSync(i: SyncInput): SyncState {
  const saved = i.waiting + i.failed;

  if (!i.online) {
    return {
      id: "offline",
      label: saved > 0 ? `Offline · ${saved} saved` : "Offline",
      detail:
        "There is no internet. Everything you record is saved on this phone and uploads by itself when the connection is back.",
      tone: "calm",
    };
  }
  if (!i.cloudOk) {
    return {
      id: "signin",
      label: "Sign in to sync",
      detail:
        "Prima is not signed in to the cloud on this phone, so nothing uploads. Records are safe on this phone.",
      tone: "attention",
    };
  }
  if (i.schemaProblem) {
    return {
      id: "schema",
      label: "Database update needed",
      detail:
        "The cloud database is missing something this version of Prima needs, so some records cannot upload. They are safe on this phone. Your admin should run the latest SQL, then tap Retry.",
      tone: "attention",
    };
  }
  if (i.working)
    return {
      id: "working",
      label: "Syncing…",
      detail: "Uploading and downloading now.",
      tone: "busy",
    };
  if (i.powerActive && i.waiting > 0) {
    return {
      id: "paused",
      label: `Paused · ${i.waiting} waiting`,
      detail:
        "Low Battery Mode has paused syncing. Tap Sync now, plug in, or switch it off.",
      tone: "calm",
    };
  }
  const other = i.failed - i.parked;
  if (other > 0) {
    return {
      id: "attention",
      label: `${other} need${other === 1 ? "s" : ""} attention`,
      detail: `${plural(other, "record could", "records could")} not be uploaded after several tries. They are safe on this phone. Open Sync details.`,
      tone: "attention",
    };
  }
  if (i.parked > 0) {
    return {
      id: "upgrade",
      label: `${i.parked} waiting for upgrade`,
      detail: `${plural(i.parked, "patient is", "patients are")} saved on this phone but not uploaded, because the Free plan is full.`,
      tone: "calm",
    };
  }
  if (i.failures >= 3 && i.waiting > 0) {
    return {
      id: "cloud-down",
      label: `Cloud not reachable · ${i.waiting} waiting`,
      detail:
        "Prima cannot reach the cloud right now. Everything is saved on this phone and uploads by itself when it can.",
      tone: "calm",
    };
  }
  if (i.waiting > 0) {
    const secs = i.nextRetryAt
      ? Math.max(0, Math.ceil((i.nextRetryAt - i.now) / 1000))
      : 0;
    if (secs > 0)
      return {
        id: "retrying",
        label: `Retrying in ${secs} s · ${i.waiting} waiting`,
        detail: "A record could not upload and will be tried again shortly.",
        tone: "calm",
      };
    return {
      id: "waiting",
      label: `${i.waiting} waiting to upload`,
      detail: "These will upload in the next few seconds.",
      tone: "busy",
    };
  }
  return {
    id: "synced",
    label: "Synced",
    detail: "Everything on this phone is in the cloud.",
    tone: "ok",
  };
}
