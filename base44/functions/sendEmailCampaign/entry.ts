import { secureJson } from "../_shared/response.ts";
/**
 * sendEmailCampaign — sends an email campaign to segmented leads.
 *
 * Payload:
 *  - campaign_id: the EmailCampaign to send
 *  - preview_only: if true, returns recipient count without sending
 *
 * Flow:
 *  1. Load campaign and validate status
 *  2. Apply segment filters to get matching leads
 *  3. Create EmailCampaignRecipient records
 *  4. Send emails via Resend with tracking
 *  5. Update campaign metrics
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

const BATCH_SIZE = 25;
const MAX_LEADS = 5000;
const MAX_SAFE_TEST_RECIPIENTS = 50;
const DEFAULT_FOLLOW_UP_DAYS = 3;
const RECENT_CONTACT_WINDOW_DAYS = 14;
const TERMINAL_SUPPRESSION_STATUSES = new Set(["Closed", "Won", "Lost"]);
const PROOF_READY_VALUES = new Set(["verified", "passed", "production_verified"]);

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase();
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasIndustrySegmentation(filters = {}) {
  return toArray(filters.industries).length > 0 || toArray(filters.tags).length > 0;
}

function leadIndustryTokens(lead) {
  return [
    lead.industry,
    lead.business_type,
    lead.niche,
    ...toArray(lead.industry_tags),
  ].map(normalizeToken).filter(Boolean);
}

function matchesIndustry(lead, industries = []) {
  if (!industries.length) return true;
  const requested = industries.map(normalizeToken).filter(Boolean);
  const leadTokens = leadIndustryTokens(lead);
  return requested.some((industry) =>
    leadTokens.some((token) => token === industry || token.includes(industry) || industry.includes(token))
  );
}

function isSuppressed(lead) {
  if (lead.do_not_contact || lead.dnc || lead.email_unsubscribed || lead.unsubscribed) return true;
  if (lead.email_bounced || lead.bounced || lead.hard_bounced) return true;
  if (TERMINAL_SUPPRESSION_STATUSES.has(lead.status) || TERMINAL_SUPPRESSION_STATUSES.has(lead.crm_stage)) return true;
  if (lead.outreach_status === "do_not_contact") return true;
  return false;
}

function hasUsableWebsite(lead) {
  return Boolean(lead.website || lead.business_website || lead.domain);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function maskEmail(value) {
  const email = normalizeEmail(value);
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1) || "*"}***@${domain}`;
}

function maskPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return `***-***-${digits.slice(-4).padStart(4, "*")}`;
}

function parseDate(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? timestamp : null;
}

function wasRecentlyContacted(lead, windowDays = RECENT_CONTACT_WINDOW_DAYS) {
  const timestamp = parseDate(lead.last_contacted_at) || parseDate(lead.last_contacted_date);
  if (!timestamp) return false;
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  return timestamp >= cutoff;
}

function getSuppressionReason(lead) {
  if (lead.do_not_contact || lead.dnc || lead.outreach_status === "do_not_contact") return "do_not_contact";
  if (lead.email_unsubscribed || lead.unsubscribed) return "unsubscribed";
  if (lead.email_bounced || lead.bounced || lead.hard_bounced) return "bounced";
  if (TERMINAL_SUPPRESSION_STATUSES.has(lead.status) || TERMINAL_SUPPRESSION_STATUSES.has(lead.crm_stage)) return "closed_won_lost";
  return "";
}

function getRecipientLimit(campaign) {
  const requested = Number(campaign?.max_recipients ?? campaign?.segment_filters?.max_recipients ?? MAX_SAFE_TEST_RECIPIENTS);
  if (!Number.isFinite(requested) || requested < 1) return MAX_SAFE_TEST_RECIPIENTS;
  return Math.min(Math.floor(requested), MAX_SAFE_TEST_RECIPIENTS);
}

function getCampaignSendGate() {
  const campaignEnabled = String(Deno.env.get("EMAIL_CAMPAIGN_ENABLED") || "").trim().toLowerCase() === "true";
  const proofStatus = String(Deno.env.get("EMAIL_DELIVERABILITY_PROOF_STATUS") || "").trim().toLowerCase();
  const proofReady = PROOF_READY_VALUES.has(proofStatus);

  if (!campaignEnabled) {
    return {
      ok: false,
      reason: "EMAIL_CAMPAIGN_ENABLED must be true before campaign sends.",
      proof_status: proofStatus || "missing",
    };
  }
  if (!proofReady) {
    return {
      ok: false,
      reason: "EMAIL_DELIVERABILITY_PROOF_STATUS must be verified before campaign sends.",
      proof_status: proofStatus || "missing",
    };
  }
  return { ok: true, proof_status: proofStatus };
}

function followUpDateIso(campaign) {
  const days = Number(campaign?.follow_up_days ?? DEFAULT_FOLLOW_UP_DAYS);
  const safeDays = Number.isFinite(days) && days > 0 && days <= 14 ? days : DEFAULT_FOLLOW_UP_DAYS;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + safeDays);
  return date.toISOString();
}

function appendEmailCompliance(html, text, unsubscribeEmail) {
  const unsubscribeLine = `\n\nTo unsubscribe, reply "unsubscribe" or email ${unsubscribeEmail}.`;
  const htmlFooter = `<p style="margin-top:24px;color:#667085;font-size:12px;line-height:1.5">To unsubscribe, reply "unsubscribe" or email <a href="mailto:${unsubscribeEmail}?subject=Unsubscribe">${unsubscribeEmail}</a>.</p>`;
  return {
    html: html ? `${html}${htmlFooter}` : undefined,
    text: text ? `${text}${unsubscribeLine}` : unsubscribeLine.trim(),
  };
}

function matchesFilters(lead, filters) {
  if (!filters) return true;
  
  if (filters.statuses?.length > 0 && !filters.statuses.includes(lead.status)) {
    return false;
  }
  if (filters.sources?.length > 0 && !filters.sources.includes(lead.source)) {
    return false;
  }
  if (!matchesIndustry(lead, filters.industries || [])) {
    return false;
  }
  if (filters.lead_score_min != null && (lead.lead_score || 0) < filters.lead_score_min) {
    return false;
  }
  if (filters.lead_score_max != null && (lead.lead_score || 0) > filters.lead_score_max) {
    return false;
  }
  // Tag matching (any tag matches)
  if (filters.tags?.length > 0) {
    const leadTags = lead.industry_tags || [];
    if (!filters.tags.some(tag => leadTags.includes(tag))) {
      return false;
    }
  }
  return true;
}

function personalizeContent(content, lead) {
  return (content || "")
    .replace(/{name}/g, lead.full_name || "there")
    .replace(/{first_name}/g, (lead.full_name || "").split(" ")[0] || "there")
    .replace(/{business_name}/g, lead.business_name || "your business")
    .replace(/{email}/g, lead.email || "");
}

async function sendViaResend(to, subject, html, text, fromEmail, resendKey, campaignId, recipientId, unsubscribeEmail) {
  // Add tracking pixel for opens
  const trackingPixel = `<img src="https://clientsurge.base44.app/api/track/open/${campaignId}/${recipientId}" width="1" height="1" style="display:none" />`;
  const htmlWithTracking = html ? `${html}${trackingPixel}` : undefined;

  const res = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html: htmlWithTracking,
      text: text || undefined,
      headers: {
        "X-Campaign-ID": campaignId,
        "X-Recipient-ID": recipientId,
        "List-Unsubscribe": `<mailto:${unsubscribeEmail}?subject=Unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Resend API error");
  }

  const data = await res.json();
  return data.id; // Resend message ID
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    // Auth check
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user || user.role !== "admin") {
      return secureJson({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { campaign_id, preview_only } = body;

    if (!campaign_id) {
      return secureJson({ error: "campaign_id is required" }, { status: 400 });
    }

    // Load campaign
    const campaign = await base44.asServiceRole.entities.EmailCampaign.get(campaign_id);
    if (!campaign) {
      return secureJson({ error: "Campaign not found" }, { status: 404 });
    }

    if (!preview_only && !["draft", "scheduled"].includes(campaign.status)) {
      return secureJson({ error: `Cannot send campaign with status: ${campaign.status}` }, { status: 400 });
    }

    // Load settings
    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};
    
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail =
      settings.resend_from_email ||
      Deno.env.get("RESEND_FROM_LEADS") ||
      "support@clientsurgesystems.com";
    const unsubscribeEmail = settings.unsubscribe_email || settings.support_email || "support@clientsurgesystems.com";

    if (!preview_only && !resendKey) {
      return secureJson({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    if (!preview_only) {
      const sendGate = getCampaignSendGate();
      if (!sendGate.ok) {
        return secureJson({
          error: "Campaign sending is blocked until deliverability proof is complete.",
          email_sent: false,
          safe_to_continue: false,
          requires_owner_action: true,
          reason: sendGate.reason,
          proof_status: sendGate.proof_status,
        }, { status: 403 });
      }
    }

    if (!hasIndustrySegmentation(campaign.segment_filters || {})) {
      return secureJson({
        error: "Industry segmentation is required before previewing or sending. Choose Roofing, HVAC, Dental, or another explicit industry segment.",
      }, { status: 400 });
    }

    const requestedLimit = Number(campaign?.max_recipients ?? campaign?.segment_filters?.max_recipients ?? MAX_SAFE_TEST_RECIPIENTS);
    if (!preview_only && requestedLimit > MAX_SAFE_TEST_RECIPIENTS) {
      return secureJson({
        error: `Campaign test batches are capped at ${MAX_SAFE_TEST_RECIPIENTS} recipients. Lower max_recipients before sending.`,
      }, { status: 400 });
    }

    // Get leads, segment them, and exclude unsafe recipients before capping the batch.
    const allLeads = await base44.asServiceRole.entities.Leads.list("-created_date", MAX_LEADS);
    const matchingLeads = (allLeads || []).filter(lead => matchesFilters(lead, campaign.segment_filters));
    const missingEmailLeads = matchingLeads.filter((lead) => !lead.email);
    const leadsWithEmail = matchingLeads.filter((lead) => lead.email);
    const missingWebsiteLeads = leadsWithEmail.filter((lead) => !hasUsableWebsite(lead));
    const leadsWithRequiredFields = leadsWithEmail.filter(hasUsableWebsite);
    const suppressedLeads = leadsWithRequiredFields.filter(isSuppressed);
    const unsuppressedLeads = leadsWithRequiredFields.filter((lead) => !isSuppressed(lead));
    const recentlyContactedLeads = unsuppressedLeads.filter(wasRecentlyContacted);
    const dedupeReadyLeads = unsuppressedLeads.filter((lead) => !wasRecentlyContacted(lead));
    const duplicateEmails = new Set();
    const seenEmails = new Set();
    const dedupedLeads = [];

    for (const lead of dedupeReadyLeads) {
      const email = normalizeEmail(lead.email);
      if (!email) continue;
      if (seenEmails.has(email)) {
        duplicateEmails.add(email);
        continue;
      }
      seenEmails.add(email);
      dedupedLeads.push(lead);
    }

    const recipientLimit = getRecipientLimit(campaign);
    const eligibleLeads = dedupedLeads.slice(0, recipientLimit);

    if (preview_only) {
      const suppressionReasons = suppressedLeads.reduce((acc, lead) => {
        const reason = getSuppressionReason(lead) || "other";
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});
      return secureJson({
        success: true,
        preview: true,
        matching_count: matchingLeads.length,
        suppressed_count: suppressedLeads.length,
        missing_email_count: missingEmailLeads.length,
        missing_website_count: missingWebsiteLeads.length,
        duplicate_excluded_count: duplicateEmails.size,
        recently_contacted_count: recentlyContactedLeads.length,
        suppression_reasons: suppressionReasons,
        max_recipients: recipientLimit,
        recipient_count: eligibleLeads.length,
        sample_recipients: eligibleLeads.slice(0, 5).map(l => ({
          label: l.business_name || "Masked lead",
          email_masked: maskEmail(l.email),
          phone_masked: maskPhone(l.phone),
          status: l.status,
          industry: l.business_type || l.industry || toArray(l.industry_tags)[0] || "",
        })),
      });
    }

    const existingRecipients = await base44.asServiceRole.entities.EmailCampaignRecipient.filter(
      { campaign_id },
      "-created_date",
      MAX_LEADS
    );
    const existingRecipientByLeadId = new Map(
      (existingRecipients || [])
        .filter((recipient) => recipient?.lead_id)
        .map((recipient) => [recipient.lead_id, recipient])
    );

    // Mark campaign as sending
    await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
      status: "sending",
      total_recipients: eligibleLeads.length,
      suppressed_recipients: suppressedLeads.length,
    });

    let sent = 0;
    let failed = 0;
    const errors = [];

    // Process in batches
    for (let i = 0; i < eligibleLeads.length; i += BATCH_SIZE) {
      const batch = eligibleLeads.slice(i, i + BATCH_SIZE);

      for (const lead of batch) {
        const existingRecipient = existingRecipientByLeadId.get(lead.id) || null;
        let recipient = existingRecipient;
        try {
          if (existingRecipient && ["sent", "delivered", "opened", "clicked"].includes(existingRecipient.status)) {
            continue;
          }

          recipient = existingRecipient
            ? await base44.asServiceRole.entities.EmailCampaignRecipient.update(existingRecipient.id, {
                email: lead.email,
                lead_name: lead.full_name || "",
                status: "pending",
                error_message: undefined,
              })
            : await base44.asServiceRole.entities.EmailCampaignRecipient.create({
                campaign_id,
                lead_id: lead.id,
                email: lead.email,
                lead_name: lead.full_name || "",
                status: "pending",
              });

          const personalizedSubject = personalizeContent(campaign.subject, lead);
          const personalizedHtml = personalizeContent(campaign.body_html, lead);
          const personalizedText = personalizeContent(campaign.body_text, lead);
          const compliantContent = appendEmailCompliance(personalizedHtml, personalizedText, unsubscribeEmail);

          // Send email
          const messageId = await sendViaResend(
            lead.email,
            personalizedSubject,
            compliantContent.html,
            compliantContent.text,
            fromEmail,
            resendKey,
            campaign_id,
            recipient.id,
            unsubscribeEmail
          );

          const nextFollowUpAt = followUpDateIso(campaign);

          // Update recipient record
          await base44.asServiceRole.entities.EmailCampaignRecipient.update(recipient.id, {
            status: "sent",
            sent_at: new Date().toISOString(),
            resend_message_id: messageId,
            error_message: undefined,
          });

          await base44.asServiceRole.entities.Leads.update(lead.id, {
            status: lead.status === "New" ? "Contacted" : lead.status,
            crm_stage: lead.crm_stage === "Not Contacted" || !lead.crm_stage ? "Contacted" : lead.crm_stage,
            outreach_status: "contacted",
            last_contacted_at: new Date().toISOString(),
            last_contacted_date: new Date().toISOString(),
            next_follow_up_at: nextFollowUpAt,
            follow_up_date: nextFollowUpAt,
            last_outreach_campaign_id: campaign_id,
            last_outreach_subject: personalizedSubject,
            landing_page_url: campaign.landing_page_url || "",
          });

          // Log communication event
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: lead.id,
            channel: "email",
            direction: "outbound",
            event_type: "email_sent",
            provider: "resend",
            status: "sent",
            subject: personalizedSubject,
            message_body: personalizedText || personalizedHtml?.substring(0, 500),
            metadata_json: JSON.stringify({
              campaign_id,
              recipient_id: recipient.id,
              outreach: true,
              landing_page_url: campaign.landing_page_url || "",
              next_follow_up_at: nextFollowUpAt,
              industry_segment: campaign.segment_filters?.industries || campaign.segment_filters?.tags || [],
            }),
          });

          sent++;
        } catch (err) {
          failed++;
          errors.push({ lead_id: lead.id, error: err.message });
          if (recipient?.id) {
            await base44.asServiceRole.entities.EmailCampaignRecipient.update(recipient.id, {
              status: "failed",
              error_message: err.message,
            }).catch(() => null);
          }
          console.error(`[sendEmailCampaign] sendEmailCampaign error for lead ${lead.id}:`, err.message);
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < eligibleLeads.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update campaign final status
    await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
      status: failed > 0 ? "paused" : "sent",
      sent_at: sent > 0 ? new Date().toISOString() : undefined,
      total_sent: sent,
    });

    return secureJson({
      success: true,
      campaign_id,
      total_recipients: eligibleLeads.length,
      sent,
      failed,
      errors: errors.slice(0, 10), // Return first 10 errors
    });

  } catch (error) {
    console.error("[sendEmailCampaign] sendEmailCampaign error:", error);
    return secureJson({ error: error.message || "Failed to send campaign" }, { status: 500 });
  }
});
