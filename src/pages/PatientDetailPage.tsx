import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  Baby,
  CalendarClock,
  HeartPulse,
  MapPin,
  Pencil,
  Plus,
  Stethoscope,
  Syringe,
  Trash2,
  User,
  Users,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { db } from "../db";
import { usePatients } from "../hooks/usePatients";
import { usePageTitle } from "../hooks/common";
import { useToast } from "../hooks/useToast";
import { calculateAge, isUnder5, isWomanOver12 } from "../lib/age";
import { setImmunizationDeleted } from "../lib/immunizations";
import { setPatientDeleted } from "../lib/patients";
import { setVisitDeleted } from "../lib/visits";
import { formatPhone, todayISO } from "../lib/utils";
import { AddVaccineDialog } from "../components/AddVaccineDialog";
import { PregnantBadge, Under5Badge } from "../components/Badges";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { VisitCard } from "../components/VisitCard";
import { FamilySection } from "../components/FamilySection";
import { SmsSection } from "../components/SmsSection";
import { PrivacyCard } from "../components/PrivacyCard";
import { useCan } from "../hooks/useCan";
import { CompleteRecordCard } from "../components/CompleteRecordCard";
import { useI18n } from "../i18n";

// Clinical names stay in English in every language, so records and reports read the same everywhere
const GRAVIDA = "Gravida";
const PARA = "Para";

type Pending =
  | { kind: "patient" }
  | { kind: "visit"; id: string }
  | { kind: "vaccine"; id: string }
  | null;

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
  href,
}: {
  label: string;
  value?: string | number | null;
  href?: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 last:border-0">
      <dt className="text-subtext">{label}</dt>
      <dd className="text-right font-medium">
        {href && value ? (
          <a href={href} className="font-semibold text-prima-500 underline">
            {show(value)}
          </a>
        ) : (
          show(value)
        )}
      </dd>
    </div>
  );
}

