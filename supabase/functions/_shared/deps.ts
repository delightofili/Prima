// The only file that knows it is running in Supabase: it reads the settings and talks to the database as the server.
// It uses plain `fetch` and no library: a function that imports nothing heavy starts at once, and a payment function
// has to start fast. Every call has a time limit, so nothing can hang until the platform gives up after 150 seconds.
import type { Deps } from "./paystack.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): unknown;
};

let cached: Deps | null = null;

export function makeDeps(): Deps {
  if (cached) return cached;
  // Supabase puts these two in every function by itself. The service role can do anything: it never leaves the server.
  const base = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/+$/, "");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!base || !key)
    throw new Error(
      "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from this function's settings",
    );
  const waitMs = Number(Deno.env.get("DB_TIMEOUT_MS")) || 20_000;
  const limited = (init: RequestInit = {}): RequestInit => ({
    ...init,
    signal: init.signal ?? AbortSignal.timeout(waitMs),
  });

  // The key says "this is the server". An old-style key (a JWT, it starts with eyJ) is also sent as the bearer token.
  const server: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
  };
  if (key.startsWith("eyJ")) server.Authorization = `Bearer ${key}`;

  cached = {
    env: {
      PAYSTACK_SECRET_KEY: Deno.env.get("PAYSTACK_SECRET_KEY") ?? "",
      PAYSTACK_MODE: Deno.env.get("PAYSTACK_MODE") ?? "test",
      APP_URLS: Deno.env.get("APP_URLS") ?? "",
    },
    // Used for Paystack: it gets the same time limit
    fetch: (input, init) => fetch(input, limited(init)),
    // Calls a database function. The argument names are the function's parameter names, exactly as supabase-js would send them.
    rpc: async (name, args) => {
      try {
        const res = await fetch(
          `${base}/rest/v1/rpc/${encodeURIComponent(name)}`,
          limited({
            method: "POST",
            headers: server,
            body: JSON.stringify(args),
          }),
        );
        const text = await res.text();
        let body: unknown = null;
        if (text) {
          try {
            body = JSON.parse(text);
          } catch {
            body = null;
          }
        }
        if (!res.ok) {
          const said = (body as { message?: unknown } | null)?.message;
          return {
            data: null,
            error: {
              message: typeof said === "string" ? said : `HTTP ${res.status}`,
            },
          };
        }
        return { data: body, error: null };
      } catch (e) {
        return {
          data: null,
          error: {
            message: `could not reach the database (${(e as Error).name})`,
          },
        };
      }
    },
    // Who does this sign-in token belong to? Only the token goes in the Authorization line; the server key goes in apikey.
    userFromJwt: async (jwt) => {
      try {
        const res = await fetch(
          `${base}/auth/v1/user`,
          limited({
            headers: { apikey: key, Authorization: `Bearer ${jwt}` },
          }),
        );
        if (!res.ok) return null;
        const u = (await res.json()) as { id?: unknown; email?: unknown };
        return typeof u.id === "string"
          ? { id: u.id, email: typeof u.email === "string" ? u.email : null }
          : null;
      } catch {
        return null;
      }
    },
  };
  return cached;
}

export const serve = (
  handler: (req: Request, deps: Deps) => Promise<Response>,
) => Deno.serve((req) => handler(req, makeDeps()));
