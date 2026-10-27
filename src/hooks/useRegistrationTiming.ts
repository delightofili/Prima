import { useEffect, useRef } from "react";
import { saveTiming, timingEnabled } from "../lib/timingStore";

// During a usability session: how long a registration took and how many taps it needed.
export function useRegistrationTiming(kind: "quick" | "full") {
  const startedAt = useRef<number | null>(null);
  const taps = useRef(0);
  const on = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now(); // read when the form opens, not while it is being drawn
    on.current = timingEnabled();
    if (!on.current) return;
    const count = () => {
      taps.current += 1;
    };
    document.addEventListener("pointerdown", count, true); // capture phase: counts every tap, even ones a button stops
    return () => document.removeEventListener("pointerdown", count, true);
  }, []);

  return {
    finish: () => {
      if (on.current && startedAt.current !== null) {
        void saveTiming({
          kind,
          ms: Date.now() - startedAt.current,
          taps: taps.current,
          at: Date.now(),
        });
      }
    },
  };
}
