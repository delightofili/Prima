// The editor and `tsc` do not know the "npm:" addresses that Supabase Edge Functions (Deno) use. This tells them the one
// thing deps.ts takes from there, with only the parts it uses. Supabase itself ignores this file when it deploys.
declare module "npm:@supabase/supabase-js@2" {
  export function createClient(
    url: string,
    key: string,
    options?: Record<string, unknown>,
  ): {
    rpc(
      name: string,
      args?: Record<string, unknown>,
    ): Promise<{ data: unknown; error: { message: string } | null }>;
    auth: {
      getUser(jwt: string): Promise<{
        data: { user: { id: string; email?: string | null } | null };
        error: unknown;
      }>;
    };
  };
}
