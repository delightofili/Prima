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
import { useI18n } from "../i18n";
import { calculateAge } from "../lib/age";
import {
  dismissPair,
  restorePair,
  type DuplicateMatch,
} from "../lib/duplicates";
import { canUse, PRICES, money } from "../lib/plan";
import { formatPhone } from "../lib/utils";
import type { Patient } from "../types";
import { useCan } from "../hooks/useCan";

function Person({ p }: { p: Patient }) {
  const { isoDate } = useI18n();
  const age = calculateAge(p.dob);
  return (
    <Link
      to={`/patients/${p.id}`}
      className="block rounded-xl border-2 border-line p-3 hover:border-prima-500"
    >
      <p className="font-semibold">{p.fullName}</p>
      <p className="text-sm font-semibold text-prima-900">{p.cardNumber}</p>
      <p className="text-subtext">
        {age.label} · {isoDate(p.dob)}
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
  const { t } = useI18n();
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
          {t(m.level === "high" ? "dup.high" : "dup.possible")} · {m.score}%
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
          {t("dup.notDup")}
        </button>
        <button
          type="button"
          className="btn btn-primary md:w-56"
          onClick={onReview}
        >
          <GitMerge size={20} className="mr-2" /> {t("dup.review")}
        </button>
      </div>
    </li>
  );
}

export function DuplicatesPage() {
  const { t, tp } = useI18n();
  usePageTitle(t("patients.findDuplicates"));
  const plan = usePlan();
  const toast = useToast();
  const { matches, scanning, total, rescan } = useDuplicateScan();
  const [reviewing, setReviewing] = useState<DuplicateMatch | null>(null);
  const unlocked = canUse(plan, "duplicateMerge");

  const dismiss = async (m: DuplicateMatch) => {
    await dismissPair(m.a.id, m.b.id);
    rescan();
    toast(t("dup.marked"), "ok", {
      label: t("common.undo"),
      onClick: () => {
        void restorePair(m.a.id, m.b.id).then(rescan);
      },
    });
  };

  const high = matches?.filter((m) => m.level === "high").length ?? 0;
  const can = useCan();
  if (!can("mergeDuplicates")) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-lg font-semibold">{t("dup.adminOnly")}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t("patients.findDuplicates")}
        subtitle={t("dup.subtitle")}
      />

      {!matches ? (
        <div className="card flex items-center gap-3">
          <RefreshCw size={22} className="animate-spin text-prima-500" />
          <p className="font-semibold">{t("dup.scanning", { total })}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold">
                {tp("dup.found", matches.length)}
              </p>
              <p className="text-subtext">
                {t(scanning ? "dup.statsAgain" : "dup.stats", { high, total })}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary sm:w-44"
              onClick={rescan}
            >
              <RefreshCw size={20} className="mr-2" /> {t("dup.scanAgain")}
            </button>
          </section>

          {matches.length === 0 ? (
            <div className="card space-y-2 text-center">
              <div className="flex justify-center text-ok">
                <CircleCheck size={36} />
              </div>
              <p className="text-lg font-semibold">{t("dup.noneTitle")}</p>
              <p className="text-subtext">{t("dup.noneText")}</p>
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
              title={t("dup.upgradeTitle")}
              text={t("dup.upgradeText", { price: money(PRICES.pro) })}
              cta={t("upgrade.seePro")}
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
