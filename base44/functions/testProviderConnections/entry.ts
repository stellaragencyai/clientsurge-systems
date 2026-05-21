import { resendFetch } from "../_shared/resendFetch.js";
import { twilioFetch } from "../_shared/providerFetch.js";
/**
 * testProviderConnections — #172
 * Tests Twilio and Resend credentials live. Returns {success, message}.
 */
Deno.serve(async (req) => {
  const { provider } = await req.json().catch(() => ({}));

  if (provider === "twilio") {
    const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const auth = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!sid || !auth) return Response.json({ success: false, message: "Twilio credentials not configured" });
    try {
      const res = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
        headers: { Authorization: `Basic ${btoa(`${sid}:${auth}`)}` },
      });
      if (res.ok) {
        const d = await res.json();
        return Response.json({ success: true, message: `Connected — Account: ${d.friendly_name || sid}` });
      }
      const err = await res.json().catch(() => ({}));
      return Response.json({ success: false, message: `Error ${res.status}: ${err?.message || "unknown"}` });
    } catch (e) { return Response.json({ success: false, message: e.message }); }
  }

  if (provider === "resend") {
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return Response.json({ success: false, message: "Resend key not configured" });
    try {
      const res = await resendFetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${key}` } });
      if (res.ok) {
        const d = await res.json();
        const domains = (d?.data || []).map((x) => x.name).join(", ") || "verified";
        return Response.json({ success: true, message: `Connected — Domains: ${domains}` });
      }
      const err = await res.json().catch(() => ({}));
      return Response.json({ success: false, message: `Error ${res.status}: ${err?.message || "unknown"}` });
    } catch (e) { return Response.json({ success: false, message: e.message }); }
  }

  return Response.json({ success: false, message: "Unknown provider — use 'twilio' or 'resend'" }, { status: 400 });
});
