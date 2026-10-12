import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, GitMerge, RefreshCw } from "lucide-react";
import { MergeDialog } from "../components/MergeDialog";
import { PageHeader } from "../components/PageHeader";
import { UpgradeCard } from "../components/UpgradeCard";
import { usePageTitle } from "../hooks/common";
import { useDuplicateScan } from "../hooks/useDuplicateScan";
import { usePlan } from "../hooks/usePlan";
import { useToast } from "../hooks/useToast";
import { calculateAge } from "../lib/age";
import {
  dismissPair,
  restorePair,
  type DuplicateMatch,
} from "../lib/duplicates";
import { canUse, PRICES, money } from "../lib/plan";
import { formatPhone } from "../lib/utils";
import type { Patient } from "../types";

function Person({ p }: { p: Patient }) {
  const age = calculateAge(p.dob);
  return (
    <Link
      to={`/patients/${p.id}`}
      className="block rounded-xl border-2 border-line p-3 hover:border-prima-500"
    >
      <p className="font-semibold">{p.fullName}</p>
      <p className="text-sm font-semibold text-prima-900">{p.cardNumber}</p>
      <p className="text-subtext">
        {age.label} · {p.dob}
      </p>
      <p className="text-subtext">
        {p.village}
        {p.phone ? ` · ${formatPhone(p.phone)}` : ""}
      </p>
    </Link>
  );
}

function PairCard({
  m,
  onReview,
  onDismiss,
}: {
  m: DuplicateMatch;
  onReview: () => void;
  onDismiss: () => void;
}) {
  return (
    <li className="card space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            m.level === "high"
              ? "bg-accent-50 ring-2 ring-accent-500"
              : "bg-prima-50 text-prima-900"
          }`}
        >
          {m.level === "high" ? "High confidence" : "Possible"} · {m.score}%
        </span>
        {m.reasons.map((r) => (
          <span
            key={r}
            className="rounded-full bg-page px-3 py-1 text-sm text-subtext"
          >
            {r}
          </span>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Person p={m.a} />
        <Person p={m.b} />
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          className="btn btn-secondary md:w-52"
          onClick={onDismiss}
        >
          Not a duplicate
        </button>
        <button
          type="button"
          className="btn btn-primary md:w-56"
          onClick={onReview}
        >
          <GitMerge size={20} className="mr-2" /> Review and merge
        </button>
      </div>
    </li>
  );
}

export function DuplicatesPage() {
  usePageTitle("Find duplicates");
  const plan = usePlan();
  const toast = useToast();
  const { matches, scanning, total, rescan } = useDuplicateScan();
  const [reviewing, setReviewing] = useState<DuplicateMatch | null>(null);
  const unlocked = canUse(plan, "duplicateMerge");

  const dismiss = async (m: DuplicateMatch) => {
    await dismissPair(m.a.id, m.b.id);
    rescan();
    toast("Marked as not a duplicate", "ok", {
      label: "Undo",
      onClick: () => {
        void restorePair(m.a.id, m.b.id).then(rescan);
      },
    });
  };

  const high = matches?.filter((m) => m.level === "high").length ?? 0;

  return (
    <>
      <PageHeader
        title="Find duplicates"
        subtitle="Possible duplicate patients, found on this device. Nothing is merged until you confirm."
      />

      {!matches ? (
        <div className="card flex items-center gap-3">
          <RefreshCw size={22} className="animate-spin text-prima-500" />
          <p className="font-semibold">Scanning {total} patients…</p>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold">
                {matches.length} possible{" "}
                {matches.length === 1 ? "duplicate" : "duplicates"}
              </p>
              <p className="text-subtext">
                {high} high confidence · {total} patients checked
                {scanning && " · scanning again…"}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary sm:w-44"
              onClick={rescan}
            >
              <RefreshCw size={20} className="mr-2" /> Scan again
            </button>
          </section>

          {matches.length === 0 ? (
            <div className="card space-y-2 text-center">
              <div className="flex justify-center text-ok">
                <CircleCheck size={36} />
              </div>
              <p className="text-lg font-semibold">No duplicates found</p>
              <p className="text-subtext">Your register looks clean.</p>
            </div>
          ) : unlocked ? (
            <ul className="space-y-3">
              {matches.map((m) => (
                <PairCard
                  key={m.key}
                  m={m}
                  onReview={() => setReviewing(m)}
                  onDismiss={() => dismiss(m)}
                />
              ))}
            </ul>
          ) : (
            <UpgradeCard
              title="Merge duplicates with Pro"
              text={`Pro (${money(PRICES.pro)} a month) shows each pair side by side, explains why they match, and merges visits, vaccines and allergies safely.`}
              cta="See Pro plan"
            />
          )}
        </div>
      )}

      {reviewing && (
        <MergeDialog match={reviewing} onClose={() => setReviewing(null)} />
      )}
    </>
  );
}
