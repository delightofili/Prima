export async function isPersistent(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted?.()) ?? false;
  } catch {
    return false;
  }
}

export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await isPersistent()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function storageEstimate() {
  try {
    const e = await navigator.storage?.estimate?.();
    return e ? { used: e.usage ?? 0, quota: e.quota ?? 0 } : null;
  } catch {
    return null;
  }
}

export const megabytes = (bytes: number) =>
  `${(bytes / 1_048_576).toFixed(bytes < 10_485_760 ? 1 : 0)} MB`;
