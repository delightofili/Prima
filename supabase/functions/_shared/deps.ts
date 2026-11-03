// The only file that knows it is running in Supabase: it reads the settings and opens the database as the server.
import { createClient } from "npm:@supabase/supabase-js@2";
import type { Deps } from "./paystack.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): unknown;
};

let cached: Deps | null = null;

export function makeDeps(): Deps {
  if (cached) return cached;
  // Supabase puts these two in every function by itself. The service role can do anything: it never leaves the server.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  cached = {
    env: {
      PAYSTACK_SECRET_KEY: Deno.env.get("PAYSTACK_SECRET_KEY") ?? "",
      PAYSTACK_MODE: Deno.env.get("PAYSTACK_MODE") ?? "test",
      APP_URLS: Deno.env.get("APP_URLS") ?? "",
    },
    fetch,
    rpc: async (name, args) => {
      const { data, error } = await admin.rpc(name, args);
      return { data, error: error ? { message: error.message } : null };
    },
    userFromJwt: async (jwt) => {
      const { data, error } = await admin.auth.getUser(jwt);
      return error || !data.user
        ? null
        : { id: data.user.id, email: data.user.email ?? null };
    },
  };
  return cached;
}

export const serve = (
  handler: (req: Request, deps: Deps) => Promise<Response>,
) => Deno.serve((req) => handler(req, makeDeps()));
