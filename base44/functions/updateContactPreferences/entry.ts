import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function phoneDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

const PREFERENCE_CHANNELS = {
  email_only: ["email"],
  sms_only: ["sms"],
  reduce_frequency: ["email"],
  stop_all: [],
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const {
      email,
      phone,
      lead_id,
      preference,
      requested_channels,
    } = await req.json();

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = phoneDigits(phone);

    if (!normalizedEmail && !normalizedPhone && !lead_id) {
      return Response.json({ error: "Email, phone, or lead_id required" }, { status: 400 });
    }

    let lead = null;
    if (lead_id) {
      lead = await base44.asServiceRole.entities.Leads.get(lead_id).catch(() => null);
    }
    if (!lead && normalizedEmail) {
      const results = await base44.asServiceRole.entities.Leads.filter({ email: normalizedEmail }, "-created_date", 1);
      lead = results?.[0] || null;
    }
    if (!lead && normalizedPhone) {
      const results = await base44.asServiceRole.entities.Leads.filter({ normalized_phone: normalizedPhone }, "-created_date", 1);
      lead = results?.[0] || null;
    }

    if (!lead) {
      console.log("[updateContactPreferences] Lead not found but returning success for TCPA compliance");
      return Response.json({ success: true, message: "Preferences updated" });
    }

    const safeChannels = Array.isArray(requested_channels)
      ? requested_channels.filter((channel) => ["email", "sms", "call"].includes(channel))
      : PREFERENCE_CHANNELS[preference] || ["email"];

    const updateData = {
      last_activity_at: new Date().toISOString(),
    };

    switch (preference) {
      case "stop_all":
        updateData.do_not_contact = true;
        updateData.email_unsubscribed = true;
        updateData.outreach_status = "do_not_contact";
        updateData.requested_channels = [];
        break;
      case "email_only":
        updateData.requested_channels = ["email"];
        break;
      case "sms_only":
        updateData.requested_channels = ["sms"];
        updateData.email_unsubscribed = true;
        break;
      case "reduce_frequency":
        updateData.requested_channels = safeChannels;
        break;
      default:
        updateData.requested_channels = safeChannels;
    }

    await base44.asServiceRole.entities.Leads.update(lead.id, updateData);

    await base44.asServiceRole.entities.CommunicationEvent.create({
      context_type: "lead",
      context_id: lead.id,
      lead_id: lead.id,
      event_type: "status_update",
      channel: "internal",
      direction: "system",
      status: "processed",
      provider: "internal",
      subject: `Contact preference updated: ${preference}`,
      message_body: `Lead updated preferences to: ${preference}. Channels: ${JSON.stringify(updateData.requested_channels || [])}`,
    }).catch((error) => {
      console.warn("[updateContactPreferences] Preference log skipped:", error?.message || error);
    });

    console.log(`[updateContactPreferences] Updated lead ${lead.id} preference: ${preference}`);
    return Response.json({ success: true, message: "Your preferences have been updated." });
  } catch (error) {
    console.error("[updateContactPreferences] Error:", error.message);
    return Response.json({ error: "Unable to update preferences. Please contact support@clientsurgesystems.com." }, { status: 500 });
  }
});
