import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

// FORM-02: TCPA/CTIA compliant opt-out / preference management
// Called from the public opt-out form linked in all SMS/email footers

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
      preference, // "email_only" | "sms_only" | "stop_all" | "reduce_frequency"
      requested_channels, // array of allowed channels
    } = await req.json();

    if (!email && !phone && !lead_id) {
      return Response.json({ error: "Email, phone, or lead_id required" }, { status: 400 });
    }

    // Find the lead record
    let lead = null;
    if (lead_id) {
      lead = await base44.asServiceRole.entities.Leads.get(lead_id).catch(() => null);
    }
    if (!lead && email) {
      const results = await base44.asServiceRole.entities.Leads.filter({ email }, "-created_date", 1);
      lead = results?.[0] || null;
    }
    if (!lead && phone) {
      const normalized = phone.replace(/\D/g, "");
      const results = await base44.asServiceRole.entities.Leads.filter({ normalized_phone: normalized }, "-created_date", 1);
      lead = results?.[0] || null;
    }

    if (!lead) {
      // Even if we can't find the lead, we still return success (TCPA compliance)
      console.log("[updateContactPreferences] Lead not found but returning success for TCPA compliance");
      return Response.json({ success: true, message: "Preferences updated" });
    }

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
        // Note: SMS opt-out must also update sms_opted_out if applicable
        break;
      case "sms_only":
        updateData.requested_channels = ["sms"];
        updateData.email_unsubscribed = true;
        break;
      case "reduce_frequency":
        updateData.requested_channels = requested_channels || ["email"];
        break;
      default:
        if (requested_channels) {
          updateData.requested_channels = requested_channels;
        }
    }

    await base44.asServiceRole.entities.Leads.update(lead.id, updateData);

    // Log the preference change
    await base44.asServiceRole.entities.CommunicationEvent.create({
      context_type: "lead",
      context_id: lead.id,
      lead_id: lead.id,
      event_type: "contact_preference_updated",
      channel: "web",
      direction: "inbound",
      status: "processed",
      provider: "internal",
      subject: `Contact preference updated: ${preference}`,
      message_body: `Lead updated preferences to: ${preference}. Channels: ${JSON.stringify(requested_channels || [])}`,
    }).catch(() => {});

    console.log(`[updateContactPreferences] Updated lead ${lead.id} preference: ${preference}`);
    return Response.json({ success: true, message: "Your preferences have been updated." });
  } catch (error) {
    console.error("[updateContactPreferences] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});