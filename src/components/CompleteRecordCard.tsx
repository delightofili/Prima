import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { recordGaps } from "../lib/completeness";
import type { Patient } from "../types";

// What a quick registration left for later. Disappears once everything is filled in.
export function CompleteRecordCard({ patient }: { patient: Patient }) {
  const gaps = recordGaps(patient);
  if (gaps.length === 0) return null;

  return (
    <section className="card space-y-3 border-2 border-accent-500 bg-accent-50">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <ClipboardList size={20} /> Finish this record
      </h2>
      <ul className="space-y-2">
        {gaps.map((g) => (
          <li key={g.key}>
            <span className="block font-semibold">{g.title}</span>
            <span className="block text-sm text-subtext">{g.help}</span>
          </li>
        ))}
      </ul>
      <Link
        to={`/patients/${patient.id}/edit`}
        className="btn btn-primary sm:w-56"
      >
        Add these details
      </Link>
    </section>
  );
}
