import { secureJson } from "../_shared/response.ts";
/**
 * routeLead — assigns a new lead to the best available team member.
 *
 * Assignment logic:
 *  1. Fetch all Users where routing_active = true
 *  2. Filter by category match (routing_categories includes the lead's category, or user has no restriction)
 *  3. Count each user's currently active (non-Closed) assigned leads
 *  4. Pick the user with the fewest active leads who is under their max_active_leads cap
 *  5. Assign and notify via Twilio SMS
 *
 * Can be called directly (admin trigger) or by entity automation on Leads create.
 *
 * Payload (for direct calls):
 *   { lead_id: string }
 *
 * Automation payload:
 *   { event: { entity_id: string }, data: { ...lead } }
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { appendSmsOptOut } from "../_shared/smsOptOut.js";
import { twilioFetch } from "../_shared/providerFetch.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Support both direct call and automation payload shapes
    const leadId = body?.lead_id ?? body?.event?.entity_id ?? body?.data?.id ?? null;

    if (!leadId) {
      return secureJson({ error: "lead_id is required" }, { status: 400 });
    }

    // ── Load lead ─────────────────────────────────────────────────────────────
    const lead = await base44.asServiceRole.entities.Leads.get(leadId);
    if (!lead) {
      return secureJson({ error: "Lead not found" }, { status: 404 });
    }

    // Skip if already assigned
    if (lead.assigned_to) {
      return secureJson({ success: true, message: "Lead already assigned", assigned_to: lead.assigned_to });
    }

    const category = lead.lead_category || "Standard";

    // ── Load routing-active team members ──────────────────────────────────────
    const allUsers = await base44.asServiceRole.entities.User.list("-created_date", 200);
    const activeRouters = (allUsers || []).filter((u) => u.routing_active === true);

    if (!activeRouters.length) {
      console.log("[routeLead] routeLead: No active routers configured. Skipping assignment.");
      return secureJson({ success: true, message: "No team members configured for routing." });
    }

    // ── Filter by category eligibility ───────────────────────────────────────
    const eligible = activeRouters.filter((u) => {
      if (!u.routing_categories || u.routing_categories.length === 0) return true; // no restriction = handles all
      return u.routing_categories.includes(category);
    });

    if (!eligible.length) {
      console.log(`[routeLead] routeLead: No team member handles category "${category}". Falling back to all active routers.`);
    }

    const candidates = eligible.length ? eligible : activeRouters;

    // ── Count each candidate's open leads ─────────────────────────────────────
    const allLeads = await base44.asServiceRole.entities.Leads.list("-created_date", 2000);
    const workloadMap = {};
    for (const l of allLeads || []) {
      if (l.assigned_to && l.status !== "Closed") {
        workloadMap[l.assigned_to] = (workloadMap[l.assigned_to] || 0) + 1;
      }
    }

    // ── Pick best candidate (fewest active leads, under cap) ──────────────────
    const ranked = candidates
      .map((u) => ({ user: u, load: workloadMap[u.email] || 0 }))
      .filter(({ user, load }) => load < (user.max_active_leads || 20))
      .sort((a, b) => a.load - b.load);

    if (!ranked.length) {
      console.log("[routeLead] routeLead: All team members are at capacity.");
      return secureJson({ success: true, message: "All team members at capacity. Lead unassigned." });
    }

    const assignee = ranked[0].user;
    const now = new Date().toISOString();

    // ── Assign lead ───────────────────────────────────────────────────────────
    await base44.asServiceRole.entities.Leads.update(leadId, {
      assigned_to: assignee.email,
      assigned_at: now,
    });

    // ── Send SMS notification via Twilio ──────────────────────────────────────
    let smsSent = false;
    let smsError = null;

    const phone = assignee.phone;
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (phone && accountSid && authToken && fromNumber) {
      const message =
        `🔔 New ${category} lead assigned to you!\n` +
        `Name: ${lead.full_name}\n` +
        `Business: ${lead.business_name}\n` +
        `Phone: ${lead.phone || "N/A"}\n` +
        `Score: ${lead.lead_score || 0}/100\n` +
        `Problem: ${(lead.problem || "").slice(0, 80)}`;

      const twilioRes = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: phone, From: fromNumber, Body: appendSmsOptOut(message) }),
        }
      );

      if (twilioRes.ok) {
        smsSent = true;
      } else {
        const err = await twilioRes.json().catch(() => ({}));
        smsError = err?.message || "Twilio error";
        console.error("[routeLead] routeLead SMS error:", smsError);
      }
    } else {
      console.log("[routeLead] routeLead: Twilio not configured or assignee has no phone. SMS skipped.");
    }

    // ── Log CommunicationEvent ─────────────────────────────────────────────────
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      subject: `Lead assigned to ${assignee.full_name || assignee.email}`,
      message_body: `[Lead Routing] ${category} lead assigned. Workload at time of assignment: ${ranked[0].load} active leads. SMS sent: ${smsSent}.`,
      metadata_json: JSON.stringify({ assigned_to: assignee.email, category, sms_sent: smsSent, sms_error: smsError }),
    });

    return secureJson({
      success: true,
      lead_id: leadId,
      assigned_to: assignee.email,
      assignee_name: assignee.full_name || assignee.email,
      category,
      workload_at_assignment: ranked[0].load,
      sms_sent: smsSent,
      sms_error: smsError,
    });

  } catch (error) {
    console.error("[routeLead] routeLead error:", error);
    return secureJson({ error: error.message || "Routing failed" }, { status: 500 });
  }
});
