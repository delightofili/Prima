import { useSyncExternalStore } from "react";

// Chrome's install event is not in TypeScript's built-in types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Snapshot {
  canPrompt: boolean; // the browser is ready to show its install dialog
  installed: boolean; // already running as an installed app
  ios: boolean; // iPhone or iPad Safari: no install button exists, only the Share menu
}

const DISMISS_KEY = "prima_install_dismissed";
const FOURTEEN_DAYS = 14 * 86_400_000;

const standaloneQuery = window.matchMedia("(display-mode: standalone)");
const isStandalone = () =>
  standaloneQuery.matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

let deferred: BeforeInstallPromptEvent | null = null;
let installed = isStandalone();
let snapshot: Snapshot = {
  canPrompt: false,
  installed,
  ios: isIos() && !installed,
};
const listeners = new Set<() => void>();

function emit() {
  snapshot = {
    canPrompt: deferred !== null,
    installed,
    ios: isIos() && !installed,
  };
  listeners.forEach((l) => l());
}

export function initInstall() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own button, not the browser's small bar
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
  standaloneQuery.addEventListener("change", () => {
    installed = isStandalone();
    emit();
  });
}

export async function promptInstall(): Promise<
  "accepted" | "dismissed" | "unavailable"
> {
  if (!deferred) return "unavailable";
  const event = deferred;
  deferred = null; // an install prompt can be used only once
  emit();
  await event.prompt();
  return (await event.userChoice).outcome;
}

export const installBannerHidden = () => {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY));
    return t > 0 && Date.now() - t < FOURTEEN_DAYS;
  } catch {
    return false;
  }
};
export const dismissInstallBanner = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export const useInstall = () => useSyncExternalStore(subscribe, () => snapshot);
