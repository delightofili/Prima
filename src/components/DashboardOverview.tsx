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
  type LucideIcon,
} from "lucide-react";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useFollowUps } from "../hooks/useFollowUps";
import { monthLabel, monthOf, shiftMonth, todayISO } from "../lib/utils";
import { GenderDonut, HorizontalBars, VerticalBars } from "./Charts";
import { COLORS } from "../lib/chartColors";
import { StatTile } from "./StatTile";

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
  const [month, setMonth] = useState(monthOf(todayISO()));
  const result = useDashboardStats(month);
  const followUps = useFollowUps(7);
  const isCurrent = month === monthOf(todayISO());

  if (!result) return null;
  const { stats, ms } = result;

  if (stats.total === 0) {
    return (
      <div className="card space-y-3 py-10 text-center">
        <p className="text-lg font-semibold">No data yet</p>
        <p className="text-subtext">
          Register patients and the dashboard fills in by itself.
        </p>
        <Link to="/register" className="btn btn-primary mx-auto sm:w-60">
          Register first patient
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Previous month"
          className={ARROW}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <ChevronLeft size={22} />
        </button>
        <p className="text-lg font-bold">{monthLabel(month)}</p>
        <button
          type="button"
          aria-label="Next month"
          className={ARROW}
          disabled={isCurrent}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Total patients" value={stats.total} icon={Users} />
        <StatTile
          label="New this month"
          value={stats.newInMonth}
          icon={UserPlus}
        />
        <StatTile
          label="Visits this month"
          value={stats.visitsInMonth}
          icon={Stethoscope}
        />
        <StatTile
          label="Under 5"
          value={stats.under5}
          icon={Baby}
          tone="orange"
        />
        <StatTile
          label="Pregnant"
          value={stats.pregnant}
          icon={HeartPulse}
          tone="pink"
        />
        <Link to="/dashboard?tab=followups">
          <StatTile
            label="Follow-ups due (7 days)"
            value={followUps?.length ?? 0}
            icon={CalendarClock}
            tone="orange"
          />
        </Link>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Gender" icon={Users}>
          <GenderDonut female={stats.female} male={stats.male} />
        </ChartCard>

        <ChartCard title="Age groups" icon={Calendar}>
          <VerticalBars
            data={stats.ageGroups}
            xKey="label"
            labels
            series={[{ key: "value", name: "Patients", color: COLORS.teal }]}
          />
        </ChartCard>

        <ChartCard title="Activity per day" icon={Activity} wide>
          {stats.newInMonth + stats.visitsInMonth === 0 ? (
            <Empty text="No registrations or visits this month." />
          ) : (
            <VerticalBars
              data={stats.perDay}
              xKey="day"
              series={[
                {
                  key: "registrations",
                  name: "Registrations",
                  color: COLORS.tealDark,
                },
                { key: "visits", name: "Visits", color: "#14B8A6" },
              ]}
            />
          )}
        </ChartCard>

        <ChartCard title="Top diagnoses this month" icon={Stethoscope}>
          {stats.topDiagnoses.length ? (
            <HorizontalBars data={stats.topDiagnoses} color={COLORS.teal} />
          ) : (
            <Empty text="No diagnoses recorded this month." />
          )}
        </ChartCard>

        <ChartCard title="Top villages (all patients)" icon={MapPin}>
          <HorizontalBars data={stats.topVillages} color={COLORS.tealDark} />
        </ChartCard>
      </div>

      {import.meta.env.DEV && (
        <p className="text-center text-sm text-subtext">
          Stats computed on this device in {ms.toFixed(1)} ms
        </p>
      )}
    </div>
  );
}
