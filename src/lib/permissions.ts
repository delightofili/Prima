import type { Role } from "./auth";

export type Action =
  | "deletePatient"
  | "mergeDuplicates"
  | "exportData"
  | "viewAudit"
  | "handleRequests"
  | "manageTeam";

const ADMIN_ACTIONS: ReadonlySet<Action> = new Set([
  "deletePatient",
  "mergeDuplicates",
  "exportData",
  "viewAudit",
  "handleRequests",
  "manageTeam",
]);

export const can = (role: Role | null, action: Action) =>
  role === "admin" && ADMIN_ACTIONS.has(action);
