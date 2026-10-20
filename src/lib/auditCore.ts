import { getCurrentFacility } from "./config";
import type { AuditEntry } from "../types";

let actor: { id: string; name: string } | null = null;

export const setAuditActor = (a: { id: string; name: string } | null) => {
  actor = a;
};

export function buildAudit(
  action: string,
  entityType: string | undefined,
  entityId: string | undefined,
  summary: string,
): AuditEntry | null {
  const facility = getCurrentFacility();
  if (!actor || !facility) return null; // nobody signed in, so nothing to record (seed tools, startup)
  return {
    id: crypto.randomUUID(),
    facilityId: facility.id,
    actorId: actor.id,
    actorName: actor.name,
    action,
    entityType,
    entityId,
    summary,
    createdAt: Date.now(),
  };
}
