import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Phone, Stethoscope, Syringe } from "lucide-react";
import { usePlan } from "../hooks/usePlan";
import { useFollowUps, type FollowUpItem } from "../hooks/useFollowUps";
import { calculateAge, isUnder5 } from "../lib/age";
import { canUse } from "../lib/plan";
import { formatDate } from "../lib/utils";
import { UpgradeCard } from "./UpgradeCard";

const WINDOWS = [7, 14, 30];

function dueText(days: number, dueDate: string) {
  if (days < 0) return `Overdue by ${-days} ${-days === 1 ? "day" : "days"}`;
  if (days === 0) return "Due today";
  return `Due in ${days} ${days === 1 ? "day" : "days"} · ${formatDate(dueDate)}`;
}

function Row({ item }: { item: FollowUpItem }) {
  const p = item.patient;
  // For young children the caregiver is the person to call
  const phone = isUnder5(calculateAge(p.dob))
    ? p.nextOfKinPhone
    : (p.phone ?? p.nextOfKinPhone);
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
            {dueText(item.days, item.dueDate)}
          </span>
        </p>
      </Link>
      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label={`Call about ${p.fullName}`}
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-prima-500 text-white hover:bg-prima-900"
        >
          <Phone size={20} />
        </a>
      )}
    </li>
  );
}

function Section({ title, items }: { title: string; items: FollowUpItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">
        {title} ({items.length})
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((i) => (
          <Row key={i.key} item={i} />
        ))}
      </ul>
    </section>
  );
}

export function FollowUpsView() {
  const plan = usePlan();
  const [windowDays, setWindowDays] = useState(7);
  const items = useFollowUps(windowDays);

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
            {d} days
          </button>
        ))}
      </div>

      <section className="card space-y-3">
        <div className="flex items-center gap-3">
          <CalendarClock size={28} className="text-prima-500" />
          <div>
            <p className="text-2xl font-bold">
              {items.length} {items.length === 1 ? "follow-up" : "follow-ups"}
            </p>
            <p className="text-subtext">
              {overdue.length} overdue · {today.length} today ·{" "}
              {upcoming.length} upcoming
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
          <p className="text-lg font-semibold">All caught up</p>
          <p className="text-subtext">
            Nothing is overdue or due in the next {windowDays} days.
          </p>
        </div>
      ) : unlocked ? (
        <>
          <Section title="Overdue" items={overdue} />
          <Section title="Due today" items={today} />
          <Section title="Coming up" items={upcoming} />
        </>
      ) : (
        <UpgradeCard
          title="See who is due, and call them"
          text="The Pro plan lists every patient with an overdue or upcoming follow-up or vaccine, with one tap to call the patient or caregiver."
        />
      )}
    </div>
  );
}
