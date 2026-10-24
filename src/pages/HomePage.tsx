import { Link } from "react-router-dom";
import { Baby, HeartPulse, Search, UserPlus, Users } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { calculateAge, isUnder5 } from "../lib/age";
import { config } from "../lib/config";
import { todayISO } from "../lib/utils";
import { Logo } from "../components/Logo";
import { PatientListCard } from "../components/PatientListCard";
import { StatTile } from "../components/StatTile";
import { usePageTitle } from "../hooks/common";
import { CalendarClock, ChevronRight } from "lucide-react";
import { GloveToggle } from "../components/GloveToggle";
import { useFollowUps } from "../hooks/useFollowUps";
import { InstallBanner } from "../components/InstallCard";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function HomePage() {
  usePageTitle("Home");
  const { results: patients, loading } = usePatients("");
  const followUps = useFollowUps(7);
  const today = todayISO();

  const registeredToday = patients.filter(
    (p) => new Date(p.createdAt).toLocaleDateString("en-CA") === today,
  ).length;
  const under5 = patients.filter((p) => isUnder5(calculateAge(p.dob))).length;
  const pregnant = patients.filter((p) => p.isPregnant).length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-prima-500 p-6 text-white md:p-8">
        <p className="text-prima-50">
          {new Date().toLocaleDateString("en-NG", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
          {greeting()}
        </h1>
        <p className="mt-1 text-lg text-prima-50">
          {config.facilityName} · {config.facilityLga}, {config.facilityState}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/register"
            className="btn bg-white text-prima-900 hover:bg-prima-50 sm:w-60"
          >
            <UserPlus size={20} className="mr-2" /> Register patient
          </Link>
          <Link
            to="/patients"
            className="btn border-2 border-white text-white hover:bg-prima-900 sm:w-60"
          >
            <Search size={20} className="mr-2" /> Find a patient
          </Link>
        </div>
      </section>
      <InstallBanner />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total patients" value={patients.length} icon={Users} />
        <StatTile
          label="Registered today"
          value={registeredToday}
          icon={UserPlus}
        />
        <StatTile label="Under 5" value={under5} icon={Baby} tone="orange" />
        <StatTile
          label="Pregnant"
          value={pregnant}
          icon={HeartPulse}
          tone="pink"
        />
      </section>
      <Link
        to="/dashboard?tab=followups"
        className="card flex items-center justify-between gap-3 border-accent-500 hover:bg-accent-50"
      >
        <span className="flex items-center gap-3">
          <CalendarClock size={26} />
          <span>
            <span className="block text-lg font-bold">
              {followUps?.length ?? 0} follow-ups due
            </span>
            <span className="text-subtext">Overdue and the next 7 days</span>
          </span>
        </span>
        <ChevronRight size={22} className="text-subtext" />
      </Link>

      {!loading && patients.length === 0 ? (
        <section className="card space-y-3 py-10 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <p className="text-lg font-semibold">Welcome to Prima</p>
          <div className="md:hidden">
            <GloveToggle />
          </div>
          <p className="mx-auto max-w-md text-subtext">
            Your register is empty. Register your first patient. It works even
            without network.
          </p>
          <Link to="/register" className="btn btn-primary mx-auto sm:w-60">
            Register first patient
          </Link>
        </section>
      ) : (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recently registered</h2>
            <Link to="/patients" className="font-semibold text-prima-500">
              View all
            </Link>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {patients.slice(0, 6).map((p) => (
              <li key={p.id}>
                <PatientListCard patient={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-sm text-subtext">
        Prima works without network. Records are saved on this device and sync
        automatically.
      </p>
    </div>
  );
}
