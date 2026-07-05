/**
 * startNurtureSequence14d — Sprint 2
 *
 * Enrolls an eligible lead in a 14-day nurture sequence using the existing
 * NurtureCampaign entity. Steps 1-5 are active (Day 0, 3, 7, 10, 14).
 * Steps 6-8 are marked as "skipped" (they belong to the 30-day extension).
 *
 * Eligibility rules:
 *   - Lead must have consent (sms_permission or consent_given)
 *   - Lead must not have opted out (automation_enabled !== false, cadence_paused !== true)
 *   - Lead must not be in a terminal status (Booked, Closed)
 *   - No existing active/paused NurtureCampaign for this lead
 *
 * Hard rules:
 *   - Does NOT send any messages during enrollment
 *   - Does NOT mark anything live
 *   - Creates structure only — sends happen via processNurtureCampaigns scheduler
 *   - Does NOT enroll internal/test/smoke records into production metrics
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

// Inlined from _shared/automationSecurity.js
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

const SKIP_STATUSES = ["Booked", "Closed", "booked", "closed"];

// Internal/test email patterns — never enroll into production metrics
const INTERNAL_PATTERNS = /clientsurge-install\.internal|clientsurge\.test|test\+|test-|^test\b|smoke|\bqa\b|internal|backfill|example\.com/i;
const OWNER_PATTERNS = /nolanf|nolan\./i;

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

    // Guard: must have email for nurture
    if (!lead.email) {
      return secureJson({ success: true, skipped: true, reason: "Lead has no email address" });
    }

    // Guard: consent required
    const hasConsent = lead.consent_given === true || lead.sms_permission === true;
    if (!hasConsent) {
      return secureJson({ success: true, skipped: true, reason: "Lead has not given consent for nurture" });
    }

    // Guard: opted out
    if (lead.automation_enabled === false || lead.cadence_paused === true) {
      return secureJson({ success: true, skipped: true, reason: "Lead has opted out or cadence is paused" });
    }

    // Guard: negative sentiment
    if (lead.reply_sentiment === "Negative") {
      return secureJson({ success: true, skipped: true, reason: "Lead sentiment is not eligible for nurture" });
    }

    // Guard: check for existing active/paused campaign
    const existing = await base44.asServiceRole.entities.NurtureCampaign.filter(
      { lead_id: leadId },
      "-created_date",
      25
    );
    if ((existing || []).some((c) => ["active", "paused"].includes(c.status))) {
      return secureJson({ success: true, skipped: true, reason: "Active nurture campaign already exists for this lead." });
    }

    // ── Classify evidence quality ──
    const email = (lead.email || "").toLowerCase();
    const name = (lead.business_name || "").toLowerCase();
    let evidenceQuality = "production_customer";
    if (OWNER_PATTERNS.test(email) || OWNER_PATTERNS.test(name)) evidenceQuality = "owner";
    else if (INTERNAL_PATTERNS.test(email) || INTERNAL_PATTERNS.test(name)) evidenceQuality = "internal_test";

    // ── Create NurtureCampaign with 14-day scope ──
    // Steps 1-5 active (Day 0, 3, 7, 10, 14)
    // Steps 6-8 marked as "skipped" (belong to 30-day extension)
    const campaign = await base44.asServiceRole.entities.NurtureCampaign.create({
      lead_id: leadId,
      lead_name: lead.full_name || "",
      lead_email: lead.email,
      lead_business: lead.business_name || "",
      status: "active",
      enrolled_at: new Date().toISOString(),
      current_step: 0,
      // Steps 1-5: active for 14-day sequence
      step1_status: "pending",  // Day 0: value + booking CTA
      step2_status: "pending",  // Day 3: automation benefit
      step3_status: "pending",  // Day 7: FAQ/objection handling
      step4_status: "pending",  // Day 10: urgency/diagnostic
      step5_status: "pending",  // Day 14: final follow-up / clean exit
      // Steps 6-8: skipped (30-day extension, not part of 14-day)
      step6_status: "skipped",
      step7_status: "skipped",
      step8_status: "skipped",
      notes: `14-day nurture sequence enrolled. Evidence quality: ${evidenceQuality}. Steps 6-8 skipped (30-day extension not applicable).`,
    });

    // Log enrollment event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: "processed",
      subject: "14-Day Nurture Sequence enrolled",
      message_body: `Lead enrolled in 14-day nurture sequence (5 active steps, 3 skipped). Campaign ID: ${campaign.id}. Evidence quality: ${evidenceQuality}.`,
      metadata_json: JSON.stringify({
        sprint: 2,
        service_key: "nurture_sequence_14d",
        campaign_id: campaign.id,
        evidence_quality: evidenceQuality,
        active_steps: [1, 2, 3, 4, 5],
        skipped_steps: [6, 7, 8],
        enrolled_by: user?.email || "automation",
        enrolled_at: new Date().toISOString(),
      }),
    });

    return secureJson({
      success: true,
      campaign_id: campaign.id,
      lead_id: leadId,
      sequence: "14d",
      evidence_quality: evidenceQuality,
      active_steps: [1, 2, 3, 4, 5],
      skipped_steps: [6, 7, 8],
    });

  } catch (error) {
    console.error("[startNurtureSequence14d] error:", error);
    return secureJson({ error: error.message || "Failed to start 14-day nurture sequence" }, { status: 500 });
  }
});