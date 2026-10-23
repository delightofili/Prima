import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { db } from "../db";
import { useAuth } from "../hooks/useAuth";
import { usePlan } from "../hooks/usePlan";
import { logAudit } from "../lib/audit";
import {
  buildDataValueSet,
  indicatorList,
  validateConfig,
  type Dhis2Config,
  type Indicator,
} from "../lib/dhis2";
import { loadDhis2, saveDhis2 } from "../lib/dhis2Store";
import { downloadBlob } from "../lib/download";
import { computeLgaReport } from "../lib/lgaReport";
import { canUse } from "../lib/plan";
import { Dhis2MappingDialog } from "./Dhis2MappingDialog";
import { SectionTitle } from "./FormBits";
import { UpgradeDialog } from "./UpgradeDialog";

// Last month is what a facility reports now
function previousMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function Dhis2Card() {
  const { facility } = useAuth();
  const plan = usePlan();
  const [cfg, setCfg] = useState<Dhis2Config | null>(null);
  const [month, setMonth] = useState(previousMonth);
  const [mapping, setMapping] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    sent: number;
    skipped: Indicator[];
  } | null>(null);

  useEffect(() => {
    let alive = true;
    void loadDhis2().then((c) => {
      if (alive) setCfg(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  const total = indicatorList().length;
  const mapped = cfg
    ? Object.values(cfg.items).filter((m) => m.dataElement).length
    : 0;

  const run = async () => {
    if (!facility || !cfg) return;
    if (!canUse(plan, "dhis2Export")) return setUpgrade(true);
    const problems = validateConfig(cfg);
    if (problems.length > 0 || mapped === 0) {
      setError(problems[0] ?? "Set up the mapping first.");
      return setMapping(true);
    }
    setBusy(true);
    setError(null);
    try {
      const [patients, visits, shots] = await Promise.all([
        db.patients.filter((p) => !p.deletedAt).toArray(),
        db.visits.toArray(),
        db.immunizations.toArray(),
      ]);
      const patientMap = new Map(patients.map((p) => [p.id, p] as const));
      const report = computeLgaReport(
        patients,
        visits,
        shots,
        patientMap,
        month,
      );
      const { set, skipped } = buildDataValueSet(report, cfg);
      downloadBlob(
        `prima-dhis2-${facility.code}-${set.period}.json`,
        new Blob([JSON.stringify(set, null, 2)], { type: "application/json" }),
      );
      setDone({ sent: set.dataValues.length, skipped });
      await logAudit(
        "export.dhis2",
        "facility",
        facility.id,
        `${month}, ${set.dataValues.length} values`,
      );
    } catch {
      setError("Could not create the file. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card space-y-4">
      <SectionTitle icon={Send} title="Monthly report for DHIS2" />
      <p className="text-subtext">
        Creates the month's figures (attendance, visits by age and sex,
        antenatal, postnatal, child welfare, family planning and vaccine doses)
        as a DHIS2 data file. Import it in DHIS2 with Import/Export, then Data
        import. Prima does not send anything by itself.
      </p>

      <p
        className={
          mapped === 0
            ? "rounded-xl bg-accent-50 p-3 font-medium"
            : "text-subtext"
        }
      >
        {mapped === 0
          ? "Mapping not set up yet."
          : `${mapped} of ${total} figures mapped.`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
        <label className="block space-y-1">
          <span className="text-base font-semibold">Month</span>
          <input
            type="month"
            className="input"
            max={previousMonth()}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setMapping(true)}
        >
          Set up mapping
        </button>
      </div>

      <button
        type="button"
        className="btn btn-primary sm:w-60"
        disabled={busy || !cfg || !month}
        onClick={() => void run()}
      >
        {busy ? "Creating the file…" : "Create DHIS2 file"}
      </button>

      {error && (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}

      {done && (
        <div className="space-y-1 rounded-xl bg-page p-3">
          <p className="font-semibold">
            File created with {done.sent} figures.
          </p>
          {done.skipped.length > 0 && (
            <p className="text-sm text-subtext">
              Left out because they are not mapped:{" "}
              {done.skipped
                .slice(0, 4)
                .map((i) => i.label)
                .join(", ")}
              {done.skipped.length > 4
                ? ` and ${done.skipped.length - 4} more`
                : ""}
              .
            </p>
          )}
          <p className="text-sm text-subtext">
            Check the file in DHIS2 with a trial import before the real one.
          </p>
        </div>
      )}

      {mapping && cfg && (
        <Dhis2MappingDialog
          initial={cfg}
          onSave={async (next) => {
            await saveDhis2(next);
            setCfg(next);
            setError(null);
          }}
          onClose={() => setMapping(false)}
        />
      )}
      {upgrade && (
        <UpgradeDialog
          title="DHIS2 export needs the Pro plan"
          text="Upgrade to Pro to create your monthly DHIS2 file, and to export records in the FHIR standard."
          onClose={() => setUpgrade(false)}
        />
      )}
    </section>
  );
}
