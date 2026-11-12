// Everything about confirming an email address and resetting a password, apart from what is drawn on the screen.
//
// A person can finish in two ways, and both go through supabase.auth.verifyOtp:
//   the CODE in the email, typed into Prima (works on any phone, in the installed app, no browser jump)
//   the LINK in the email, which opens /auth/confirm
import type { EmailOtpType } from "@supabase/supabase-js";
import { friendlyErrorKey, readLocal } from "./auth";
import { supabase } from "./supabase";

export type LinkType = "email" | "recovery" | "email_change" | "invite";
export interface AuthLink {
  tokenHash: string;
  type: LinkType;
}

export const LINK_PATH = "/auth/confirm";
export const RESEND_SECONDS = 60;

// The email templates say type=email. "signup" is the old name for the same thing, so an older email still works.
const TYPES = new Map<string, LinkType>([
  ["email", "email"],
  ["signup", "email"],
  ["recovery", "recovery"],
  ["email_change", "email_change"],
  ["invite", "invite"],
]);

// Reads /auth/confirm?token_hash=...&type=... from the address.
// null = this is not a link address at all. "invalid" = it is one, but something is missing or wrong.
export function parseAuthLink(loc: {
  pathname: string;
  search: string;
}): AuthLink | "invalid" | null {
  if (loc.pathname.replace(/\/+$/, "") !== LINK_PATH) return null;
  const q = new URLSearchParams(loc.search);
  const type = TYPES.get(q.get("type") ?? "");
  const tokenHash = q.get("token_hash") ?? "";
  if (!type || !/^[A-Za-z0-9_-]{20,200}$/.test(tokenHash)) return "invalid";
  return { tokenHash, type };
}

// The code as people type it: spaces and dashes are removed. Its length is set in Supabase (6 to 10 digits), so it is not fixed here.
export const cleanCode = (raw: string) => raw.replace(/\D/g, "");
export const codeComplete = (code: string) => /^\d{6,10}$/.test(code);

// An address as it arrives when pasted from a chat or a web page: no hidden characters, no quotes or brackets around it,
// and no comma or full stop at the end (a sentence that ended with the address is a common cause of "invalid format").
export function cleanEmail(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .trim()
    .replace(/^[<"'(\s]+/, "")
    .replace(/[>"')\s,.;:]+$/, "");
}

// Is this the shape of an email address: name@place.ext, with no spaces, and letters at the end?
// (Only the shape. Whether the mailbox exists is for the confirmation email to prove.)
export function emailLooksValid(email: string): boolean {
  if (email.length > 254) return false;
  const at = email.indexOf("@");
  if (at < 1 || at !== email.lastIndexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64 || !/^[A-Za-z0-9._%+-]+$/.test(local)) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes(".."))
    return false;
  return /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/.test(
    domain,
  );
}

// How many seconds are left before "send again" is allowed
// (never more than the total, even if the phone's clock was set back after the email was sent)
export const secondsLeft = (
  sentAt: number | null,
  now: number,
  total = RESEND_SECONDS,
) =>
  sentAt === null
    ? 0
    : Math.min(total, Math.max(0, Math.ceil(total - (now - sentAt) / 1000)));

// Supabase refuses a sign in until the email is confirmed
export function isUnconfirmed(e: unknown): boolean {
  const err = e as { code?: string; message?: string } | null;
  return (
    err?.code === "email_not_confirmed" ||
    /email not confirmed/i.test(err?.message ?? "")
  );
}

// The word to show for an error. Falls back to the sign in screen's own list.
export function mailErrorKey(e: unknown): string {
  const err = e as { code?: string; message?: string; status?: number } | null;
  const code = err?.code ?? "";
  const msg = err?.message ?? "";
  if (/failed to fetch|network|load failed/i.test(msg))
    return "authErr.network";
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    err?.status === 429 ||
    /rate limit|too many/i.test(msg)
  )
    return "authErr.rate";
  // Supabase could not send the email (the mail provider refused, or is not set up): not the person's fault, so say what to do
  if (/error sending/i.test(msg)) return "authMail.errSend";
  if (
    code === "email_address_invalid" ||
    /unable to validate email address|invalid format/i.test(msg)
  )
    return "auth.errEmail";
  // "same password" is checked first: its message also contains the words "password should"
  if (code === "same_password" || /different from the old password/i.test(msg))
    return "authMail.errSame";
  if (
    code === "weak_password" ||
    /should be at least|should contain at least|known to be weak|weak password/i.test(
      msg,
    )
  )
    return "authMail.errWeak";
  if (
    code === "otp_expired" ||
    /(expired|invalid) or .*(expired|invalid)/i.test(msg)
  )
    return "authMail.errCode";
  return friendlyErrorKey(e);
}

// null when the two passwords are fine, otherwise the word to show
export function passwordProblem(
  password: string,
  again: string,
): string | null {
  if (password.length < 8) return "auth.errPassword";
  if (password !== again) return "authMail.errMismatch";
  return null;
}

const redirect = () => `${window.location.origin}${LINK_PATH}`;

// The link in the email. Called only when the person presses the button, never on page load: some email scanners open every link.
export async function verifyLink(link: AuthLink): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    token_hash: link.tokenHash,
    type: link.type as EmailOtpType,
  });
  if (error) throw error;
}

// The code in the email
export async function verifyCode(
  email: string,
  code: string,
  kind: "signup" | "recovery",
): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: cleanCode(code),
    type: kind === "recovery" ? "recovery" : "email",
  });
  if (error) throw error;
}

export async function resendSignup(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: redirect() },
  });
  if (error) throw error;
}

export async function requestReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirect(),
  });
  if (error) throw error;
}

export async function setNewPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

// Is the cloud session the same person as the one signed in on this phone? (A shared phone must never mix two people.)
export async function sessionMatchesPhone(): Promise<boolean> {
  const local = await readLocal();
  if (!local) return true;
  const { data } = await supabase.auth.getSession();
  return !data.session || data.session.user.id === local.account.userId;
}

// Ends the cloud session on this phone only. The records on the phone are not touched.
export async function dropCloudSession(): Promise<void> {
  await supabase.auth.signOut({ scope: "local" });
}
