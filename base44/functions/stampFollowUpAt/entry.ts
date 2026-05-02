/**
 * stampFollowUpAt — sets next_follow_up_at on a lead when status changes.
 *
 * Triggered by entity automation on Leads update:
 *   - Status → "Qualified"  → next_follow_up_at = now + 24h
 *   - Status → "Replied"    → next_follow_up_at = now + 48h
 *
 * Automation payload: { event, data, old_data, changed_fields }
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
// Inlined from _shared/automationSecurity.js (relative imports not supported in deployed Deno runtime)
function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
function getBearerToken(req) {
  const authorization = req.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return "";
  return token.trim();
}
function allowAnonymousAutomation(req) {
  const configuredSecret = Deno.env.get("AUTOMATION_SHARED_SECRET");
  if (!configuredSecret) return true;
  const candidateSecret = req.headers.get("x-automation-secret") || getBearerToken(req);
  return constantTimeEqual(candidateSecret || "", configuredSecret);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const isAutomationPayload = !!(body?.event?.entity_id || body?.data?.id);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }
    if (!user && (!isAutomationPayload || !allowAnonymousAutomation(req))) {
      return Response.json({ error: "Forbidden: Trusted automation only" }, { status: 403 });
    }

    const leadId = body?.lead_id ?? body?.event?.entity_id ?? body?.data?.id ?? null;
    const leadData = body?.data ?? null;

    if (!leadId) {
      return Response.json({ error: "lead_id is required" }, { status: 400 });
    }

    const lead = leadData?.id === leadId
      ? leadData
      : await base44.asServiceRole.entities.Leads.get(leadId);

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    let hoursToAdd = null;
    if (lead.status === "Qualified") hoursToAdd = 24;
    else if (lead.status === "Replied") hoursToAdd = 48;

    if (!hoursToAdd) {
      return Response.json({ success: true, skipped: true, reason: `Status ${lead.status} not handled by this function` });
    }

    const changedFields = Array.isArray(body?.changed_fields) ? body.changed_fields : [];
    if (isAutomationPayload && changedFields.length > 0 && !changedFields.includes("status")) {
      return Response.json({ success: true, skipped: true, reason: "Status did not change" });
    }

    const followUpAt = new Date(Date.now() + hoursToAdd * 3600000).toISOString();

    await base44.asServiceRole.entities.Leads.update(leadId, {
      next_follow_up_at: followUpAt,
    });

    console.log(`stampFollowUpAt: Lead ${leadId} (${lead.status}) → next_follow_up_at = ${followUpAt}`);

    return Response.json({ success: true, lead_id: leadId, status: lead.status, next_follow_up_at: followUpAt });

  } catch (error) {
    console.error("stampFollowUpAt error:", error);
    return Response.json({ error: error.message || "Failed to stamp follow-up" }, { status: 500 });
  }
});
