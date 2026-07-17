import { createClientFromRequest } from "npm:@base44/sdk@0.8.39";

const REGISTRY = [
  {
    phone_number: "+18778123630",
    display_name: "ClientSurge Customer Service",
    purpose: "customer_service",
    sms_enabled: true,
    voice_enabled: true,
    automated_sending_allowed: true,
    approval_status: "approved",
    inbound_sms_webhook_url: "https://clientsurgesystems.com/functions/receiveTwilioInboundSms",
    voice_webhook_url: "https://clientsurgesystems.com/functions/receiveInboundVoiceCall",
    status_callback_url: "https://clientsurgesystems.com/functions/receiveTwilioSmsStatusCallback",
    is_public: true,
    is_default_for_purpose: true,
    active: true,
    notes: "Primary ClientSurge customer-service, support, website-lead, onboarding and transactional number. Phone Number SID and Messaging Service SID may be added later; they are non-secret identifiers.",
  },
  {
    phone_number: "+16025843227",
    display_name: "Nolan ClientSurge Sales",
    purpose: "sales",
    sms_enabled: true,
    voice_enabled: true,
    automated_sending_allowed: true,
    approval_status: "approved",
    inbound_sms_webhook_url: "https://clientsurgesystems.com/functions/receiveTwilioInboundSms",
    voice_webhook_url: "https://clientsurgesystems.com/functions/receiveInboundVoiceCall",
    status_callback_url: "https://clientsurgesystems.com/functions/receiveTwilioSmsStatusCallback",
    is_public: false,
    is_default_for_purpose: true,
    active: true,
    notes: "Primary Nolan sales, Arizona/local outreach and direct sales follow-up number.",
  },
  {
    phone_number: "+16025874608",
    display_name: "Nolan Personal Verification",
    purpose: "personal_verification",
    sms_enabled: false,
    voice_enabled: true,
    automated_sending_allowed: false,
    approval_status: "not_required",
    is_public: false,
    is_default_for_purpose: false,
    active: true,
    notes: "Personal number used only for manual calls and message verification. It must never be selected as an automated Twilio sender.",
  },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return json({ error: "Admin access required" }, 403);

    const results = [];

    for (const desired of REGISTRY) {
      const existing = await base44.asServiceRole.entities.TwilioPhoneNumber.filter(
        { phone_number: desired.phone_number },
        "-created_date",
        10,
      );

      const primary = existing?.[0] || null;
      if (primary) {
        await base44.asServiceRole.entities.TwilioPhoneNumber.update(primary.id, desired);
        results.push({ phone_number: desired.phone_number, action: "updated", id: primary.id });

        for (const duplicate of (existing || []).slice(1)) {
          await base44.asServiceRole.entities.TwilioPhoneNumber.update(duplicate.id, {
            active: false,
            is_default_for_purpose: false,
            notes: `${duplicate.notes || ""}\nDisabled by registry seeder as a duplicate of ${primary.id}.`.trim(),
          });
          results.push({ phone_number: desired.phone_number, action: "duplicate_disabled", id: duplicate.id });
        }
      } else {
        const created = await base44.asServiceRole.entities.TwilioPhoneNumber.create(desired);
        results.push({ phone_number: desired.phone_number, action: "created", id: created.id });
      }
    }

    const allRecords = await base44.asServiceRole.entities.TwilioPhoneNumber.list("phone_number", 100);
    return json({ success: true, seeded: results, registry: allRecords });
  } catch (error) {
    console.error("[seedTwilioPhoneNumberRegistry]", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
