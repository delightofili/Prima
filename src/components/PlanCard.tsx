import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Gauge } from "lucide-react";
import { db } from "../db";
import { useOnline } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import { useI18n } from "../i18n";
import { PLAN_NAME_KEY } from "../lib/plan";
import { supabase } from "../lib/supabase";
import { LIMIT_TAG } from "../lib/syncHealth";
import { MAX_STAFF } from "../lib/team";
import { SectionTitle } from "./FormBits";

interface Usage {
  plan: string;
  patients: number;
  patient_limit: number | null;
  staff: number;
  staff_limit: number;
}

export function PlanCard() {
  const { t, tp } = useI18n();
  const { facility, role } = useAuth();
  const { total } = usePatients("");
  const online = useOnline();
  const [cloud, setCloud] = useState<Usage | null>(null);
  const parked = useLiveQuery(
    () =>
      db.syncQueue
        .filter(
          (i) =>
            i.table === "patients" &&
            i.status === "failed" &&
            !!i.lastError?.startsWith(LIMIT_TAG),
        )
        .count(),
    [],
    0,
  );
  const plan = facility?.plan ?? "free";

  useEffect(() => {
    if (!online) return;
    let alive = true;
    void supabase.rpc("plan_usage").then(({ data, error }) => {
      if (!alive || error || !Array.isArray(data) || data.length === 0) return;
      setCloud(data[0] as Usage);
    });
    return () => {
      alive = false;
    };
  }, [online, total]);

  const limit = cloud?.patient_limit ?? (plan === "free" ? 200 : null);

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={Gauge} title={t("plan.usageTitle")} />
      <p className="text-lg font-bold">
        {t("plan.name", { plan: t(PLAN_NAME_KEY[plan]) })}
      </p>
      <ul className="space-y-1">
        <li>
          {t("plan.patientsPhone", { count: total })}
          {cloud ? ` · ${t("plan.inCloud", { count: cloud.patients })}` : ""}
          {` · ${limit ? t("plan.limit", { count: limit }) : t("plan.noLimit")}`}
        </li>
        <li>
          {t("plan.staff", {
            used: cloud ? cloud.staff : "?",
            max: MAX_STAFF[plan],
          })}
        </li>
      </ul>
      {parked > 0 && (
        <p className="rounded-xl bg-accent-50 p-3 font-medium">
          {tp("plan.parked", parked)}
        </p>
      )}
      {role === "admin" && (
        <Link to="/plans" className="btn btn-secondary sm:w-48">
          {t("plan.seePlans")}
        </Link>
      )}
    </section>
  );
}
