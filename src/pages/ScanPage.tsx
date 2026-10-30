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
import { useI18n } from "../i18n";

// An example of what a card number looks like, shown in the empty box
const CARD_EXAMPLE = "ANK-7K3F9Q";

export function ScanPage() {
  const { t } = useI18n();
  usePageTitle(t("scan.title"));
  const navigate = useNavigate();
  const power = usePower();
  const [message, setMessage] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  const open = async (text: string) => {
    const card = parseCard(text);
    if (!card) return setMessage(t("scan.notPrima"));
    const patient = await db.patients
      .filter((p) => p.cardNumber === card && !p.deletedAt)
      .first();
    if (!patient) {
      return setMessage(t("scan.notFound", { card }));
    }
    navigate(`/patients/${patient.id}`);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void open(typed);
  };

  return (
    <>
      <PageHeader title={t("scan.title")} subtitle={t("scan.subtitle")} />
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
          <Field label={t("scan.typeLabel")}>
            <input
              className="input font-mono uppercase"
              placeholder={CARD_EXAMPLE}
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
            <ScanLine size={20} className="mr-2" /> {t("scan.open")}
          </button>
        </form>
      </div>
    </>
  );
}
