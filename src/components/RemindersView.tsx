import { Link } from "react-router-dom";
import { BellRing, CalendarClock, Info, Send, Smartphone } from "lucide-react";
import { useSmsStats, type ReminderItem } from "../hooks/useSmsStats";
import { usePlan } from "../hooks/usePlan";
import { canUse } from "../lib/plan";
import { formatDate, formatPhone } from "../lib/utils";
import { StatTile } from "./StatTile";
import { UpgradeCard } from "./UpgradeCard";

function Row({ r }: { r: ReminderItem }) {
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
          Sends {formatDate(r.sendOn)}
        </span>
      </div>
      <p className="text-subtext">
        {r.recipient === "guardian" ? "To the guardian" : "To the patient"} ·{" "}
        {formatPhone(r.phone)} · for the visit on {formatDate(r.dueDate)} (
        {r.title})
      </p>
      <p className="rounded-xl bg-page p-3 text-sm">{r.message}</p>
    </li>
  );
}

export function RemindersView() {
  const plan = usePlan();
  const stats = useSmsStats();
  if (!stats) return null;
  const unlocked = canUse(plan, "smsReminders");

  return (
    <div className="space-y-5">
      <section className="card flex items-start gap-3 border-accent-500 bg-accent-50">
        <Info size={22} className="mt-0.5 shrink-0" />
        <p>
          <strong>Sending is not switched on yet.</strong> Prima keeps the queue
          ready and records consent. Sending texts needs an SMS provider account
          and credit, so nothing is sent and nothing is charged.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Queued"
          value={stats.pending}
          icon={BellRing}
          tone="orange"
        />
        <StatTile
          label="To send in 7 days"
          value={stats.sendSoon}
          icon={CalendarClock}
        />
        <StatTile label="Sent" value={stats.sent} icon={Send} />
        <StatTile
          label={`Reachable (of ${stats.total})`}
          value={stats.reachable}
          icon={Smartphone}
        />
      </section>

      {stats.pending === 0 ? (
        <div className="card space-y-1 text-center">
          <p className="text-lg font-semibold">Nothing queued</p>
          <p className="text-subtext">
            A reminder appears when a consenting patient or guardian has a
            follow-up date or a vaccine coming due.
          </p>
        </div>
      ) : unlocked ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {stats.items.slice(0, 100).map((r) => (
            <Row key={r.id} r={r} />
          ))}
        </ul>
      ) : (
        <UpgradeCard
          title="See the reminder queue with Pro"
          text="Pro shows who will be reminded, when, and the exact message, so you can check it before sending is switched on."
          cta="See Pro plan"
        />
      )}
    </div>
  );
}
