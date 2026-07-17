import { createClientFromRequest } from "npm:@base44/sdk@0.8.39";

const SHARED_MESSAGING_SERVICE_SID = "MG01671b8a8ce56066b9f36e9f50463cee";

const REGISTRY = [
  {
    phone_number: "+18778123630",
    display_name: "ClientSurge Customer Service",
    purpose: "customer_service",
    phone_number_sid: "PN7a5a6f2f97d22f4043b9c32087088368",
    messaging_service_sid: SHARED_MESSAGING_SERVICE_SID,
    registration_type: "toll_free",
    registration_status: "approved",
    registration_sid: "HHcc53b133b3a2e6ca0e2ef92bebba40c7",
    sms_enabled: true,
    mms_enabled: true,
    voice_enabled: true,
    automated_sending_allowed: true,
    approval_status: "approved",
    inbound_sms_webhook_url: "https://clientsurgesystems.com/api/functions/receiveTwilioInboundSms",
    voice_webhook_url: "https://clientsurgesystems.com/functions/receiveInboundVoiceCall",
    status_callback_url: "https://clientsurgesystems.com/functions/receiveTwilioSmsStatusCallback",
    is_public: true,
    is_default_for_purpose: true,
    active: true,
    notes: "Primary ClientSurge customer-service, support, website-lead, onboarding and transactional number. Toll-free SMS registration is approved. Uses the shared ClientSurge Production SMS - A2P Messaging Service. The webhook authentication key must remain in Base44/Twilio configuration and must never be committed here.",
  },
  {
    phone_number: "+16025843227",
    display_name: "Nolan ClientSurge Sales",
    purpose: "sales",
    phone_number_sid: "PN73cc717e25293ae525af3b1f769a99bf",
    messaging_service_sid: SHARED_MESSAGING_SERVICE_SID,
    registration_type: "a2p_10dlc",
    registration_status: "verified",
    registration_sid: "CM71e7609ae7a70e89cc3a65ed3908ccbb",
    brand_sid: "BN15fd96554d8b8865fa34224d252d789f",
    campaign_sid: "CM71e7609ae7a70e89cc3a65ed3908ccbb",
    sms_enabled: true,
    mms_enabled: true,
    voice_enabled: true,
    automated_sending_allowed: true,
    approval_status: "approved",
    inbound_sms_webhook_url: "https://clientsurgesystems.com/api/functions/receiveTwilioInboundSms",
    voice_webhook_url: "https://clientsurgesystems.com/functions/receiveInboundVoiceCall",
    status_callback_url: "https://clientsurgesystems.com/functions/receiveTwilioSmsStatusCallback",
    is_public: false,
    is_default_for_purpose: true,
    active: true,
    notes: "Primary Nolan sales, Arizona/local outreach and direct sales follow-up number. A2P Brand is approved and A2P Campaign is verified. Uses the shared ClientSurge Production SMS - A2P Messaging Service.",
  },
  {
    phone_number: "+16025874608",
    display_name: "Nolan Personal Verification",
    purpose: "personal_verification",
    registration_type: "none",
    registration_status: "not_required",
    sms_enabled: false,
    mms_enabled: false,
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
