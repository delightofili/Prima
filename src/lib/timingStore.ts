// src/lib/timingStore.ts
import { db } from "../db";
import type { TimingRecord } from "./timing";

const KEY = "timings";
const FLAG = "prima_timing";

// Measuring is off unless someone turns it on for a usability session. It records time and taps only: no names, no patient data.
export const timingEnabled = () => {
  try {
    return localStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
};
export const setTimingEnabled = (on: boolean) => {
  try {
    localStorage.setItem(FLAG, on ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
};

export async function loadTimings(): Promise<TimingRecord[]> {
  const row = await db.meta.get(KEY);
  try {
    const list = row ? (JSON.parse(row.value) as TimingRecord[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveTiming(record: TimingRecord) {
  const list = await loadTimings();
  list.push(record);
  await db.meta.put({ key: KEY, value: JSON.stringify(list.slice(-200)) });
}

export const clearTimings = () => db.meta.delete(KEY);
