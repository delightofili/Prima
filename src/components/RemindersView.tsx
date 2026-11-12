import { Link } from "react-router-dom";
import { BellRing, CalendarClock, Info, Send, Smartphone } from "lucide-react";
import { useSmsStats, type ReminderItem } from "../hooks/useSmsStats";
import { usePlan } from "../hooks/usePlan";
import { useI18n } from "../i18n";
import { canUse } from "../lib/plan";
import { formatPhone } from "../lib/utils";
import { StatTile } from "./StatTile";
import { UpgradeCard } from "./UpgradeCard";

function Row({ r }: { r: ReminderItem }) {
  const { t, isoDate } = useI18n();
  return (
    <li className="card space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/patients/${r.patient.id}`}
          className="text-lg font-semibold"
        >
          {r.patient.fullName}
        </Link>
        <span className="rounded-full bg-prima-50 px-3 py-1 text-sm font-semibold text-prima-900">
          {t("rem.sends", { date: isoDate(r.sendOn) })}
        </span>
      </div>
      <p className="text-subtext">
        {t("rem.line", {
          who: t(
            r.recipient === "guardian" ? "rem.toGuardian" : "rem.toPatient",
          ),
          phone: formatPhone(r.phone) ?? "",
          date: isoDate(r.dueDate),
          title: r.title,
        })}
      </p>
      <p className="rounded-xl bg-page p-3 text-sm">{r.message}</p>
    </li>
  );
}

export function RemindersView() {
  const { t } = useI18n();
  const plan = usePlan();
  const stats = useSmsStats();
  if (!stats) return null;
  const unlocked = canUse(plan, "smsReminders");

  return (
    <div className="space-y-5">
      <section className="card flex items-start gap-3 border-accent-500 bg-accent-50">
        <Info size={22} className="mt-0.5 shrink-0" />
        <p>
          <strong>{t("rem.notOnTitle")}</strong> {t("rem.notOnText")}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t("rem.queued")}
          value={stats.pending}
          icon={BellRing}
          tone="orange"
        />
        <StatTile
          label={t("rem.sendSoon")}
          value={stats.sendSoon}
          icon={CalendarClock}
        />
        <StatTile label={t("rem.sent")} value={stats.sent} icon={Send} />
        <StatTile
          label={t("rem.reachable", { total: stats.total })}
          value={stats.reachable}
          icon={Smartphone}
        />
      </section>

      {stats.pending === 0 ? (
        <div className="card space-y-1 text-center">
          <p className="text-lg font-semibold">{t("rem.none")}</p>
          <p className="text-subtext">{t("rem.noneHelp")}</p>
        </div>
      ) : unlocked ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {stats.items.slice(0, 100).map((r) => (
            <Row key={r.id} r={r} />
          ))}
        </ul>
      ) : (
        <UpgradeCard
          title={t("rem.upgradeTitle")}
          text={t("rem.upgradeText")}
          cta={t("upgrade.seePro")}
        />
      )}
    </div>
  );
}