export function PatientDetailPage() {
  const { t, tp, date, isoDate } = useI18n();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { patientMap, loading } = usePatients("");
  const [confirm, setConfirm] = useState<Pending>(null);
  const [addingVaccine, setAddingVaccine] = useState(false);
  const can = useCan();

  const shots = useLiveQuery(async () => {
    const rows = await db.immunizations.where("patientId").equals(id).toArray();
    return rows
      .filter((r) => !r.deletedAt)
      .sort((a, b) => a.dateGiven.localeCompare(b.dateGiven));
  }, [id]);
  const visits = useLiveQuery(async () => {
    const rows = await db.visits.where("patientId").equals(id).toArray();
    return rows
      .filter((v) => !v.deletedAt)
      .sort(
        (a, b) =>
          b.visitDate.localeCompare(a.visitDate) || b.createdAt - a.createdAt,
      );
  }, [id]);

  const p = patientMap.get(id);
  usePageTitle(p ? p.fullName : t("patient.title"));

  if (loading) return null;
  if (!p) {
    return (
      <div className="card mx-auto max-w-md space-y-3 text-center">
        <p className="text-lg font-semibold">{t("patient.notFound")}</p>
        <Link to="/patients" className="btn btn-secondary">
          {t("patient.backToPatients")}
        </Link>
      </div>
    );
  }

  const age = calculateAge(p.dob);
  const ageText = tp(
    age.unit === "years" ? "age.years" : "age.months",
    age.value,
  );
  const ageLine = p.dobEstimated
    ? t("patient.ageEstimated", { age: ageText })
    : ageText;
  const today = todayISO();
  const latestFollowUp = visits?.[0]?.nextDueDate;
  const followUpOverdue = !!latestFollowUp && latestFollowUp < today;
  const showImmunizations = isUnder5(age) || (shots?.length ?? 0) > 0;

  const dialog = {
    patient: {
      title: t("patient.deleteTitle", { name: p.fullName }),
      message: t("patient.deleteMessage"),
      label: t("patient.deleteLabel"),
    },
    visit: {
      title: t("patient.visitDeleteTitle"),
      message: t("patient.visitDeleteMessage"),
      label: t("patient.visitDeleteLabel"),
    },
    vaccine: {
      title: t("patient.vaccineDeleteTitle"),
      message: t("patient.vaccineDeleteMessage"),
      label: t("patient.vaccineDeleteLabel"),
    },
  };

  const runDelete = async () => {
    const target = confirm;
    setConfirm(null);
    if (!target) return;

    if (target.kind === "patient") {
      await setPatientDeleted(p.id, true);
      toast(t("patient.deleted", { name: p.fullName }), "ok", {
        label: t("common.undo"),
        onClick: () => void setPatientDeleted(p.id, false),
      });
      navigate("/patients");
    } else if (target.kind === "visit") {
      await setVisitDeleted(target.id, true);
      toast(t("patient.visitDeleted"), "ok", {
        label: t("common.undo"),
        onClick: () => void setVisitDeleted(target.id, false),
      });
    } else {
      await setImmunizationDeleted(target.id, true);
      toast(t("patient.vaccineDeleted"), "ok", {
        label: t("common.undo"),
        onClick: () => void setImmunizationDeleted(target.id, false),
      });
    }
  };

  return (
    <div className="space-y-5">
      <Link
        to="/patients"
        className="inline-flex items-center gap-2 font-semibold text-prima-500"
      >
        <ArrowLeft size={20} /> {t("nav.patients")}
      </Link>

      <section className="card space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {p.fullName}
            </h1>
            <p className="flex items-center gap-1.5 text-subtext">
              <MapPin size={16} /> {ageLine} ·{" "}
              {t(p.gender === "FEMALE" ? "register.female" : "register.male")} ·{" "}
              {p.village}
            </p>
          </div>
          <span className="rounded-lg bg-prima-50 px-3 py-1 text-lg font-bold tracking-wider text-prima-900">
            {p.cardNumber}
          </span>
        </div>
        <CompleteRecordCard patient={p} />

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
              <CalendarClock size={16} />{" "}
              {t(
                followUpOverdue
                  ? "patient.followUpOverdue"
                  : "patient.followUp",
                {
                  date: isoDate(latestFollowUp),
                },
              )}
            </span>
          )}
        </div>

        {p.initialChiefComplaint && (
          <div className="rounded-xl border-2 border-accent-500/40 bg-accent-50 p-3">
            <p className="text-sm font-semibold text-subtext">
              {t("patient.firstReason")}
            </p>
            <p className="text-base font-medium">{p.initialChiefComplaint}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row">
          <Link
            to={`/patients/${p.id}/visits/new`}
            className="btn btn-accent md:w-52"
          >
            <Stethoscope size={20} className="mr-2" /> {t("patient.addVisit")}
          </Link>
          <Link
            to={`/patients/${p.id}/edit`}
            className="btn btn-secondary md:w-40"
          >
            <Pencil size={20} className="mr-2" /> {t("common.edit")}
          </Link>
          {can("deletePatient") && (
            <button
              type="button"
              className="btn border-2 border-danger text-danger hover:bg-danger/10 md:w-40"
              onClick={() => setConfirm({ kind: "patient" })}
            >
              <Trash2 size={20} className="mr-2" /> {t("common.delete")}
            </button>
          )}
          <Link to={`/patients/${p.id}/card`} className="btn btn-secondary">
            <CreditCard size={20} className="mr-2" /> {t("saved.printCard")}
          </Link>
        </div>
      </section>
      <FamilySection patient={p} />
      <SmsSection patient={p} />
      <PrivacyCard patient={p} />
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Stethoscope size={20} className="text-prima-500" />{" "}
          {t("patient.visitsTitle", { count: visits?.length ?? 0 })}
        </h2>
        {visits && visits.length === 0 ? (
          <div className="card text-center">
            <p className="font-semibold">{t("patient.noVisits")}</p>
            <p className="text-subtext">{t("patient.noVisitsHelp")}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {visits?.map((v) => (
              <VisitCard
                key={v.id}
                v={v}
                dob={p.dob}
                onDelete={() => setConfirm({ kind: "visit", id: v.id })}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title={t("patient.cardPersonal")} icon={User}>
          <Row label={t("register.dateOfBirth")} value={isoDate(p.dob)} />
          <Row
            label={t("patient.gender")}
            value={t(
              p.gender === "FEMALE" ? "register.female" : "register.male",
            )}
          />
          <Row
            label={t("patient.phone")}
            value={formatPhone(p.phone)}
            href={p.phone ? `tel:${p.phone}` : undefined}
          />
          <Row
            label={t("patient.registered")}
            value={date(new Date(p.createdAt))}
          />
        </Card>
        <Card title={t("patient.address")} icon={MapPin}>
          <Row label={t("patient.village")} value={p.village} />
          <Row label={t("facility.lga")} value={p.lga} />
          <Row label={t("facility.state")} value={p.state} />
        </Card>
        <Card title={t("record.nextOfKin")} icon={Users}>
          <Row label={t("patient.kinName")} value={p.nextOfKinName} />
          <Row
            label={t("patient.phone")}
            value={formatPhone(p.nextOfKinPhone)}
            href={p.nextOfKinPhone ? `tel:${p.nextOfKinPhone}` : undefined}
          />
        </Card>
        <Card title={t("patient.cardMedical")} icon={HeartPulse}>
          <Row label={t("patient.nhis")} value={p.nhisNumber} />
          <Row label={t("patient.bloodGroup")} value={p.bloodGroup} />
          <Row label={t("patient.allergies")} value={p.allergies} />
        </Card>
        {isWomanOver12(p.gender, age) && (
          <Card title={t("patient.obstetric")} icon={Baby}>
            <Row label={GRAVIDA} value={p.gravida} />
            <Row label={PARA} value={p.para} />
            <Row
              label={t("patient.pregnant")}
              value={t(p.isPregnant ? "common.yes" : "common.no")}
            />
          </Card>
        )}

        {showImmunizations && (
          <section className="card md:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Syringe size={20} className="text-prima-500" />{" "}
                {t("patient.immunizations")}
              </h2>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-prima-500 px-3 text-sm font-semibold text-prima-500 hover:bg-prima-50"
                onClick={() => setAddingVaccine(true)}
              >
                <Plus size={18} /> {t("patient.addVaccine")}
              </button>
            </div>
            {(shots?.length ?? 0) === 0 ? (
              <p className="py-2 text-subtext">{t("patient.noVaccines")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {shots!.map((s) => {
                  const overdue = !!s.nextDueDate && s.nextDueDate < today;
                  return (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <div>
                        <p className="font-semibold">
                          {t("patient.vaccineDose", {
                            name: s.vaccineName,
                            dose: s.doseNumber,
                          })}
                        </p>
                        <p className="text-sm text-subtext">
                          {t("patient.vaccineGiven", {
                            date: isoDate(s.dateGiven),
                          })}
                          {s.nextDueDate && (
                            <span
                              className={
                                overdue ? "font-semibold text-danger" : ""
                              }
                            >
                              {" · "}
                              {t(
                                overdue
                                  ? "patient.vaccineDueOverdue"
                                  : "patient.vaccineDue",
                                {
                                  label:
                                    s.nextVaccineLabel ?? t("patient.nextDose"),
                                  date: isoDate(s.nextDueDate),
                                },
                              )}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={t("patient.vaccineDeleteAria", {
                          name: s.vaccineName,
                          dose: s.doseNumber,
                        })}
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-subtext hover:bg-page hover:text-ink"
                        onClick={() =>
                          setConfirm({ kind: "vaccine", id: s.id })
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title={dialog[confirm.kind].title}
          message={dialog[confirm.kind].message}
          confirmLabel={dialog[confirm.kind].label}
          onConfirm={runDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      {addingVaccine && (
        <AddVaccineDialog
          patient={p}
          existing={shots ?? []}
          onClose={() => setAddingVaccine(false)}
        />
      )}
    </div>
  );
}
