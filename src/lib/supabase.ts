import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

// Every request to the cloud gives up after 40 seconds. Without this, one request that never answers (a weak or
// blocked connection, a paused project) keeps "Syncing…" on screen for ever, because nothing else ever ends it.
const REQUEST_LIMIT_MS = 40_000;

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(
    () =>
      controller.abort(
        new DOMException("The cloud did not answer in time", "TimeoutError"),
      ),
    REQUEST_LIMIT_MS,
  );
  const outer = init?.signal;
  if (outer) {
    if (outer.aborted) controller.abort(outer.reason);
    else
      outer.addEventListener("abort", () => controller.abort(outer.reason), {
        once: true,
      });
  }
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: { fetch: fetchWithTimeout },
});
