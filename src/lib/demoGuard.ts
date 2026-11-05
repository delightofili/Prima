// While practice mode is on, this page may talk to nothing but itself.
//
// Why: the real sign-in lives in the same browser storage as practice mode. Without this, a screen that calls the cloud
// (the team list, billing, a data request) would run as the REAL signed-in person, on the REAL facility, from inside a practice.
// This cuts off every way a page can reach another website, whatever screen asks. Requests to this app's own address still work,
// so the app and its offline files load as always.
import { isDemo } from "./demo";

export function installDemoGuard(): void {
  if (!isDemo()) return;
  const here = window.location.origin;
  const mine = (target: unknown): boolean => {
    try {
      const address = target instanceof Request ? target.url : String(target);
      return new URL(address, window.location.href).origin === here;
    } catch {
      return false;
    }
  };

  const realFetch = window.fetch.bind(window);
  // Refused the same way a missing connection refuses, so every screen already knows how to cope ("you are offline")
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    mine(input)
      ? realFetch(input, init)
      : Promise.reject(new TypeError("Failed to fetch"))) as typeof fetch;

  const blocked = () =>
    new DOMException("Practice mode cannot reach the internet", "NetworkError");
  const refuse = class {
    constructor() {
      throw blocked();
    }
  };
  window.WebSocket = refuse as unknown as typeof WebSocket;
  if ("EventSource" in window)
    window.EventSource = refuse as unknown as typeof EventSource;

  const proto = XMLHttpRequest.prototype;
  const realOpen = proto.open as (...args: unknown[]) => void;
  proto.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    if (!mine(url)) throw blocked();
    return realOpen.call(this, method, url, ...rest);
  } as typeof proto.open;

  if (typeof navigator.sendBeacon === "function") {
    const realBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url: string | URL, data?: BodyInit | null) =>
      mine(url) ? realBeacon(url, data) : false;
  }
}
