import { useAuth } from "./useAuth";
import { can, type Action } from "../lib/permissions";

export function useCan() {
  const { role } = useAuth();
  return (action: Action) => can(role, action);
}
