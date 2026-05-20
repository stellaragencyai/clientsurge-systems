/**
 * auditLog.ts — #151 #157
 * createAuditLog() — write admin action records to AuditLog entity.
 * AuditLog fields: admin_email, action, entity, before, after, timestamp
 */
import { scrubPII } from "./piiScrubber.ts";

export async function createAuditLog(
  base44: any,
  opts: {
    admin_email: string;
    action: string;          // e.g. "update_order", "delete_lead", "override_live"
    entity: string;          // e.g. "Order", "SpaLead"
    entity_id?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await base44.asServiceRole.entities.AuditLog?.create?.({
      admin_email: scrubPII(opts.admin_email),
      action: opts.action,
      entity: opts.entity,
      entity_id: opts.entity_id || null,
      before: opts.before ? JSON.stringify(opts.before) : null,
      after: opts.after ? JSON.stringify(opts.after) : null,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Never throw — audit log failure must not break main flow
  }
}
