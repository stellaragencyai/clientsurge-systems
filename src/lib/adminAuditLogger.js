/**
 * Admin Audit Trail Wrapper
 * Fixes Audit Issue #55: No audit trail for admin actions
 *
 * Wraps entity operations to automatically create AuditLog records.
 *
 * Usage:
 * import { adminActionWithAudit } from '@/lib/adminAuditLogger';
 * await adminActionWithAudit('Leads', 'update', leadId, { lead_status: 'contacted' }, user);
 */

import { base44 } from "@/api/base44Client";

export async function adminActionWithAudit(entityName, action, entityId, changes, user) {
  try {
    // Perform the entity operation
    let result;
    if (action === "update") {
      result = await base44.entities[entityName].update(entityId, changes);
    } else if (action === "delete") {
      result = await base44.entities[entityName].delete(entityId);
    } else if (action === "create") {
      result = await base44.entities[entityName].create(changes);
    }

    // Create audit log record
    try {
      await base44.admin.entities.AuditLog.create({
        entity_name: entityName,
        entity_id: entityId || result?.id,
        action: action,
        changes_summary: JSON.stringify(changes).substring(0, 1000),
        performed_by: user?.email || "unknown",
        performed_at: new Date().toISOString(),
        ip_address: "",
      });
    } catch (auditErr) {
      console.warn("Failed to create audit log:", auditErr?.message);
    }

    return result;
  } catch (error) {
    // Log failed action attempt
    try {
      await base44.admin.entities.AuditLog.create({
        entity_name: entityName,
        entity_id: entityId,
        action: `${action}_failed`,
        changes_summary: JSON.stringify(changes).substring(0, 1000),
        performed_by: user?.email || "unknown",
        performed_at: new Date().toISOString(),
        error_message: error?.message?.substring(0, 500),
      });
    } catch {
      // Silent fail — don't block the error
    }
    throw error;
  }
}