import { useState } from "react";
import { FileJson } from "lucide-react";
import { db } from "../db";
import { useAuth } from "../hooks/useAuth";
import { usePlan } from "../hooks/usePlan";
import { logAudit } from "../lib/audit";
import { downloadBlob } from "../lib/download";
import {
  buildFhir,
  toBundleBlob,
  toNdjsonBlob,
  type FhirResult,
} from "../lib/fhir";
import { canUse } from "../lib/plan";
import { todayISO } from "../lib/utils";
import { SectionTitle } from "./FormBits";
import { UpgradeDialog } from "./UpgradeDialog";

export function FhirCard() {
  const { facility } = useAuth();
  const plan = usePlan();
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [format, setFormat] = useState<"bundle" | "ndjson">("bundle");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FhirResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);

  const run = async () => {
    if (!facility) return;
    if (!canUse(plan, "fhirExport")) return setUpgrade(true);
    setBusy(true);
    setError(null);
    try {
      const [patients, visits, shots, guardians] = await Promise.all([
        db.patients.toArray(),
        db.visits.toArray(),
        db.immunizations.toArray(),
        db.guardians.toArray(),
      ]);
      const built = await buildFhir({
        facility: {
          id: facility.id,
          name: facility.name,
          code: facility.code,
          lga: facility.lga,
          state: facility.state,
        },
        patients,
        visits,
        shots,
        guardians,
        includeSensitive,
      });
      const blob =
        format === "bundle"
          ? toBundleBlob(built.resources)
          : toNdjsonBlob(built.resources);
      downloadBlob(
        `prima-fhir-${facility.code}-${todayISO()}.${format === "bundle" ? "json" : "ndjson"}`,
        blob,
      );
      setResult(built);
      await logAudit(
        "export.fhir",
        "facility",
        facility.id,
        `${built.counts.Patient ?? 0} patients${includeSensitive ? ", sensitive diagnoses included" : ""}`,
      );
    } catch {
      setError("Could not create the file. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card space-y-4">
      <SectionTitle icon={FileJson} title="Share records (FHIR)" />
      <p className="text-subtext">
        Creates a standard health-record file (FHIR R4) with patients, visits,
        diagnoses, vital signs and vaccines. A child's parent or guardian is
        included as a related person. Deleted and erased patients are never
        included.
      </p>

      <label className="block space-y-1">
        <span className="text-base font-semibold">File type</span>
        <select
          className="input sm:max-w-md"
          value={format}
          onChange={(e) => setFormat(e.target.value as "bundle" | "ndjson")}
        >
          <option value="bundle">One file: FHIR Bundle (.json)</option>
          <option value="ndjson">One record per line (.ndjson)</option>
        </select>
      </label>

      <label className="flex min-h-12 items-start gap-3 rounded-xl border-2 border-line bg-white p-3">
        <input
          type="checkbox"
          className="mt-1 size-6 accent-prima-500"
          checked={includeSensitive}
          onChange={(e) => setIncludeSensitive(e.target.checked)}
        />
        <span>
          <span className="block font-semibold">
            Include HIV, STI, mental health and pregnancy-loss diagnoses
          </span>
          <span className="block text-sm text-subtext">
            Off by default. Those visits are still exported, but without their
            diagnosis, complaint and treatment. Free-text complaints on other
            visits are not checked.
          </span>
        </span>
      </label>

      <button
        type="button"
        className="btn btn-primary sm:w-60"
        disabled={busy}
        onClick={() => void run()}
      >
        {busy ? "Creating the file…" : "Create FHIR file"}
      </button>

      {error && (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-2 rounded-xl bg-page p-3">
          <p className="font-semibold">File created.</p>
          <ul className="grid gap-x-6 sm:grid-cols-2">
            {Object.entries(result.counts).map(([type, n]) => (
              <li key={type} className="flex justify-between gap-3">
                <span>{type}</span>
                <span className="tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
          {result.withheld > 0 && (
            <p className="text-sm text-subtext">
              {result.withheld} {result.withheld === 1 ? "visit" : "visits"} had
              sensitive details left out.
            </p>
          )}
          {result.dangling.length > 0 && (
            <p className="text-sm text-danger">
              {result.dangling.length} links point outside the file. Tell
              support before sending it.
            </p>
          )}
        </div>
      )}

      <p className="text-sm text-subtext">
        This file contains identifiable patient records. Send it only to a
        system and person you have agreed with, and delete your copy afterwards.
      </p>

      {upgrade && (
        <UpgradeDialog
          title="FHIR export needs the Pro plan"
          text="Upgrade to Pro to export your records in the FHIR standard, and to send monthly figures to DHIS2."
          onClose={() => setUpgrade(false)}
        />
      )}
    </section>
  );
}
