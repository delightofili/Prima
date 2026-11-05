// A way to see the crash screen on purpose, to prove it works. It exists only for someone who turned debugging on:
// in the browser console run   localStorage.setItem("prima_debug", "1")   then reload, then   primaCrash("screen")   or   primaCrash("script")
// Nobody else can trigger it, and it does nothing to any data.

declare global {
  interface Window {
    primaCrash?: (kind: "screen" | "script") => void;
  }
}

let on = false;
const listeners = new Set<() => void>();
export const crashTestSubscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export const crashTestOn = () => on;

export function installCrashTest(): void {
  try {
    if (localStorage.getItem("prima_debug") !== "1") return;
  } catch {
    return;
  }
  window.primaCrash = (kind) => {
    if (kind === "script") {
      setTimeout(() => {
        throw new Error("Test crash (on purpose, from primaCrash)");
      });
      return;
    }
    on = true; // CrashProbe throws while this is true
    listeners.forEach((l) => l());
    setTimeout(() => {
      on = false; // so "Try again" works afterwards
      listeners.forEach((l) => l());
    }, 80);
  };
}
