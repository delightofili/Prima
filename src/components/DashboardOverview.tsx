import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Baby,
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  MapPin,
  Stethoscope,
  UserPlus,
  Users,
  MessageSquare,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useFollowUps } from "../hooks/useFollowUps";
import { monthOf, shiftMonth, todayISO } from "../lib/utils";
import { GenderDonut, HorizontalBars, VerticalBars } from "./Charts";
import { COLORS } from "../lib/chartColors";
import { StatTile } from "./StatTile";
import { useSmsStats } from "../hooks/useSmsStats";
import { useI18n } from "../i18n";
import { useMonthLabel } from "../hooks/useMonthLabel";

const ARROW =
  "inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-page disabled:opacity-30";

function ChartCard({
  title,
  icon: Icon,
  wide,
  children,
}: {
  title: string;
  icon: LucideIcon;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`card space-y-3 ${wide ? "lg:col-span-2" : ""}`}>
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Icon size={20} className="text-prima-500" /> {title}
      </h2>
      {children}
    </section>
  );
}

const Empty = ({ text }: { text: string }) => (
  <p className="py-8 text-center text-subtext">{text}</p>
);

export function DashboardOverview() {
  const { t } = useI18n();
  const monthLabel = useMonthLabel();
  const [month, setMonth] = useState(monthOf(todayISO()));
  const result = useDashboardStats(month);
  const followUps = useFollowUps(7);
  const sms = useSmsStats();
  const isCurrent = month === monthOf(todayISO());

  if (!result) return null;
  const { stats, ms } = result;

  if (stats.total === 0) {
    return (
      <div className="card space-y-3 py-10 text-center">
        <p className="text-lg font-semibold">{t("dash.noData")}</p>
        <p className="text-subtext">{t("dash.noDataHelp")}</p>
        <Link to="/register" className="btn btn-primary mx-auto sm:w-60">
          {t("home.registerFirst")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label={t("dash.prevMonth")}
          className={ARROW}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <ChevronLeft size={22} />
        </button>
        <p className="text-lg font-bold">{monthLabel(month)}</p>
        <button
          type="button"
          aria-label={t("dash.nextMonth")}
          className={ARROW}
          disabled={isCurrent}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t("home.totalPatients")}
          value={stats.total}
          icon={Users}
        />
        <StatTile
          label={t("dash.newMonth")}
          value={stats.newInMonth}
          icon={UserPlus}
        />
        <StatTile
          label={t("dash.visitsMonth")}
          value={stats.visitsInMonth}
          icon={Stethoscope}
        />
        <StatTile
          label={t("badge.under5")}
          value={stats.under5}
          icon={Baby}
          tone="orange"
        />
        <StatTile
          label={t("patient.pregnant")}
          value={stats.pregnant}
          icon={HeartPulse}
          tone="pink"
        />
        <Link to="/dashboard?tab=followups">
          <StatTile
            label={t("dash.followUps7")}
            value={followUps?.length ?? 0}
            icon={CalendarClock}
            tone="orange"
          />
        </Link>
        <Link to="/dashboard?tab=reminders">
          <StatTile
            label={t("dash.smsQueued")}
            value={sms?.pending ?? 0}
            icon={MessageSquare}
            tone="orange"
          />
        </Link>
        <Link to="/dashboard?tab=reminders">
          <StatTile
            label={t("dash.reachable")}
            value={sms?.reachable ?? 0}
            icon={Smartphone}
          />
        </Link>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("patient.gender")} icon={Users}>
          <GenderDonut female={stats.female} male={stats.male} />
        </ChartCard>

        <ChartCard title={t("dash.ageGroups")} icon={Calendar}>
          <VerticalBars
            data={stats.ageGroups}
            xKey="label"
            labels
            series={[
              { key: "value", name: t("nav.patients"), color: COLORS.teal },
            ]}
          />
        </ChartCard>

        <ChartCard title={t("dash.activity")} icon={Activity} wide>
          {stats.newInMonth + stats.visitsInMonth === 0 ? (
            <Empty text={t("dash.noActivity")} />
          ) : (
            <VerticalBars
              data={stats.perDay}
              xKey="day"
              series={[
                {
                  key: "registrations",
                  name: t("dash.registrations"),
                  color: COLORS.tealDark,
                },
                { key: "visits", name: t("dash.visits"), color: "#14B8A6" },
              ]}
            />
          )}
        </ChartCard>

        <ChartCard title={t("dash.topDiagnoses")} icon={Stethoscope}>
          {stats.topDiagnoses.length ? (
            <HorizontalBars data={stats.topDiagnoses} color={COLORS.teal} />
          ) : (
            <Empty text={t("dash.noDiagnoses")} />
          )}
        </ChartCard>

        <ChartCard title={t("dash.topVillages")} icon={MapPin}>
          <HorizontalBars data={stats.topVillages} color={COLORS.tealDark} />
        </ChartCard>
      </div>

      {import.meta.env.DEV && (
        <p className="text-center text-sm text-subtext">
          {t("dash.devStats", { ms: ms.toFixed(1) })}
        </p>
      )}
    </div>
  );
}
