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

const BATCH_SIZE = 50; // Resend recommends batching

function matchesFilters(lead, filters) {
  if (!filters) return true;
  
  if (filters.statuses?.length > 0 && !filters.statuses.includes(lead.status)) {
    return false;
  }
  if (filters.sources?.length > 0 && !filters.sources.includes(lead.source)) {
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

async function sendViaResend(to, subject, html, text, fromEmail, resendKey, campaignId, recipientId) {
  // Add tracking pixel for opens
  const trackingPixel = `<img src="https://clientsurge.base44.app/api/track/open/${campaignId}/${recipientId}" width="1" height="1" style="display:none" />`;
  const htmlWithTracking = html ? `${html}${trackingPixel}` : undefined;

  const res = await fetch("https://api.resend.com/emails", {
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
    const base44 = createClientFromRequest(req);

    // Auth check
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { campaign_id, preview_only } = body;

    if (!campaign_id) {
      return Response.json({ error: "campaign_id is required" }, { status: 400 });
    }

    // Load campaign
    const campaign = await base44.asServiceRole.entities.EmailCampaign.get(campaign_id);
    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (!preview_only && !["draft", "scheduled"].includes(campaign.status)) {
      return Response.json({ error: `Cannot send campaign with status: ${campaign.status}` }, { status: 400 });
    }

    // Load settings
    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};
    
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = settings.resend_from_email || "noreply@clientsurge.com";

    if (!preview_only && !resendKey) {
      return Response.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    // Get all leads with email
    const allLeads = await base44.asServiceRole.entities.Leads.list("-created_date", 5000);
    const eligibleLeads = (allLeads || []).filter(lead => {
      if (!lead.email) return false;
      return matchesFilters(lead, campaign.segment_filters);
    });

    if (preview_only) {
      return Response.json({
        success: true,
        preview: true,
        recipient_count: eligibleLeads.length,
        sample_recipients: eligibleLeads.slice(0, 5).map(l => ({
          name: l.full_name,
          email: l.email,
          status: l.status,
        })),
      });
    }

    // Mark campaign as sending
    await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
      status: "sending",
      total_recipients: eligibleLeads.length,
    });

    let sent = 0;
    let failed = 0;
    const errors = [];

    // Process in batches
    for (let i = 0; i < eligibleLeads.length; i += BATCH_SIZE) {
      const batch = eligibleLeads.slice(i, i + BATCH_SIZE);

      for (const lead of batch) {
        try {
          // Create recipient record first
          const recipient = await base44.asServiceRole.entities.EmailCampaignRecipient.create({
            campaign_id,
            lead_id: lead.id,
            email: lead.email,
            lead_name: lead.full_name || "",
            status: "pending",
          });

          // Personalize content
          const personalizedSubject = personalizeContent(campaign.subject, lead);
          const personalizedHtml = personalizeContent(campaign.body_html, lead);
          const personalizedText = personalizeContent(campaign.body_text, lead);

          // Send email
          const messageId = await sendViaResend(
            lead.email,
            personalizedSubject,
            personalizedHtml,
            personalizedText,
            fromEmail,
            resendKey,
            campaign_id,
            recipient.id
          );

          // Update recipient record
          await base44.asServiceRole.entities.EmailCampaignRecipient.update(recipient.id, {
            status: "sent",
            sent_at: new Date().toISOString(),
            resend_message_id: messageId,
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
            metadata_json: JSON.stringify({ campaign_id, recipient_id: recipient.id }),
          });

          sent++;
        } catch (err) {
          failed++;
          errors.push({ email: lead.email, error: err.message });
          console.error(`sendEmailCampaign error for ${lead.email}:`, err.message);
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < eligibleLeads.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update campaign final status
    await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
      status: "sent",
      sent_at: new Date().toISOString(),
      total_sent: sent,
    });

    return Response.json({
      success: true,
      campaign_id,
      total_recipients: eligibleLeads.length,
      sent,
      failed,
      errors: errors.slice(0, 10), // Return first 10 errors
    });

  } catch (error) {
    console.error("sendEmailCampaign error:", error);
    return Response.json({ error: error.message || "Failed to send campaign" }, { status: 500 });
  }
});