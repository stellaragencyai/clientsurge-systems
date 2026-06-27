import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

async function resendFetch(url, options) {
  try { return await fetch(url, options); }
  catch (err) { throw new Error(`Resend request failed: ${err.message || "network error"}`); }
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, email_body, campaign_type, intent, from_email } = await req.json();

    if (!lead_id || !email_body || !from_email) {
      return secureJson(
        { error: "lead_id, email_body, and from_email required" },
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
      body: JSON.stringify({
        from: from_email,
        to: lead.email,
        subject,
        html: email_body,
        reply_to: from_email,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error(`[SmartEmail] Resend error: ${error}`);
      return secureJson(
        { error: `Email delivery failed: ${error}`, success: false },
        { status: 500 }
      );
    }

    const resendData = await emailsecureJson();

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
    console.error("[SmartEmail] Error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});