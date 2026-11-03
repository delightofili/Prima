import { useEffect, useSyncExternalStore } from "react";
import {
  BillError,
  clearPending,
  confirmPayment,
  fetchBilling,
  type Billing,
  type BillProblem,
  rememberPending,
} from "../lib/billing";

// What the plans screen knows, kept in one small shared store so leaving the screen and coming back does not start over
export type ReturnState =
  | { kind: "none" }
  | { kind: "verifying" }
  | { kind: "paid" }
  | { kind: "waiting"; reference: string } // the bank has not confirmed yet
  | { kind: "notPaid" } // abandoned or failed at the checkout
  | { kind: "refused"; reference: string; problem: BillProblem } // money may have moved but the server did not accept it: someone must look
  | { kind: "error"; reference: string; problem: BillProblem };

interface Snapshot {
  billing: Billing | null;
  problem: BillProblem | null;
  loaded: boolean;
  back: ReturnState;
}

let snap: Snapshot = {
  billing: null,
  problem: null,
  loaded: false,
  back: { kind: "none" },
};
const listeners = new Set<() => void>();
const set = (patch: Partial<Snapshot>) => {
  snap = { ...snap, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

let inFlight: Promise<void> | null = null;

export function loadBilling(): Promise<void> {
  inFlight ??= (async () => {
    try {
      set({ billing: await fetchBilling(), problem: null, loaded: true });
    } catch (e) {
      set({
        problem: e instanceof BillError ? e.problem : "failed",
        loaded: true,
      }); // what was loaded before stays on screen
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

// The person is back from Paystack: ask the server whether it was paid, then refresh everything that depends on the plan
let checking: { reference: string; run: Promise<boolean> } | null = null;

// Only one check per payment at a time: opening the screen twice (or a double effect) must not ask the server twice
// It resolves true when the payment is settled (paid, not completed, or refused) and false when it must be checked again later
export function checkPayment(
  reference: string,
  afterPaid: () => Promise<void>,
): Promise<boolean> {
  if (checking?.reference === reference) return checking.run;
  const run = doCheck(reference, afterPaid).finally(() => {
    if (checking?.run === run) checking = null;
  });
  checking = { reference, run };
  return run;
}

async function doCheck(
  reference: string,
  afterPaid: () => Promise<void>,
): Promise<boolean> {
  set({ back: { kind: "verifying" } });
  try {
    const r = await confirmPayment(reference);
    if (r.paid) {
      clearPending();
      await afterPaid(); // the app's own idea of the facility (and so every locked feature) updates
      await loadBilling();
      set({ back: { kind: "paid" } });
      return true;
    }
    if (r.status === "abandoned" || r.status === "failed") {
      clearPending();
      set({ back: { kind: "notPaid" } });
      return true;
    }
    rememberPending(reference); // pending, ongoing, queued...: it is not settled, so it must survive a reload
    set({ back: { kind: "waiting", reference } });
    return false;
  } catch (e) {
    const problem = e instanceof BillError ? e.problem : "failed";
    if (
      problem === "amount" ||
      problem === "currency" ||
      problem === "plan" ||
      problem === "failed_before" ||
      problem === "mismatch"
    ) {
      clearPending(); // asking again would give the same answer
      set({ back: { kind: "refused", reference, problem } });
      return true;
    }
    rememberPending(reference); // no connection, or the server was busy: keep the reference, so it can be checked again
    set({ back: { kind: "error", reference, problem } });
    return false;
  }
}

export const dismissReturn = () => set({ back: { kind: "none" } });

export function useBilling() {
  const s = useSyncExternalStore(
    subscribe,
    () => snap,
    () => snap,
  );
  useEffect(() => {
    void loadBilling();
  }, []);
  return { ...s, refresh: loadBilling };
}
