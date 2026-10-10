export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

export const todayISO = () => new Date().toLocaleDateString("en-CA");

export const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d + days).toLocaleDateString("en-CA");
};

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateCardNumber(facilityCode: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const suffix = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join(
    "",
  );
  return `${facilityCode}-${suffix}`;
}

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const toNumber = (v: unknown): number | undefined => {
  if (v === "" || v === null || v === undefined) return undefined;
  return Number(String(v).replace(",", "."));
};

export const fromISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function toE164(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.replace(/[\s()-]/g, "");
  if (/^\+234[789][01]\d{8}$/.test(s)) return s;
  if (/^0[789][01]\d{8}$/.test(s)) return `+234${s.slice(1)}`;
  if (/^234[789][01]\d{8}$/.test(s)) return `+${s}`;
  return undefined;
}

export function formatPhone(e164?: string): string | undefined {
  if (!e164) return undefined;
  const m = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : e164;
}
