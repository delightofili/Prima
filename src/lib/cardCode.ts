// What goes inside the QR code on a patient card: only the card number. No name, no date of birth, no phone.
// A lost card tells a stranger nothing; the record itself stays on the clinic's phones behind the PIN.
const PREFIX = "PRIMA:";

// Card numbers look like ANK-7K3F9Q: the clinic code, a dash, then 6 characters (no 0, O, 1, I or L)
const CARD = /^[A-Z0-9]{2,8}-[A-HJKMNP-Z2-9]{6}$/;

export const encodeCard = (cardNumber: string) => `${PREFIX}${cardNumber}`;

// Accepts a scanned QR text or a number typed by hand. Returns the card number, or null if it is neither.
export function parseCard(text: string): string | null {
  const t = text.trim().toUpperCase();
  const candidate = t.startsWith(PREFIX) ? t.slice(PREFIX.length) : t;
  return CARD.test(candidate) ? candidate : null;
}
