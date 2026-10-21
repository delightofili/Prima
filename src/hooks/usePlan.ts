import { useEffect, useState } from "react";
import { PLAN_EVENT, planOverride, type Plan } from "../lib/plan";
import { useAuth } from "./useAuth";

export function usePlan(): Plan {
  const { facility } = useAuth();
  const [override, setOverride] = useState(planOverride);

  useEffect(() => {
    const sync = () => setOverride(planOverride());
    window.addEventListener(PLAN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PLAN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return override ?? facility?.plan ?? "free";
}
