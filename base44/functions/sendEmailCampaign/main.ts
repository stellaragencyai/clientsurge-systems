import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { createEmailUnsubscribeToken } from "../_shared/emailUnsubscribe.ts";

const MAX_CAMPAIGN_RECIPIENTS = 50;
const DEFAULT_TEST_BATCH_SIZE = 25;
const RECENT_CONTACT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const SEND_DELAY_MS = Math.max(0, Number(Deno.env.get("EMAIL_CAMPAIGN_SEND_DELAY_MS") || "125"));
const ALLOWED_INDUSTRY_SEQUENCES = new Set(["roofing", "hvac", "dental", "med_spa", "plumbing"]);
const ADVANCED_CRM_STAGES = new Set(["Audit Booked", "Audit Completed", "Proposal Sent", "Won Pending Payment", "Won"]);
const TERMINAL_SUPPRESSION_STATUSES = new Set(["Booked", "Closed"]);
const TERMINAL_SUPPRESSION_STAGES = new Set(["Lost", "Won", "Audit Completed"]);
const TERMINAL_SUPPRESSION_STATES = new Set(["BOOKED", "WON"]);
const TERMINAL_OUTREACH_STATUSES = new Set(["replied", "booked", "unsubscribed", "bounced", "do_not_contact"]);
const DISALLOWED_QUALITY_STATUSES = new Set(["quarantine_candidate", "quarantined", "duplicate_candidate"]);
const TEST_SIGNAL_PATTERN = /(?:^|\b)(test|testing|demo|sample|smoke|internal)(?:\b|$)/i;

function secureJson(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}

