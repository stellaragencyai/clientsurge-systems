/**
 * onboardingStepTelegramAlert — #279
 * Triggered when any key onboarding field changes on ClientOnboarding.
 * Sends Telegram message to Nolan with what changed.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const TELEGRAM_BOT = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const TELEGRAM_NOLAN = Deno.env.get("TELEGRAM_NOLAN_ID") || "7776809236";

const WATCHED_FIELDS: Record<string, string> = {
  twilio_configured:        "📱 Twilio configured",
  lead_sources_connected:   "🔗 Lead sources connected",
  instant_response_built:   "⚡ Instant response built",
  followup_sequence_built:  "🔁 Follow-up sequence built",
  missed_call_textback:     "📞 Missed call textback active",
  messages_customized:      "✍️ Messages customized",
  end_to_end_tested:        "✅ End-to-end tested",
  dashboard_delivered:      "📊 Dashboard delivered",
  went_live:                "🚀 CLIENT IS LIVE",
  onboarding_complete:      "🎉 Onboarding complete",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const data = body.data || {};
    const old_data = body.old_data || {};
    const business = data.business_name || data.client_name || "Unknown client";

    const changes: string[] = [];
    for (const [field, label] of Object.entries(WATCHED_FIELDS)) {
      if (data[field] === true && old_data[field] !== true) {
        changes.push(`${label}`);
      }
    }

    if (!changes.length) {
      return Response.json({ skipped: true, reason: "No watched fields changed to true" });
    }

    const msg = `📋 <b>Onboarding Update</b>: ${business}\n\n${changes.join("\n")}\n\n<i>View in admin: clientsurgesystems.com/admin</i>`;

    if (TELEGRAM_BOT) {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_NOLAN, text: msg, parse_mode: "HTML" }),
      });
      if (!res.ok) throw new Error(`Telegram error ${res.status}`);
    }

    return Response.json({ success: true, changes });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
