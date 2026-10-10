import { useEffect, useState } from "react";
import { PLAN_EVENT, getPlan, type Plan } from "../lib/plan";

export function usePlan(): Plan {
  const [plan, setPlanState] = useState<Plan>(getPlan);

  useEffect(() => {
    const sync = () => setPlanState(getPlan());
    window.addEventListener(PLAN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PLAN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return plan;
}
