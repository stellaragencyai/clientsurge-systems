import { secureJson } from "../_shared/response.ts";
/**
 * Send Smart Email
 * Generates AI subject line + sends email via Resend
 * Integrates subject line generation into email workflow
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { buildResendEmailPayload } from "../_shared/emailPayload.js";
import { resendFetch } from "../_shared/resendFetch.js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DEFAULT_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "system@clientsurgesystems.com";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);
    const { lead_id, email_body, campaign_type, intent, from_email } = await req.json();

    if (!lead_id || !email_body) {
      return secureJson(
        { error: "lead_id and email_body required" },
        { status: 400 }
      );
    }

    console.log(`[SmartEmail] Processing send for ${lead_id}`);

    // 1. Get lead
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return secureJson({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Generate smart subject line
    const subjectResult = await base44.asServiceRole.functions.invoke(
      "generateSmartSubjectLine",
      {
        lead_id,
        campaign_type,
        intent,
        message_preview: email_body.substring(0, 100),
      }
    );

    if (!subjectResult.data?.recommended_subject) {
      return secureJson(
        { error: "Failed to generate subject line", success: false },
        { status: 500 }
      );
    }

    const subject = subjectResult.data.recommended_subject;

    // 3. Send via Resend
    const emailResponse = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildResendEmailPayload({
        from: DEFAULT_FROM_EMAIL,
        to: lead.email,
        subject,
        html: email_body,
        ...(from_email ? { reply_to: from_email } : {}),
      })),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error(`[SmartEmail] Resend error: ${error}`);
      return secureJson(
        { error: `Email delivery failed: ${error}`, success: false },
        { status: 500 }
      );
    }

    const resendData = await emailResponse.json().catch(() => ({}));

    // 4. Log communication event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      event_type: "email_sent",
      channel: "email",
      direction: "outbound",
      provider: "resend",
      status: "sent",
      subject,
      message_body: email_body.substring(0, 500),
      provider_message_id: resendData.id,
      metadata_json: JSON.stringify({
        campaign_type,
        intent,
        admin_email: user.email || null,
        subject_line_strategy: subjectResult.data.alternatives[0]?.strategy,
        estimated_open_rate: subjectResult.data.alternatives[0]?.estimated_open_rate,
      }),
    });

    console.log(`[SmartEmail] Sent to ${lead.email}, ID: ${resendData.id}`);

    return secureJson({
      success: true,
      lead_id,
      email_id: resendData.id,
      subject,
      recipient: lead.email,
      subject_strategy: subjectResult.data.alternatives[0]?.strategy,
      estimated_open_rate: subjectResult.data.alternatives[0]?.estimated_open_rate,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson(
        { error: error.message, code: error.code, success: false },
        { status: error.status }
      );
    }

    console.error("[SmartEmail] Error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});
