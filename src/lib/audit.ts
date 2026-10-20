import { writeAudit } from "../db";
import { buildAudit } from "./auditCore";
import { pushPending } from "./syncService";

// For events that are not a database change: exports, sign-ins, PIN lockouts, acknowledgements.
export async function logAudit(
  action: string,
  entityType: string | undefined,
  entityId: string | undefined,
  summary: string,
) {
  const entry = buildAudit(action, entityType, entityId, summary);
  if (!entry) return;
  await writeAudit(entry);
  void pushPending();
}
