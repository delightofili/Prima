import { db } from "../db";
import type { Dhis2Config } from "./dhis2";

const KEY = "dhis2";

// The mapping stays on this phone (the meta table is never uploaded)
export async function loadDhis2(): Promise<Dhis2Config> {
  const row = await db.meta.get(KEY);
  try {
    const c = row ? (JSON.parse(row.value) as Dhis2Config) : null;
    if (
      c &&
      typeof c.orgUnit === "string" &&
      c.items &&
      typeof c.items === "object"
    )
      return c;
  } catch {
    /* fall through to an empty mapping */
  }
  return { orgUnit: "", items: {} };
}

export const saveDhis2 = (cfg: Dhis2Config) =>
  db.meta.put({ key: KEY, value: JSON.stringify(cfg) });
