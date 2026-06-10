/**
 * sendEmail — Sends email via Resend. Self-contained, no local imports.
 * Logs CommunicationEvent on success and failure.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { to, email, subject, html, body: textBody, lead_id, order_id, context_type, context_id } = body;
  const recipient = to || email;

  if (!recipient || !subject) {
    return json({ error: "to and subject are required" }, 400);
  }

  const htmlContent = html || (textBody ? `<p>${String(textBody).replace(/\n/g, "<br>")}</p>` : null);
  if (!htmlContent) {
    return json({ error: "html or body content is required" }, 400);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");

  if (!apiKey) {
    console.error("[sendEmail] RESEND_API_KEY not configured");
    return json({ error: "Email provider not configured: missing RESEND_API_KEY" }, 500);
  }
  if (!fromEmail) {
    console.error("[sendEmail] RESEND_FROM_EMAIL not configured");
    return json({ error: "Email provider not configured: missing RESEND_FROM_EMAIL" }, 500);
  }

  const base44 = createClientFromRequest(req);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(recipient) ? recipient : [recipient],
        subject,
        html: htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Resend API error ${response.status}`;
      console.error("[sendEmail] Resend API rejected request", {
        status: response.status,
        error: errorMessage,
        to: recipient,
        subject,
      });

      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: lead_id || null,
        order_id: order_id || null,
        context_type: context_type || null,
        context_id: context_id || null,
        channel: "email",
        direction: "outbound",
        event_type: "email_failed",
        provider: "resend",
        status: "failed",
        subject,
        message_body: htmlContent?.substring(0, 500),
        error_message: errorMessage,
        metadata_json: JSON.stringify({ to: recipient, resend_status: response.status }),
      }).catch(() => null);

      return json({ error: "Failed to send email", details: errorMessage, resend_status: response.status }, 500);
    }

    console.log("[sendEmail] Email sent successfully", { message_id: data.id, to: recipient, subject });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead_id || null,
      order_id: order_id || null,
      context_type: context_type || null,
      context_id: context_id || null,
      channel: "email",
      direction: "outbound",
      event_type: "email_sent",
      provider: "resend",
      status: "sent",
      subject,
      message_body: htmlContent?.substring(0, 500),
      provider_message_id: data.id,
      metadata_json: JSON.stringify({ to: recipient, resend_message_id: data.id }),
    }).catch(() => null);

    return json({ success: true, message_id: data.id });

  } catch (err) {
    console.error("[sendEmail] Unexpected error", { error: err.message, to: recipient });
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead_id || null,
      order_id: order_id || null,
      channel: "email",
      direction: "outbound",
      event_type: "email_failed",
      provider: "resend",
      status: "failed",
      subject,
      error_message: err.message,
      metadata_json: JSON.stringify({ to: recipient }),
    }).catch(() => null);
    return json({ error: err.message }, 500);
  }
});