function clean(value: unknown, max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function normalizeEmail(value: unknown) {
  return clean(value, 320).toLowerCase();
}

function isValidEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replaceTokens(template: string, lead: Record<string, unknown>) {
  const fullName = clean(lead.full_name || lead.owner_contact_name || lead.contact_name || "", 200);
  const firstName = clean(lead.first_name || fullName.split(/\s+/)[0] || "there", 100);
  const businessName = clean(lead.business_name || "your business", 240);
  const industry = clean(lead.industry || lead.business_type || "local service", 160);
  const replacements: Record<string, string> = {
    "{name}": fullName || firstName,
    "{{name}}": fullName || firstName,
    "{first_name}": firstName,
    "{{first_name}}": firstName,
    "{business_name}": businessName,
    "{{business_name}}": businessName,
    "{industry}": industry,
    "{{industry}}": industry,
  };
  return Object.entries(replacements).reduce(
    (output, [token, value]) => output.split(token).join(value),
    String(template || ""),
  );
}

function industryKey(value: unknown) {
  const normalized = clean(value, 160)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (normalized.includes("roof")) return "roofing";
  if (normalized.includes("hvac")) return "hvac";
  if (normalized.includes("plumb")) return "plumbing";
  if (normalized.includes("dental") || normalized.includes("orthodont")) return "dental";
  if (normalized.includes("med_spa") || normalized.includes("aesthetic")) return "med_spa";
  return normalized;
}

function leadTags(lead: Record<string, unknown>) {
  return [
    ...(Array.isArray(lead.tags) ? lead.tags : []),
    ...(Array.isArray(lead.industry_tags) ? lead.industry_tags : []),
    lead.crm_tag,
  ].map((value) => clean(value, 100).toLowerCase()).filter(Boolean);
}

function websiteModeMatches(lead: Record<string, unknown>, mode: string) {
  const website = clean(lead.website || lead.website_url || lead.canonical_website_url || "", 500);
  if (mode === "no_website") return !website;
  if (mode === "any") return true;
  return Boolean(website);
}

function isTestOrInternalLead(lead: Record<string, unknown>) {
  const email = normalizeEmail(lead.email);
  const signals = [
    lead.business_name,
    lead.full_name,
    lead.source,
    lead.intake_type,
    lead.industry,
    ...(Array.isArray(lead.data_quality_flags) ? lead.data_quality_flags : []),
  ].map((value) => clean(value, 240)).join(" ");
  return TEST_SIGNAL_PATTERN.test(signals) ||
    /@(example|test|invalid|localhost)\./i.test(email) ||
    String(lead.industry || "") === "Internal Test / Excluded";
}

function suppressionReason(lead: Record<string, unknown>, filters: Record<string, unknown>) {
  const email = normalizeEmail(lead.email);
  if (!isValidEmail(email)) return "missing_or_invalid_email";
  if (isTestOrInternalLead(lead)) return "internal_or_test_record";
  if (lead.do_not_contact) return "do_not_contact";
  if (lead.email_unsubscribed) return "email_unsubscribed";
  if (lead.email_bounced || lead.hard_bounced) return "email_bounced";
  if (TERMINAL_SUPPRESSION_STATUSES.has(String(lead.status || ""))) return "terminal_status";
  if (TERMINAL_SUPPRESSION_STAGES.has(String(lead.crm_stage || ""))) return "terminal_crm_stage";
  if (TERMINAL_SUPPRESSION_STATES.has(String(lead.lead_state || ""))) return "terminal_lead_state";
  if (TERMINAL_OUTREACH_STATUSES.has(String(lead.outreach_status || ""))) return "terminal_outreach_status";
  if (DISALLOWED_QUALITY_STATUSES.has(String(lead.quality_review_status || ""))) return "quality_quarantine";
  if (String(lead.industry || "") === "Needs Manual Review") return "industry_manual_review";
  if (filters.outbound_ready_only !== false && String(lead.quality_review_status || "") !== "verified_outbound_ready") {
    return "not_verified_outbound_ready";
  }
  const lastContactedAt = lead.last_contacted_at ? new Date(String(lead.last_contacted_at)).getTime() : 0;
  if (lastContactedAt > 0 && Date.now() - lastContactedAt < RECENT_CONTACT_WINDOW_MS) {
    return "recently_contacted";
  }
  const websiteMode = clean(filters.website_mode || "has_website", 40);
  if (!websiteModeMatches(lead, websiteMode)) return websiteMode === "no_website" ? "has_website" : "missing_website";
  return "";
}

function matchesCampaignFilters(lead: Record<string, unknown>, filters: Record<string, unknown>, industrySequence: string) {
  const statuses = Array.isArray(filters.statuses) ? filters.statuses.map(String) : [];
  if (statuses.length && !statuses.includes(String(lead.status || ""))) return false;
  const sources = Array.isArray(filters.sources) ? filters.sources.map(String) : [];
  if (sources.length && !sources.includes(String(lead.source || ""))) return false;
  const industries = Array.isArray(filters.industries) ? filters.industries.map(industryKey) : [];
  const leadIndustry = industryKey(lead.industry || lead.business_type);
  if (industries.length && !industries.includes(leadIndustry)) return false;
  if (industrySequence && leadIndustry !== industrySequence && !leadTags(lead).includes(industrySequence)) return false;
  const minimumScore = Number(filters.lead_score_min ?? 0);
  const maximumScore = Number(filters.lead_score_max ?? 100);
  const score = Number(lead.lead_score || 0);
  if (score < minimumScore || score > maximumScore) return false;
  const requiredTags = Array.isArray(filters.tags)
    ? filters.tags.map((value) => clean(value, 100).toLowerCase()).filter(Boolean)
    : [];
  if (requiredTags.length && !requiredTags.some((tag) => leadTags(lead).includes(tag))) return false;
  return true;
}

function buildHtml({ bodyHtml, bodyText, unsubscribeUrl, postalAddress }: {
  bodyHtml: string;
  bodyText: string;
  unsubscribeUrl: string;
  postalAddress: string;
}) {
  const content = bodyHtml || `<p>${escapeHtml(bodyText).replace(/\n/g, "<br>")}</p>`;
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:640px;margin:0 auto;padding:28px 20px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px">${content}<hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0"><p style="font-size:12px;line-height:1.55;color:#64748b">ClientSurge Systems · ${escapeHtml(postalAddress)}<br>This is a business outreach message. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#0369a1">Unsubscribe from future outreach emails</a>.</p></div></div></body></html>`;
}

function buildText(bodyText: string, unsubscribeUrl: string, postalAddress: string) {
  return `${bodyText.trim()}\n\n---\nClientSurge Systems · ${postalAddress}\nUnsubscribe: ${unsubscribeUrl}`;
}

function senderReadiness(campaign: Record<string, unknown>, settings: Record<string, unknown> | null) {
  const fromEmail = normalizeEmail(
    campaign.provider_from_email || settings?.resend_from_email || Deno.env.get("RESEND_FROM_EMAIL") || "",
  );
  const replyTo = normalizeEmail(Deno.env.get("OUTREACH_REPLY_TO_EMAIL") || "nolan@clientsurgesystems.com");
  const postalAddress = clean(Deno.env.get("OUTREACH_POSTAL_ADDRESS") || "", 500);
  const unsubscribeSecret = Deno.env.get("EMAIL_UNSUBSCRIBE_SECRET") || "";
  const campaignEnabled = String(Deno.env.get("EMAIL_CAMPAIGN_ENABLED") || "").toLowerCase() === "true";
  const proofStatus = clean(Deno.env.get("EMAIL_DELIVERABILITY_PROOF_STATUS") || "", 80).toLowerCase();
  return {
    resend_enabled: settings?.resend_enabled !== false,
    api_key_present: Boolean(Deno.env.get("RESEND_API_KEY")),
    campaign_enabled: campaignEnabled,
    deliverability_verified: ["verified", "passed", "production_verified"].includes(proofStatus),
    proof_status: proofStatus || "missing",
    from_email: fromEmail,
    from_email_valid: isValidEmail(fromEmail) && fromEmail.endsWith("@clientsurgesystems.com"),
    reply_to: replyTo,
    reply_to_valid: isValidEmail(replyTo),
    postal_address_present: Boolean(postalAddress),
    unsubscribe_secret_present: unsubscribeSecret.length >= 32,
    postal_address: postalAddress,
  };
}

function readinessFailures(readiness: ReturnType<typeof senderReadiness>) {
  const failures: string[] = [];
  if (!readiness.resend_enabled) failures.push("Resend is disabled in AdminSettings");
  if (!readiness.api_key_present) failures.push("RESEND_API_KEY is missing");
  if (!readiness.campaign_enabled) failures.push("EMAIL_CAMPAIGN_ENABLED must be true");
  if (!readiness.deliverability_verified) failures.push("EMAIL_DELIVERABILITY_PROOF_STATUS must be verified");
  if (!readiness.from_email_valid) failures.push("A verified @clientsurgesystems.com sender is required");
  if (!readiness.reply_to_valid) failures.push("OUTREACH_REPLY_TO_EMAIL is invalid");
  if (!readiness.postal_address_present) failures.push("OUTREACH_POSTAL_ADDRESS is required");
  if (!readiness.unsubscribe_secret_present) failures.push("EMAIL_UNSUBSCRIBE_SECRET must contain at least 32 characters");
  return failures;
}

async function upsertRecipient(
  base44: ReturnType<typeof createClientFromRequest>,
  campaignId: string,
  lead: Record<string, unknown>,
  email: string,
) {
  const existing = await base44.asServiceRole.entities.EmailCampaignRecipient.filter(
    { campaign_id: campaignId, lead_id: lead.id },
    "-created_date",
    5,
  ).catch(() => []);
  if (existing?.[0]) {
    await base44.asServiceRole.entities.EmailCampaignRecipient.update(existing[0].id, {
      email,
      lead_name: clean(lead.full_name || lead.owner_contact_name || lead.business_name || "", 240),
      status: "pending",
      error_message: null,
      suppression_reason: null,
    });
    return { ...existing[0], email, status: "pending" };
  }
  return base44.asServiceRole.entities.EmailCampaignRecipient.create({
    campaign_id: campaignId,
    lead_id: lead.id,
    tenant_scope_status: "system_internal",
    email,
    lead_name: clean(lead.full_name || lead.owner_contact_name || lead.business_name || "", 240),
    status: "pending",
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return secureJson({ error: "Method not allowed" }, 405);
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);
    const body = await req.json().catch(() => ({}));
    const campaignId = clean(body?.campaign_id, 120);
    const previewOnly = body?.preview_only !== false;
    if (!campaignId) return secureJson({ error: "campaign_id is required" }, 400);

    const campaign = await base44.asServiceRole.entities.EmailCampaign.get(campaignId);
    if (!campaign) return secureJson({ error: "Campaign not found" }, 404);
    if (!["draft", "scheduled"].includes(String(campaign.status || "draft"))) {
      return secureJson({ error: `Campaign status '${campaign.status}' cannot be sent` }, 409);
    }

    const industrySequence = industryKey(campaign.industry_sequence);
    if (!ALLOWED_INDUSTRY_SEQUENCES.has(industrySequence)) {
      return secureJson({ error: "Choose one approved launch-industry sequence before previewing or sending" }, 400);
    }
    const filters = campaign.segment_filters && typeof campaign.segment_filters === "object"
      ? { ...campaign.segment_filters }
      : {};
    filters.industries = Array.isArray(filters.industries) && filters.industries.length
      ? filters.industries
      : [industrySequence];
    filters.outbound_ready_only = filters.outbound_ready_only !== false;
    filters.website_mode = filters.website_mode || "has_website";

    const configuredMax = Number(campaign.max_recipients || filters.max_recipients || DEFAULT_TEST_BATCH_SIZE);
    const maxRecipients = Math.max(1, Math.min(MAX_CAMPAIGN_RECIPIENTS, configuredMax));
    const allLeads = await base44.asServiceRole.entities.Leads.list("-lead_score", 10000, 0);
    const matching = (allLeads || []).filter((lead: Record<string, unknown>) =>
      matchesCampaignFilters(lead, filters, industrySequence)
    );

    const suppressedCounts: Record<string, number> = {};
    const seenEmails = new Set<string>();
    const eligible: Record<string, unknown>[] = [];
    for (const lead of matching) {
      const email = normalizeEmail(lead.email);
      let reason = suppressionReason(lead, filters);
      if (!reason && seenEmails.has(email)) reason = "duplicate_email";
      if (reason) {
        suppressedCounts[reason] = (suppressedCounts[reason] || 0) + 1;
        continue;
      }
      seenEmails.add(email);
      eligible.push(lead);
      if (eligible.length >= maxRecipients) break;
    }

    const settingsRows = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1).catch(() => []);
    const readiness = senderReadiness(campaign, settingsRows?.[0] || null);
    const failures = readinessFailures(readiness);
    const preview = {
      success: true,
      preview_only: true,
      campaign_id: campaignId,
      industry_sequence: industrySequence,
      matching_count: matching.length,
      recipient_count: eligible.length,
      suppressed_count: Object.values(suppressedCounts).reduce((sum, value) => sum + value, 0),
      suppression_counts: suppressedCounts,
      outbound_ready_only: filters.outbound_ready_only,
      website_mode: filters.website_mode,
      max_recipients: maxRecipients,
      sending_ready: failures.length === 0,
      readiness_failures: failures,
      proof_status: readiness.proof_status,
      sender: readiness.from_email,
      reply_to: readiness.reply_to,
      sample_recipients: eligible.slice(0, 10).map((lead) => ({
        id: lead.id,
        name: clean(lead.full_name || lead.business_name || "", 200),
        email: normalizeEmail(lead.email),
        industry: clean(lead.industry || lead.business_type || "", 160),
        website: clean(lead.website || lead.website_url || "", 300),
        status: lead.quality_review_status,
      })),
    };
    if (previewOnly) return secureJson(preview);
    if (failures.length) return secureJson({ error: "Campaign sending is not ready", readiness_failures: failures }, 503);
    if (!eligible.length) return secureJson({ error: "No verified recipients match this campaign" }, 409);

    await base44.asServiceRole.entities.EmailCampaign.update(campaignId, {
      status: "sending",
      total_recipients: eligible.length,
      suppressed_recipients: preview.suppressed_count,
    });

    const apiKey = Deno.env.get("RESEND_API_KEY")!;
    const functionBase = clean(
      Deno.env.get("PUBLIC_FUNCTION_BASE_URL") || "https://clientsurgesystems.com/functions",
      500,
    ).replace(/\/$/, "");
    let sent = 0;
    let failed = 0;

    for (const lead of eligible) {
      const email = normalizeEmail(lead.email);
      const recipient = await upsertRecipient(base44, campaignId, lead, email);
      try {
        const token = await createEmailUnsubscribeToken({
          recipient_id: recipient.id,
          campaign_id: campaignId,
          lead_id: String(lead.id),
          email,
        });
        const unsubscribeUrl = `${functionBase}/unsubscribeEmail?token=${encodeURIComponent(token)}`;
        const personalizedSubject = replaceTokens(String(campaign.subject || ""), lead);
        const personalizedHtml = replaceTokens(String(campaign.body_html || ""), lead);
        const personalizedText = replaceTokens(String(campaign.body_text || ""), lead);
        const html = buildHtml({
          bodyHtml: personalizedHtml,
          bodyText: personalizedText,
          unsubscribeUrl,
          postalAddress: readiness.postal_address,
        });
        const text = buildText(
          personalizedText || personalizedHtml.replace(/<[^>]+>/g, " "),
          unsubscribeUrl,
          readiness.postal_address,
        );

        const response = await resendFetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `ClientSurge Systems <${readiness.from_email}>`,
            to: [email],
            reply_to: readiness.reply_to,
            subject: personalizedSubject,
            html,
            text,
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:support@clientsurgesystems.com?subject=Unsubscribe>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              "X-ClientSurge-Campaign-ID": campaignId,
              "X-ClientSurge-Recipient-ID": recipient.id,
            },
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.id) {
          throw new Error(result?.message || `Resend returned HTTP ${response.status}`);
        }

        const now = new Date().toISOString();
        await base44.asServiceRole.entities.EmailCampaignRecipient.update(recipient.id, {
          status: "sent",
          provider_from_email: readiness.from_email,
          sent_at: now,
          resend_message_id: result.id,
          error_message: null,
        });
        const leadUpdate: Record<string, unknown> = {
          last_contacted_at: now,
          last_email_sent_at: now,
          outreach_status: "contacted",
          outreach_attempt_count: Number(lead.outreach_attempt_count || 0) + 1,
          last_outreach_campaign_id: campaignId,
          next_follow_up_at: new Date(Date.now() + Number(campaign.follow_up_days || 3) * 86400000).toISOString(),
        };
        if (!ADVANCED_CRM_STAGES.has(String(lead.crm_stage || ""))) {
          leadUpdate.status = "Contacted";
          leadUpdate.crm_stage = "Contacted";
          leadUpdate.lead_state = "CONTACTED";
        }
        await base44.asServiceRole.entities.Leads.update(lead.id, leadUpdate);
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: "email",
          direction: "outbound",
          event_type: "email_sent",
          provider: "resend",
          provider_message_id: result.id,
          status: "sent",
          campaign_id: campaignId,
          campaign_recipient_id: recipient.id,
          subject: personalizedSubject,
          message_body: personalizedText,
          sent_at: now,
          metadata_json: JSON.stringify({ industry_sequence: industrySequence }),
        }).catch(() => null);
        sent += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        await base44.asServiceRole.entities.EmailCampaignRecipient.update(recipient.id, {
          status: "failed",
          error_message: message.slice(0, 1000),
        }).catch(() => null);
      }
      if (SEND_DELAY_MS > 0) await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
    }

    await base44.asServiceRole.entities.EmailCampaign.update(campaignId, {
      status: "sent",
      sent_at: new Date().toISOString(),
      total_sent: sent,
    });

    return secureJson({
      success: true,
      campaign_id: campaignId,
      sent,
      failed,
      suppressed: preview.suppressed_count,
      total_recipients: eligible.length,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson({ error: error.message, code: error.code }, error.status);
    }
    const message = error instanceof Error ? error.message : "Campaign send failed";
    console.error("[sendEmailCampaign]", message);
    return secureJson({ error: message }, 500);
  }
});
