// One place that decides what the sync badge, the banner and the Sync Doctor say, so they can never disagree.
// It returns messages (keys and numbers), not sentences: the screen turns them into the person's language.
import type { Msg } from "../i18n";

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
  label: Msg; // short, for the badge
  detail: Msg; // a sentence, for the panel and the Doctor
  tone: "ok" | "busy" | "calm" | "attention";
}

export function describeSync(i: SyncInput): SyncState {
  const saved = i.waiting + i.failed;

  if (!i.online) {
    return {
      id: "offline",
      label:
        saved > 0
          ? { key: "sync.offlineSaved", params: { count: saved } }
          : { key: "sync.offline" },
      detail: { key: "sync.offlineDetail" },
      tone: "calm",
    };
  }
  if (!i.cloudOk)
    return {
      id: "signin",
      label: { key: "sync.signin" },
      detail: { key: "sync.signinDetail" },
      tone: "attention",
    };
  if (i.schemaProblem)
    return {
      id: "schema",
      label: { key: "sync.schema" },
      detail: { key: "sync.schemaDetail" },
      tone: "attention",
    };
  if (i.working)
    return {
      id: "working",
      label: { key: "sync.working" },
      detail: { key: "sync.workingDetail" },
      tone: "busy",
    };
  if (i.powerActive && i.waiting > 0) {
    return {
      id: "paused",
      label: { key: "sync.paused", params: { count: i.waiting } },
      detail: { key: "sync.pausedDetail" },
      tone: "calm",
    };
  }
  const other = i.failed - i.parked;
  if (other > 0) {
    return {
      id: "attention",
      label: { plural: "sync.attention", count: other },
      detail: { plural: "sync.attentionDetail", count: other },
      tone: "attention",
    };
  }
  if (i.parked > 0) {
    return {
      id: "upgrade",
      label: { key: "sync.upgrade", params: { count: i.parked } },
      detail: { plural: "sync.upgradeDetail", count: i.parked },
      tone: "calm",
    };
  }
  if (i.failures >= 3 && i.waiting > 0) {
    return {
      id: "cloud-down",
      label: { key: "sync.cloudDown", params: { count: i.waiting } },
      detail: { key: "sync.cloudDownDetail" },
      tone: "calm",
    };
  }
  if (i.waiting > 0) {
    const secs = i.nextRetryAt
      ? Math.max(0, Math.ceil((i.nextRetryAt - i.now) / 1000))
      : 0;
    if (secs > 0) {
      return {
        id: "retrying",
        label: {
          key: "sync.retrying",
          params: { seconds: secs, count: i.waiting },
        },
        detail: { key: "sync.retryingDetail" },
        tone: "calm",
      };
    }
    return {
      id: "waiting",
      label: { key: "sync.waiting", params: { count: i.waiting } },
      detail: { key: "sync.waitingDetail" },
      tone: "busy",
    };
  }
  return {
    id: "synced",
    label: { key: "sync.synced" },
    detail: { key: "sync.syncedDetail" },
    tone: "ok",
  };
}
