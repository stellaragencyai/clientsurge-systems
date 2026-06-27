import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}
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

const SKIP_STATUSES = ["Booked", "Closed"];

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const isAutomationPayload = !!(body?.event?.entity_id || body?.data?.id);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return secureJson({ error: "Forbidden: Admin only" }, { status: 403 });
    }
    if (!user && (!isAutomationPayload || !allowAnonymousAutomation(req))) {
      return secureJson({ error: "Forbidden: Trusted automation only" }, { status: 403 });
    }

    // Support automation payload AND direct call
    const leadId = body?.lead_id ?? body?.event?.entity_id ?? body?.data?.id ?? null;
    const leadData = body?.data ?? null;

    if (!leadId) {
      return secureJson({ error: "lead_id is required" }, { status: 400 });
    }

    const lead = (leadData?.id === leadId)
      ? leadData
      : await base44.asServiceRole.entities.Leads.get(leadId);

    if (!lead) {
      return secureJson({ error: "Lead not found" }, { status: 404 });
    }

    // Guard: skip terminal statuses
    if (SKIP_STATUSES.includes(lead.status)) {
      return secureJson({ success: true, skipped: true, reason: `Lead status is ${lead.status}` });
    }

    // Guard: no email = can't nurture
    if (!lead.email) {
      return secureJson({ success: true, skipped: true, reason: "Lead has no email address" });
    }

    const leadTags = Array.isArray(lead.industry_tags) ? lead.industry_tags : [];
    if (isAutomationPayload && !leadTags.includes("Nurture")) {
      return secureJson({ success: true, skipped: true, reason: "Lead is not tagged for nurture enrollment" });
    }

    if (lead.reply_sentiment === "Negative") {
      return secureJson({ success: true, skipped: true, reason: "Lead sentiment is not eligible for nurture enrollment" });
    }

    // Guard: check for existing active/paused campaign
    const existing = await base44.asServiceRole.entities.NurtureCampaign.filter(
      { lead_id: leadId },
      "-created_date",
      25
    );
    if ((existing || []).some((campaign) => ["active", "paused"].includes(campaign.status))) {
      return secureJson({ success: true, skipped: true, reason: "Active nurture campaign already exists for this lead." });
    }

    const campaign = await base44.asServiceRole.entities.NurtureCampaign.create({
      lead_id: leadId,
      lead_name: lead.full_name || "",
      lead_email: lead.email,
      lead_business: lead.business_name || "",
      status: "active",
      enrolled_at: new Date().toISOString(),
      current_step: 0,
      step1_status: "pending",
      step2_status: "pending",
      step3_status: "pending",
      step4_status: "pending",
      step5_status: "pending",
      step6_status: "pending",
      step7_status: "pending",
      step8_status: "pending",
    });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: "processed",
      subject: "30-Day Nurture Campaign enrolled",
      message_body: `Lead enrolled in 30-day nurture email sequence (8 steps). Campaign ID: ${campaign.id}`,
    });

    return secureJson({ success: true, campaign_id: campaign.id, lead_id: leadId });

  } catch (error) {
    console.error("[startNurtureCampaign] startNurtureCampaign error:", error);
    return secureJson({ error: error.message || "Failed to start nurture campaign" }, { status: 500 });
  }
});