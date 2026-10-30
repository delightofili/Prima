import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Phone, Stethoscope, Syringe } from "lucide-react";
import { usePlan } from "../hooks/usePlan";
import { useFollowUps, type FollowUpItem } from "../hooks/useFollowUps";
import { calculateAge, isUnder5 } from "../lib/age";
import { canUse } from "../lib/plan";
import { UpgradeCard } from "./UpgradeCard";
import { useGuardians } from "../hooks/useGuardians";
import type { Guardian } from "../types";
import { useI18n } from "../i18n";

const WINDOWS = [7, 14, 30];

function Row({
  item,
  guardianPhone,
}: {
  item: FollowUpItem;
  guardianPhone?: string;
}) {
  const { t, tp, isoDate } = useI18n();
  const p = item.patient;
  const dueText =
    item.days < 0
      ? tp("fu.overdueBy", -item.days)
      : item.days === 0
        ? t("fu.dueToday")
        : tp("fu.dueIn", item.days, { date: isoDate(item.dueDate) });
  // The guardian is the person to call; otherwise fall back to the old rule
  const phone =
    guardianPhone ??
    (isUnder5(calculateAge(p.dob))
      ? p.nextOfKinPhone
      : (p.phone ?? p.nextOfKinPhone));
  const Icon = item.kind === "vaccine" ? Syringe : Stethoscope;

  return (
    <li className="card flex items-center gap-3">
      <Link to={`/patients/${p.id}`} className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold">{p.fullName}</p>
        <p className="truncate text-subtext">
          {p.cardNumber} · {p.village}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-prima-50 px-3 py-1 text-sm font-semibold text-prima-900">
            <Icon size={16} /> {item.title}
          </span>
          <span
            className={`text-sm font-semibold ${item.days < 0 ? "text-danger" : "text-ink"}`}
          >
            {dueText}
          </span>
        </p>
      </Link>
      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label={t("fu.callAbout", { name: p.fullName })}
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-prima-500 text-white hover:bg-prima-900"
        >
          <Phone size={20} />
        </a>
      )}
    </li>
  );
}

function Section({
  title,
  items,
  guardianMap,
}: {
  title: string;
  items: FollowUpItem[];
  guardianMap: Map<string, Guardian>;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">
        {title} ({items.length})
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((i) => (
          <Row
            key={i.key}
            item={i}
            guardianPhone={
              i.patient.guardianId
                ? guardianMap.get(i.patient.guardianId)?.phone
                : undefined
            }
          />
        ))}
      </ul>
    </section>
  );
}

export function FollowUpsView() {
  const { t, tp } = useI18n();
  const plan = usePlan();
  const [windowDays, setWindowDays] = useState(7);
  const items = useFollowUps(windowDays);
  const { guardianMap } = useGuardians();

  const groups = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items ?? []) m.set(i.title, (m.get(i.title) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  if (!items) return null;

  const overdue = items.filter((i) => i.days < 0);
  const today = items.filter((i) => i.days === 0);
  const upcoming = items.filter((i) => i.days > 0);
  const unlocked = canUse(plan, "followUps");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3 md:max-w-sm">
        {WINDOWS.map((d) => (
          <button
            key={d}
            type="button"
            className={`btn ${windowDays === d ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setWindowDays(d)}
          >
            {t("fu.days", { count: d })}
          </button>
        ))}
      </div>

      <section className="card space-y-3">
        <div className="flex items-center gap-3">
          <CalendarClock size={28} className="text-prima-500" />
          <div>
            <p className="text-2xl font-bold">{tp("fu.count", items.length)}</p>
            <p className="text-subtext">
              {t("fu.summary", {
                overdue: overdue.length,
                today: today.length,
                upcoming: upcoming.length,
              })}
            </p>
          </div>
        </div>
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {groups.map(([title, count]) => (
              <span
                key={title}
                className="rounded-full bg-accent-50 px-3 py-1 text-sm font-semibold"
              >
                {title} · {count}
              </span>
            ))}
          </div>
        )}
      </section>

      {items.length === 0 ? (
        <div className="card text-center">
          <p className="text-lg font-semibold">{t("fu.allCaughtUp")}</p>
          <p className="text-subtext">
            {t("fu.nothing", { days: windowDays })}
          </p>
        </div>
      ) : unlocked ? (
        <>
          <Section
            title={t("fu.overdue")}
            items={overdue}
            guardianMap={guardianMap}
          />
          <Section
            title={t("fu.dueToday")}
            items={today}
            guardianMap={guardianMap}
          />
          <Section
            title={t("fu.comingUp")}
            items={upcoming}
            guardianMap={guardianMap}
          />
        </>
      ) : (
        <UpgradeCard title={t("fu.upgradeTitle")} text={t("fu.upgradeText")} />
      )}
    </div>
  );
}
