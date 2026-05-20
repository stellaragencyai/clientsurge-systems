/**
 * auditLog.ts — #151 #157
 * createAuditLog() — write admin action records to AuditLog entity.
 * AuditLog fields: admin_email, action, entity_name, record_id, before, after, timestamp
 */
import { scrubPII } from "./piiScrubber.ts";

export async function createAuditLog(
  base44: any,
  opts: {
    admin_email: string;
    action: string;          // e.g. "update_order", "delete_lead", "override_live"
    entity_name?: string;    // e.g. "Order", "Leads"
    entity?: string;         // Backward-compatible alias for entity_name
    record_id?: string;
    entity_id?: string;      // Backward-compatible alias for record_id
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    notes?: string;
  }
): Promise<void> {
  try {
    await base44.asServiceRole.entities.AuditLog?.create?.({
      admin_email: scrubPII(opts.admin_email),
      action: opts.action,
      entity_name: opts.entity_name || opts.entity || "Unknown",
      record_id: opts.record_id || opts.entity_id || null,
      before: opts.before ? JSON.stringify(opts.before) : null,
      after: opts.after ? JSON.stringify(opts.after) : null,
      timestamp: new Date().toISOString(),
      notes: opts.notes || null,
    });
  } catch {
    // Never throw — audit log failure must not break main flow
  }
}
