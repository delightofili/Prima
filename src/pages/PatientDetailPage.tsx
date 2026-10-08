import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  Baby,
  CalendarClock,
  HeartPulse,
  MapPin,
  Stethoscope,
  Syringe,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { db } from "../db";
import { usePatients } from "../hooks/usePatients";
import { usePageTitle } from "../hooks/common";
import { calculateAge, isUnder5, isWomanOver12 } from "../lib/age";
import { formatDate, todayISO } from "../lib/utils";
import { PregnantBadge, Under5Badge } from "../components/Badges";
import { VisitCard } from "../components/VisitCard";

const show = (v?: string | number | null) =>
  v === undefined || v === null || v === "" ? "—" : String(v);

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
        <Icon size={20} className="text-prima-500" /> {title}
      </h2>
      <dl>{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 last:border-0">
      <dt className="text-subtext">{label}</dt>
      <dd className="text-right font-medium">{show(value)}</dd>
    </div>
  );
}

export function PatientDetailPage() {
  const { id = "" } = useParams();
  const { patientMap, loading } = usePatients("");
  const shots = useLiveQuery(
    () => db.immunizations.where("patientId").equals(id).sortBy("dateGiven"),
    [id],
  );
  const visits = useLiveQuery(async () => {
    const rows = await db.visits.where("patientId").equals(id).toArray();
    return rows.sort(
      (a, b) =>
        b.visitDate.localeCompare(a.visitDate) || b.createdAt - a.createdAt,
    );
  }, [id]);

  const p = patientMap.get(id);
  usePageTitle(p ? p.fullName : "Patient");

  if (loading) return null;
  if (!p) {
    return (
      <div className="card mx-auto max-w-md space-y-3 text-center">
        <p className="text-lg font-semibold">Patient not found</p>
        <Link to="/patients" className="btn btn-secondary">
          Back to patients
        </Link>
      </div>
    );
  }

  const age = calculateAge(p.dob);
  const today = todayISO();
  const latestFollowUp = visits?.[0]?.nextDueDate;
  const followUpOverdue = !!latestFollowUp && latestFollowUp < today;

  return (
    <div className="space-y-5">
      <Link
        to="/patients"
        className="inline-flex items-center gap-2 font-semibold text-prima-500"
      >
        <ArrowLeft size={20} /> Patients
      </Link>

      <section className="card space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {p.fullName}
            </h1>
            <p className="flex items-center gap-1.5 text-subtext">
              <MapPin size={16} /> {age.label} ·{" "}
              {p.gender === "FEMALE" ? "Female" : "Male"} · {p.village}
            </p>
          </div>
          <span className="rounded-lg bg-prima-50 px-3 py-1 text-lg font-bold tracking-wider text-prima-900">
            {p.cardNumber}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {p.isPregnant && <PregnantBadge />}
          {isUnder5(age) && <Under5Badge />}
          {latestFollowUp && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                followUpOverdue
                  ? "bg-danger/10 text-danger"
                  : "bg-accent-50 text-ink"
              }`}
            >
              <CalendarClock size={16} /> Follow-up {formatDate(latestFollowUp)}
              {followUpOverdue && " (overdue)"}
            </span>
          )}
        </div>

        {p.initialChiefComplaint && (
          <div className="rounded-xl border-2 border-accent-500/40 bg-accent-50 p-3">
            <p className="text-sm font-semibold text-subtext">
              Reason for first registration
            </p>
            <p className="text-base font-medium">{p.initialChiefComplaint}</p>
          </div>
        )}

        <Link
          to={`/patients/${p.id}/visits/new`}
          className="btn btn-accent md:w-56"
        >
          <Stethoscope size={20} className="mr-2" /> Add visit
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Stethoscope size={20} className="text-prima-500" /> Visits (
          {visits?.length ?? 0})
        </h2>
        {visits && visits.length === 0 ? (
          <div className="card text-center">
            <p className="font-semibold">No visits recorded yet</p>
            <p className="text-subtext">
              Use “Add visit” to record complaints, vitals and diagnosis.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {visits?.map((v) => (
              <VisitCard key={v.id} v={v} dob={p.dob} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Personal" icon={User}>
          <Row label="Date of birth" value={formatDate(p.dob)} />
          <Row
            label="Gender"
            value={p.gender === "FEMALE" ? "Female" : "Male"}
          />
          <Row label="Phone" value={p.phone} />
          <Row
            label="Registered"
            value={formatDate(
              new Date(p.createdAt).toLocaleDateString("en-CA"),
            )}
          />
        </Card>
        <Card title="Address" icon={MapPin}>
          <Row label="Village" value={p.village} />
          <Row label="LGA" value={p.lga} />
          <Row label="State" value={p.state} />
        </Card>
        <Card title="Next of kin" icon={Users}>
          <Row label="Name" value={p.nextOfKinName} />
          <Row label="Phone" value={p.nextOfKinPhone} />
        </Card>
        <Card title="Medical" icon={HeartPulse}>
          <Row label="NHIS number" value={p.nhisNumber} />
          <Row label="Blood group" value={p.bloodGroup} />
          <Row label="Allergies" value={p.allergies} />
        </Card>
        {isWomanOver12(p.gender, age) && (
          <Card title="Obstetric" icon={Baby}>
            <Row label="Gravida" value={p.gravida} />
            <Row label="Para" value={p.para} />
            <Row label="Pregnant" value={p.isPregnant ? "Yes" : "No"} />
          </Card>
        )}
        {(shots?.length ?? 0) > 0 && (
          <section className="card md:col-span-2">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
              <Syringe size={20} className="text-prima-500" /> Immunizations
            </h2>
            <ul className="divide-y divide-line">
              {shots!.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap justify-between gap-2 py-2"
                >
                  <span className="font-semibold">
                    {s.vaccineName} · dose {s.doseNumber}
                  </span>
                  <span className="text-subtext">
                    Given {formatDate(s.dateGiven)}
                    {s.nextDueDate && (
                      <>
                        {" · "}
                        <span
                          className={
                            s.nextDueDate < today
                              ? "font-semibold text-danger"
                              : ""
                          }
                        >
                          Next due {formatDate(s.nextDueDate)}
                          {s.nextDueDate < today && " (overdue)"}
                        </span>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
