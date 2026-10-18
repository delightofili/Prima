import type { Role } from "./auth";
import { rowToFacility } from "./auth";
import { supabase } from "./supabase";

export interface Member {
  user_id: string;
  full_name: string;
  email: string;
  role: Role;
  joined_at: string;
}

export interface Invite {
  code: string;
  role: Role;
  expires_at: string;
}

// Mirrors the database function max_staff(). The Pro number is a placeholder.
export const MAX_STAFF = { free: 1, basic: 3, pro: 10 } as const;

async function rpc<T>(
  name: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}

export const listMembers = () => rpc<Member[]>("list_members");
export const listInvites = () => rpc<Invite[]>("list_invites");
export const createInvite = (role: Role) =>
  rpc<string>("create_invite", { p_role: role });
export const revokeInvite = (code: string) =>
  rpc<null>("revoke_invite", { p_code: code });
export const removeMember = (userId: string) =>
  rpc<null>("remove_member", { p_user_id: userId });

export async function updateFacility(v: {
  name: string;
  lga: string;
  state: string;
}) {
  const row = await rpc<Record<string, unknown>>("update_facility", {
    p_name: v.name,
    p_lga: v.lga,
    p_state: v.state,
  });
  return rowToFacility(row);
}

export const formatInvite = (code: string) =>
  `${code.slice(0, 5)}-${code.slice(5)}`;
