/**
 * sendLeadConfirmationEmail — self-contained (no _shared imports)
 * Sends a confirmation email to a new Leads record via Resend.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const lead_id = body?.lead_id || body?.event?.entity_id || body?.data?.id;
    if (!lead_id) return json({ error: "lead_id required" }, 400);

    const leads = await base44.asServiceRole.entities.Leads.filter({ id: lead_id });
    if (!leads?.length) return json({ error: "Lead not found" }, 404);
    const lead = leads[0];

    if (!lead.email) {
      console.log(`[sendLeadConfirmationEmail] No email on lead ${lead_id} — skipped`);
      return json({ success: false, reason: "No email address on lead" });
    }

    const settings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1).catch(() => []);
    const adminSettings = settings?.[0] || {};

    const bookingLink = adminSettings?.booking_link_default || Deno.env.get("DEFAULT_BOOKING_LINK") || "";
    const firstName = (lead.full_name || "there").split(" ")[0];

    const templateContent = adminSettings?.email_confirmation_template ||
      `Hi ${firstName},\n\nThanks for reaching out to us! We received your inquiry and a member of our team will be in touch shortly.\n\n${bookingLink ? `You can also book a call here: ${bookingLink}\n\n` : ""}Best regards,\nThe ClientSurge Systems Team`;

    const emailBody = templateContent
      .replace(/\{\{full_name\}\}/g, lead.full_name || "there")
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{booking_link\}\}/g, bookingLink);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurgesystems.com";

    if (!resendKey) {
      console.error("[sendLeadConfirmationEmail] RESEND_API_KEY not set");
      return json({ error: "RESEND_API_KEY not configured" }, 500);
    }

    let eventStatus = "sent";
    let providerId = null;
    let errorMsg = null;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail.includes("@") && !fromEmail.includes("<") ? `ClientSurge Systems <${fromEmail}>` : fromEmail,
        to: lead.email,
        subject: "We received your inquiry",
        text: emailBody,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      errorMsg = err?.message || `Resend HTTP ${res.status}`;
      eventStatus = "failed";
      console.error("[sendLeadConfirmationEmail] Resend error:", errorMsg);
    } else {
      const data = await res.json().catch(() => ({}));
      providerId = data?.id || null;
      console.log(`[sendLeadConfirmationEmail] Sent to ${lead.email} — id: ${providerId}`);
    }

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: "email",
      direction: "outbound",
      event_type: "email_sent",
      provider: "resend",
      status: eventStatus,
      subject: "We received your inquiry",
      message_body: emailBody.slice(0, 500),
      provider_message_id: providerId,
      error_message: errorMsg,
    }).catch(() => null);

    return json({ success: eventStatus === "sent", event_status: eventStatus, provider_message_id: providerId, error: errorMsg });
  } catch (error) {
    console.error("[sendLeadConfirmationEmail] error:", error);
    return json({ error: error.message }, 500);
  }
});