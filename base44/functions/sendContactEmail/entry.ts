import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  sendCommunicationViaOutbox,
  sendResendEmailProvider,
} from "../_shared/communicationOutbox.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { full_name, email, phone, business_type, message } = await req.json();

    if (!full_name || !email || !message) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailBody = `
      <h2>New Contact Form Submission</h2>
      <table cellpadding="8" style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="font-weight:bold;width:160px;">Name</td><td>${full_name}</td></tr>
        <tr style="background:#f9f9f9"><td style="font-weight:bold;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="font-weight:bold;">Phone</td><td>${phone || "—"}</td></tr>
        <tr style="background:#f9f9f9"><td style="font-weight:bold;">Business Type</td><td>${business_type || "—"}</td></tr>
        <tr><td style="font-weight:bold;vertical-align:top;padding-top:12px;">Message</td><td style="padding-top:12px;">${message}</td></tr>
      </table>
    `;

    const result = await sendCommunicationViaOutbox({
      base44,
      channel: "email",
      provider: "resend",
      recipient: "system@clientsurgesystems.com",
      subject: `New Contact: ${full_name} — ${business_type || "General Inquiry"}`,
      body: emailBody,
      html: emailBody,
      from: "ClientSurge Systems <system@clientsurgesystems.com>",
      source: "sendContactEmail",
      sourceRecordId: email,
      templateKey: "contact_form_admin_notification",
      messageType: "transactional",
      consentBasis: "internal_notification",
      metadata: { reply_to: email, full_name, business_type },
      providerSend: (providerPayload) => sendResendEmailProvider({
        ...providerPayload,
        env: (name) => Deno.env.get(name),
        fetchImpl: fetch,
      }),
    });

    if (!result.success) {
      return Response.json({ error: result.reason || result.error || "Email send failed" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
