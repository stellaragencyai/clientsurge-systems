import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { full_name, email, phone, business_type, message } = await req.json();

    if (!full_name || !email || !message) {
      return secureJson({ error: "Missing required fields" }, { status: 400 });
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

    const res = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ClientSurge Systems <system@clientsurgesystems.com>",
        to: ["system@clientsurgesystems.com"],
        reply_to: email,
        subject: `New Contact: ${full_name} — ${business_type || "General Inquiry"}`,
        html: emailBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return secureJson({ error: err }, { status: 500 });
    }

    return secureJson({ success: true });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});