export interface VersionInfo {
  running: string; // the build this phone is running
  latest: string | null; // the newest build on the server, or null if it could not be asked
  newer: boolean; // is there a newer build than the one running?
  checkedAt: number;
}

// Asks the server which build is live. version.json is written at build time and is never stored by the offline cache.
export async function checkVersion(): Promise<VersionInfo> {
  const running = typeof __BUILD__ === "string" ? __BUILD__ : "unknown";
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`version.json answered ${res.status}`);
    const body = (await res.json()) as { build?: unknown };
    const latest = typeof body.build === "string" ? body.build : null;
    return {
      running,
      latest,
      newer: latest !== null && latest !== running,
      checkedAt: Date.now(),
    };
  } catch {
    return { running, latest: null, newer: false, checkedAt: Date.now() };
  }
}

// Gets the newest version of the app. It forgets the stored app files and the offline worker, then reloads.
// It does NOT touch patient records, the sync queue, the PIN or any settings (those live in the phone's database).
// Do it while online: for a moment the app has no stored copy of itself.
export async function reloadLatest(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  window.location.reload();
}
