/**
 * Audit Log Helper — log sensitive read operations.
 * Fixes FLAW #88: Missing AuditLog for read operations.
 *
 * Backend functions should call logReadOperation() before returning
 * sensitive data exports, lead lists, or billing information.
 * This creates an immutable audit trail for forensic analysis.
 */
import { base44 } from "@/api/base44Client";

/**
 * Log a read operation for audit trail.
 * Call before returning sensitive data.
 * @param {string} operation - e.g. "export_leads_csv", "view_billing_data"
 * @param {object} details - What was accessed
 */
export async function logReadOperation(operation, details = {}) {
  try {
    const user = await base44.auth.me();
    if (!user) return;

    await base44.entities.AuditLog.create({
      action: `read:${operation}`,
      performed_by: user.email,
      performed_by_id: user.id,
      resource_type: details.resource_type || "unknown",
      resource_id: details.resource_id || null,
      filters: details.filters || null,
      result_count: details.result_count || null,
      ip_address: details.ip_address || null,
      timestamp: new Date().toISOString(),
      metadata: JSON.stringify(details.metadata || {}),
    });
  } catch {
    // Audit logging must never break the operation
    console.warn("[audit-log] Failed to log read operation:", operation);
  }
}

/**
 * Log an admin action (create/update/delete) for audit trail.
 * @param {string} action - e.g. "update", "delete", "create"
 * @param {string} entityType - e.g. "Leads", "Order"
 * @param {string} entityId
 * @param {object} changes - Before/after diff
 */
export async function logAdminAction(action, entityType, entityId, changes = {}) {
  try {
    const user = await base44.auth.me();
    if (!user) return;

    await base44.entities.AuditLog.create({
      action: `${action}:${entityType}`,
      performed_by: user.email,
      performed_by_id: user.id,
      resource_type: entityType,
      resource_id: entityId,
      changes: JSON.stringify(changes),
      timestamp: new Date().toISOString(),
    });
  } catch {
    console.warn("[audit-log] Failed to log admin action:", action, entityType);
  }
}