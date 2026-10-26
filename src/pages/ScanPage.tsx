import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ScanLine } from "lucide-react";
import { db } from "../db";
import { Field } from "../components/FormBits";
import { PageHeader } from "../components/PageHeader";
import { QrScanner } from "../components/QrScanner";
import { usePageTitle } from "../hooks/common";

import { parseCard } from "../lib/cardCode";
import { usePower } from "../lib/power";

export function ScanPage() {
  usePageTitle("Scan card");
  const navigate = useNavigate();
  const power = usePower();
  const [message, setMessage] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  const open = async (text: string) => {
    const card = parseCard(text);
    if (!card) return setMessage("That is not a Prima patient card.");
    const patient = await db.patients
      .filter((p) => p.cardNumber === card && !p.deletedAt)
      .first();
    if (!patient) {
      return setMessage(
        `No patient with card ${card} on this phone. If she was registered on another phone, wait for it to sync.`,
      );
    }
    navigate(`/patients/${patient.id}`);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void open(typed);
  };

  return (
    <>
      <PageHeader
        title="Scan card"
        subtitle="Point the camera at the QR code on a patient card."
      />
      <div className="mx-auto max-w-lg space-y-4">
        <QrScanner
          everyMs={power.active ? 700 : 200}
          onResult={(text) => void open(text)}
        />
        {message && (
          <p role="alert" className="rounded-xl bg-accent-50 p-3 font-medium">
            {message}
          </p>
        )}
        <form onSubmit={submit} className="card space-y-3" noValidate>
          <Field label="Or type the card number">
            <input
              className="input font-mono uppercase"
              placeholder="ANK-7K3F9Q"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </Field>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={typed.trim().length < 4}
          >
            <ScanLine size={20} className="mr-2" /> Open patient
          </button>
        </form>
      </div>
    </>
  );
}
