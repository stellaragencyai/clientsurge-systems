import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function secureJson(data, opts = {}) {
  return new Response(JSON.stringify(data), {
    status: opts.status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event !== 'lead_created') {
      return secureJson({ error: 'Invalid event' }, { status: 400 });
    }

    // Deduplication — skip if the source dedup key or same email was submitted recently.
    if (data.dedup_key) {
      const existingByKey = await base44.asServiceRole.entities.Leads.filter(
        { dedup_key: data.dedup_key },
        "-created_date",
        5
      ).catch(() => []);
      const duplicateByKey = (existingByKey || []).find((l) => l.id !== data.id);
      if (duplicateByKey) {
        console.log(`[onLeadCreated] Duplicate dedup_key ${data.dedup_key} — skipping dispatch`);
        return secureJson({ success: true, skipped: true, reason: "duplicate_dedup_key" });
      }
    }

    if (data.email || data.phone) {
      const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const existing = await base44.asServiceRole.entities.Leads.filter(
        { email: data.email },
        "-created_date",
        5
      ).catch(() => []);
      const duplicate = (existing || []).find(
        (l) => l.id !== data.id && new Date(l.created_date) > new Date(sixtyMinutesAgo)
      );
      if (duplicate) {
        console.log(`[onLeadCreated] Duplicate detected for ${data.email} — skipping dispatch`);
        return secureJson({ success: true, skipped: true, reason: "duplicate_within_60min" });
      }
    }

    // ─────────────────────────────────────────────────────
    // STEP 0: Score the lead immediately so downstream steps
    //         have an accurate lead_score and activation_priority
    // ─────────────────────────────────────────────────────
    let scoreResult = null;
    try {
      scoreResult = await base44.asServiceRole.functions.invoke('calculateLeadScore', { lead_id: data.id });
      console.log(`[onLeadCreated] Scored: score=${scoreResult?.score} priority=${scoreResult?.activation_priority}`);
    } catch (scoreErr) {
      console.log('[onLeadCreated] Scoring failed (non-blocking):', scoreErr.message);
    }

    // ─────────────────────────────────────────────────────
    // STEP A: Route lead to industry-specific AI agent
    // ─────────────────────────────────────────────────────
    let routingResult = null;
    try {
      routingResult = await base44.asServiceRole.functions.invoke('routeLeadToIndustryAgent', { lead_id: data.id });
      console.log(`[onLeadCreated] Routed to agent: ${routingResult?.agent_name} (${routingResult?.industry_key})`);
    } catch (routeErr) {
      console.log('[onLeadCreated] Routing failed (non-blocking):', routeErr.message);
    }

    // ─────────────────────────────────────────────────────
    // STEP B: Generate & send industry-personalized first SMS
    // ─────────────────────────────────────────────────────
    if (data.phone) {
      try {
        const smsResult = await base44.asServiceRole.functions.invoke('generateIndustryFirstSMS', {
          lead_id: data.id,
          industry_key: routingResult?.industry_key || 'general',
        });
        console.log(`[onLeadCreated] Industry first SMS generated (${smsResult?.char_count} chars)`);

        // Send via Twilio
        if (smsResult?.sms) {
          await base44.asServiceRole.functions.invoke('sendSMS', {
            to: data.phone,
            body: smsResult.sms,
          });
          console.log(`[onLeadCreated] Industry first SMS sent to ${data.phone}`);
        }
      } catch (smsErr) {
        console.log('[onLeadCreated] Industry SMS failed (non-blocking):', smsErr.message);
      }
    }

    // ─────────────────────────────────────────────────────
    // STEP C: Trigger ElevenLabs voice call for HOT leads
    // ─────────────────────────────────────────────────────
    const isHot = (scoreResult?.score >= 75) || (scoreResult?.activation_priority === 'Hot') ||
                  (data.lead_score >= 75) || (data.activation_priority === 'Hot');
    if (isHot && data.phone) {
      try {
        await base44.asServiceRole.functions.invoke('triggerVoiceCallToLead', { lead_id: data.id });
        console.log(`[onLeadCreated] Voice call triggered for HOT lead ${data.id}`);
      } catch (voiceErr) {
        console.log('[onLeadCreated] Voice call failed (non-blocking):', voiceErr.message);
      }
    }

    // Prepare structured webhook payload
    const payload = {
      event: 'lead_created',
      timestamp: new Date().toISOString(),
      lead: {
        id: data.id,
        name: data.full_name || data.name,
        email: data.email,
        phone: data.phone,
        niche: data.niche,
        monthly_leads: data.monthly_leads,
        status: 'NEW',
        source: 'website',
      },
    };

    // Send to webhook endpoint (n8n, Zapier, etc.)
    const webhookUrl = Deno.env.get('WEBHOOK_URL');
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.log('[onLeadCreated] Webhook failed (non-blocking):', err.message);
      }
    }

    // Send admin notification (optional)
    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    if (adminEmail) {
      try {
        await base44.integrations.Core.SendEmail({
          to: adminEmail,
          subject: `New Lead: ${data.name}`,
          body: `A new lead has been submitted.\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nBusiness: ${data.business_name}`,
        });
      } catch (err) {
        console.log('[onLeadCreated] Email failed (non-blocking):', err.message);
      }
    }


    // ─────────────────────────────────────────────────────
    // STEP Z: #251 — Run AI scoreLeadIntelligence for full scoring
    // Called after calculateLeadScore for deeper AI analysis
    // ─────────────────────────────────────────────────────
    try {
      const intelligenceScore = await base44.asServiceRole.functions.invoke('scoreLeadIntelligence', {
        lead_id: data.id,
      });
      console.log(`[onLeadCreated] AI intelligence score: ${intelligenceScore?.score} tier=${intelligenceScore?.tier}`);
    } catch (intelligenceErr) {
      console.log('[onLeadCreated] AI scoring failed (non-blocking):', intelligenceErr.message);
    }

    // ─────────────────────────────────────────────────────
    // STEP Y: Compute LeadNextBestAction — predictive value + next-best-action
    // ─────────────────────────────────────────────────────
    try {
      await base44.asServiceRole.functions.invoke('computeLeadNextBestAction', {
        lead_id: data.id,
      });
      console.log(`[onLeadCreated] Next-best-action computed for lead ${data.id}`);
    } catch (nbaErr) {
      console.log('[onLeadCreated] Next-best-action failed (non-blocking):', nbaErr.message);
    }

        return secureJson({ success: true, payload });
  } catch (error) {
    console.error('[onLeadCreated] Error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});