// Practice mode ("demo"): a second, separate database on the phone with made-up patients. It can never touch the real database,
// and while it is on the page cannot reach the internet (see demoGuard.ts).
//
// The switch lives in the browser's storage, so it survives a restart. Two ways to switch it:
//   ?demo=1 in the address turns practice mode on, and ?demo=0 always turns it off (an escape hatch, if the banner is ever not reachable).
// This file decides when it is first loaded, before the database is opened, so the right database is used from the first moment.
import type { LocalAccount } from "./auth";
import type { FacilityInfo } from "./config";

const FLAG = "prima_demo";
export const REAL_DB = "prima";
export const DEMO_DB = "prima-demo";

function start(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const asked = params.get("demo");
    if (asked === "1") localStorage.setItem(FLAG, "1");
    if (asked === "0") localStorage.removeItem(FLAG);
    if (asked !== null) {
      params.delete("demo"); // the address goes back to normal, so a bookmark or a refresh does not repeat the request
      const rest = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname +
          (rest ? `?${rest}` : "") +
          window.location.hash,
      );
    }
    return localStorage.getItem(FLAG) === "1";
  } catch {
    return false; // storage blocked or unavailable: always the real app, never practice mode by accident
  }
}

const demo = start();
export const isDemo = () => demo;
export const dbName = () => (demo ? DEMO_DB : REAL_DB);

// Made up, and obviously so. The id is not a real facility id, so even a backup file made here is refused by a real facility.
export const DEMO_ACCOUNT = {
  userId: "demo-user",
  email: "practice@prima.invalid",
  name: "Practice nurse",
  role: "admin",
} satisfies LocalAccount;
export const DEMO_FACILITY = {
  id: "demo-practice",
  name: "Practice clinic",
  code: "DEMO",
  lga: "Practice LGA",
  state: "Practice state",
  plan: "pro",
} satisfies FacilityInfo;

const home = () => window.location.replace("/");

// Switch practice mode on and start again from the front door. Returns false if the browser would not remember the switch.
export function enterDemo(go: () => void = home): boolean {
  try {
    localStorage.setItem(FLAG, "1");
    if (localStorage.getItem(FLAG) !== "1") return false;
  } catch {
    return false;
  }
  go();
  return true;
}

// Switch it off and go back to the real app. The practice data is deleted by whoever calls this (it needs the database).
export function leaveDemo(go: () => void = home): void {
  try {
    localStorage.removeItem(FLAG);
  } catch {
    /* storage blocked: ?demo=0 in the address still works */
  }
  go();
}
