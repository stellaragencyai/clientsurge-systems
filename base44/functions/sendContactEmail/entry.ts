import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { full_name, email, phone, business_type, message } = await req.json();

    if (!full_name || !email || !message) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ClientSurge Systems <onboarding@resend.dev>",
        to: ["system@clientsurgesystems.com"],
        reply_to: email,
        subject: `New Contact: ${full_name} — ${business_type || "General Inquiry"}`,
        html: emailBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});