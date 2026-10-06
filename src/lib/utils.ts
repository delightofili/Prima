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
