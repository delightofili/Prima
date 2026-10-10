import { useEffect, useState } from "react";

const KEY = "prima_glove";
const EVENT = "prima-glove";

export const readGlove = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const applyGlove = (on: boolean) => {
  document.documentElement.dataset.glove = on ? "on" : "off";
};

export function useGloveMode(): [boolean, () => void] {
  const [on, setOn] = useState(readGlove);

  useEffect(() => {
    const sync = () => setOn(readGlove());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const toggle = () => {
    const next = !on;
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
    applyGlove(next);
    window.dispatchEvent(new Event(EVENT));
  };

  return [on, toggle];
}
