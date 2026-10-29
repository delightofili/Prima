import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { useI18n, type Key } from "../i18n";
import { recordGaps, type GapKey } from "../lib/completeness";
import type { Patient } from "../types";

const WORDS: Record<GapKey, { title: Key; help: Key }> = {
  nextOfKin: { title: "record.nextOfKin", help: "record.nextOfKinHelp" },
  birthDate: { title: "record.birthDate", help: "record.birthDateHelp" },
  guardian: { title: "record.guardian", help: "record.guardianHelp" },
};

// What a quick registration left for later. Disappears once everything is filled in.
export function CompleteRecordCard({ patient }: { patient: Patient }) {
  const { t } = useI18n();
  const gaps = recordGaps(patient);
  if (gaps.length === 0) return null;

  return (
    <section className="card space-y-3 border-2 border-accent-500 bg-accent-50">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <ClipboardList size={20} /> {t("record.finishTitle")}
      </h2>
      <ul className="space-y-2">
        {gaps.map((g) => (
          <li key={g}>
            <span className="block font-semibold">{t(WORDS[g].title)}</span>
            <span className="block text-sm text-subtext">
              {t(WORDS[g].help)}
            </span>
          </li>
        ))}
      </ul>
      <Link
        to={`/patients/${patient.id}/edit`}
        className="btn btn-primary sm:w-56"
      >
        {t("record.addDetails")}
      </Link>
    </section>
  );
}
