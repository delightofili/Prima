// The logic of the first-sign-in wizard, with no screen in it, so it can be tested on its own.
import { supabase } from "./supabase";
import { NOTICE_VERSION } from "./noticeText";

export type NoticeKind = "intended_use" | "confidentiality";
export const KINDS: NoticeKind[] = ["intended_use", "confidentiality"];

export type Step = "language" | "intended" | "confidential" | "ready";
export const STEPS: Step[] = ["language", "intended", "confidential", "ready"];
export const stepNumber = (s: Step) => STEPS.indexOf(s) + 1;
export const nextStep = (s: Step): Step | null =>
  STEPS[STEPS.indexOf(s) + 1] ?? null;
export const prevStep = (s: Step): Step | null =>
  STEPS[STEPS.indexOf(s) - 1] ?? null;

// The two statements must be agreed to, one by one. The language step and the last step need nothing.
export function canContinue(
  step: Step,
  ticks: { intended: boolean; confidential: boolean },
): boolean {
  if (step === "intended") return ticks.intended;
  if (step === "confidential") return ticks.confidential;
  return true;
}

/* ---------- remembering, on this phone ---------- */
const doneKey = (userId: string) =>
  `prima_welcome_v${NOTICE_VERSION}:${userId}`;
const pendingKey = (userId: string) => `prima_notices_pending:${userId}`;

export function isDone(userId: string): boolean {
  try {
    return localStorage.getItem(doneKey(userId)) === "1";
  } catch {
    return false; // storage blocked: the person is simply asked again next time
  }
}
export function markDone(userId: string): void {
  try {
    localStorage.setItem(doneKey(userId), "1");
  } catch {
    /* storage blocked */
  }
}

/* ---------- recording it in the database ---------- */
type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
const defaultRpc: Rpc = (name, args) => supabase.rpc(name, args);

interface Pending {
  kind: NoticeKind;
  version: string;
  language: string;
}

function readPending(userId: string): Pending[] {
  try {
    const raw = JSON.parse(
      localStorage.getItem(pendingKey(userId)) ?? "[]",
    ) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (p): p is Pending =>
        !!p &&
        KINDS.includes(p.kind) &&
        typeof p.version === "string" &&
        typeof p.language === "string",
    );
  } catch {
    return [];
  }
}
function writePending(userId: string, list: Pending[]): void {
  try {
    if (list.length === 0) localStorage.removeItem(pendingKey(userId));
    else localStorage.setItem(pendingKey(userId), JSON.stringify(list));
  } catch {
    /* storage blocked */
  }
}

// Only these two errors can never succeed by waiting. Everything else (no signal, signed out for a moment) is tried again later.
const hopeless = (message: string) => /notice:(kind|version)/.test(message);

// Sends what is waiting. What cannot be sent stays on the phone and is tried again at the next start and whenever signal returns.
export async function flushPending(
  userId: string,
  rpc: Rpc = defaultRpc,
): Promise<"saved" | "later" | "none"> {
  const waiting = readPending(userId);
  if (waiting.length === 0) return "none";
  const left: Pending[] = [];
  for (const p of waiting) {
    try {
      const { error } = await rpc("accept_notice", {
        p_kind: p.kind,
        p_version: p.version,
        p_language: p.language,
      });
      if (error && !hopeless(error.message)) left.push(p);
    } catch {
      left.push(p);
    }
  }
  writePending(userId, left);
  return left.length ? "later" : "saved";
}

// Called the moment the person has agreed to both statements: queue both, then try to send them
export async function sendAcceptances(
  userId: string,
  language: string,
  rpc: Rpc = defaultRpc,
): Promise<"saved" | "later"> {
  const queue = readPending(userId);
  for (const kind of KINDS) {
    if (!queue.some((p) => p.kind === kind && p.version === NOTICE_VERSION))
      queue.push({ kind, version: NOTICE_VERSION, language });
  }
  writePending(userId, queue);
  const result = await flushPending(userId, rpc);
  return result === "saved" ? "saved" : "later";
}

// Did this person already agree, on another phone? Then this phone must not ask again.
export async function alreadyAccepted(rpc: Rpc = defaultRpc): Promise<boolean> {
  try {
    const { data, error } = await rpc("my_notices", {});
    if (error || !Array.isArray(data)) return false;
    return KINDS.every((k) =>
      data.some(
        (n: { kind?: string; version?: string }) =>
          !!n && n.kind === k && n.version === NOTICE_VERSION,
      ),
    );
  } catch {
    return false;
  }
}
