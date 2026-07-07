function secureJson(data, opts = {}) {
  return new Response(JSON.stringify(data), {
    status: opts.status || 200,
    headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" },
  });
}
/**
 * processNurtureCampaigns — daily runner for the 30-day nurture email sequence. (redeployed 2026-05-02b)
 *
 * 8 steps over 30 days, each with a distinct content theme:
 *  Step 1 — Day 1  : Welcome + what to expect
 *  Step 2 — Day 3  : Case study (med spa / service biz success story)
 *  Step 3 — Day 7  : Client testimonial spotlight
 *  Step 4 — Day 10 : Actionable tip (speed-to-lead)
 *  Step 5 — Day 14 : Case study #2 (different industry)
 *  Step 6 — Day 18 : Testimonial #2 + social proof
 *  Step 7 — Day 23 : Tip + soft offer (Free Automation Audit)
 *  Step 8 — Day 30 : Final CTA — book or lose the spot
 *
 * Auto-stops when lead reaches Booked or Closed.
 * Respects "paused" status — skips those campaigns until resumed.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
// Inline resendFetch with retry logic (replaces shared import)
async function resendFetch(url, options = {}, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue; }
      }
      return res;
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}

// #97 / #495: 24-hour idempotency guard — prevents duplicate nurture sends inside the same daily window
const IDEMPOTENCY_WINDOW_MS = 24 * 3600000;
async function wasRecentlySent(base44, leadId, stepKey) {
  const since = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS).toISOString();
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    { context_id: leadId, context_type: "nurture" }, "-created_date", 10
  ).catch(() => []);
  return (events || []).some(e => {
    try { return JSON.parse(e.metadata_json || "{}").step_key === stepKey && e.created_date > since; }
    catch { return false; }
  });
}

// Inlined from _shared/automationSecurity.js (relative imports not supported in deployed Deno runtime)
function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
function getBearerToken(req) {
  const authorization = req.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return "";
  return token.trim();
}
function allowAnonymousAutomation(req) {
  const configuredSecret = Deno.env.get("AUTOMATION_SHARED_SECRET");
  if (!configuredSecret) return true;
  const candidateSecret = req.headers.get("x-automation-secret") || getBearerToken(req);
  return constantTimeEqual(candidateSecret || "", configuredSecret);
}

const STOP_STATUSES = ["Booked", "Closed"];
const PROOF_READY_VALUES = new Set(["verified", "passed", "production_verified"]);

const STEPS = [
  { num: 1, field: "step1", daysRequired: 0,  theme: "welcome" },
  { num: 2, field: "step2", daysRequired: 3,  theme: "case_study_1" },
  { num: 3, field: "step3", daysRequired: 7,  theme: "testimonial_1" },
  { num: 4, field: "step4", daysRequired: 10, theme: "tip_1" },
  { num: 5, field: "step5", daysRequired: 14, theme: "case_study_2" },
  { num: 6, field: "step6", daysRequired: 18, theme: "testimonial_2" },
  { num: 7, field: "step7", daysRequired: 23, theme: "tip_offer" },
  { num: 8, field: "step8", daysRequired: 30, theme: "final_cta" },
];

const EMAIL_CONTENT = {
  welcome: {
    subject: (name, biz) => `Welcome, ${name} — here's what's coming your way`,
    html: (name, biz) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">Hey ${name} 👋</h2>
  <p>Thanks for your interest in <strong>ClientSurge Systems</strong>. Over the next 30 days, we'll be sharing real results, client stories, and practical tips that show exactly what automated lead follow-up can do for a business like <strong>${biz}</strong>.</p>
  <p>Most service businesses lose 60–80% of their leads simply because they respond too slowly or forget to follow up. We fix that — automatically.</p>
  <p><strong>Here's what's coming:</strong></p>
  <ul style="line-height:1.8">
    <li>📈 Real case studies from businesses like yours</li>
    <li>💬 Client testimonials and before/after numbers</li>
    <li>🛠️ Actionable tips you can use today</li>
    <li>🎯 A look at what a system built for ${biz} could look like</li>
  </ul>
  <p>Hit reply anytime — I read every response.</p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
</div>`,
  },
  case_study_1: {
    subject: (name) => `${name}, how a med spa went from 14% to 61% lead conversion`,
    html: (name, biz) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">A real result, ${name}</h2>
  <p>A med spa in Scottsdale was generating solid leads from Instagram ads — but converting less than 15% of them into consultations.</p>
  <p><strong>The problem?</strong> Leads were sitting uncontacted for 4–6 hours. By the time staff followed up, interest had cooled.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
  <p><strong>What we built:</strong></p>
  <ul style="line-height:1.8">
    <li>Instant SMS response within 60 seconds of form submission</li>
    <li>Automated follow-up at Day 1, Day 3, and Day 7</li>
    <li>Booking link sent automatically to qualified leads</li>
  </ul>
  <p><strong>Results after 30 days:</strong> Consultation bookings up from 14% → 61%. Zero extra staff hours.</p>
  <p>Could something like this work for <strong>${biz}</strong>? Reply and let me know what your current follow-up looks like.</p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
</div>`,
  },
  testimonial_1: {
    subject: (name) => `"I didn't realize how many leads I was losing" — ${name}, read this`,
    html: (name, biz) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">A client said it best, ${name}</h2>
  <blockquote style="border-left:4px solid #9a5c2e;padding-left:16px;margin:20px 0;font-style:italic;color:#555">
    "Before ClientSurge, I had no idea how many leads were slipping through. I thought my front desk was handling it. Turns out leads were waiting 8+ hours for a callback. Now the system texts them instantly — and my booking rate has almost doubled."
    <br><br>
    <strong>— Owner, Aesthetic Wellness Clinic, Phoenix AZ</strong>
  </blockquote>
  <p>This isn't unusual. Most service businesses assume their team is catching every lead. The data usually tells a different story.</p>
  <p>We audit this for free on a demo call. Want to see where <strong>${biz}</strong> stands?</p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
</div>`,
  },
  tip_1: {
    subject: (name) => `The 5-minute rule that recovers 30% more leads — for ${name}`,
    html: (name, biz) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">Quick tip, ${name}</h2>
  <p><strong>The 5-Minute Rule:</strong> Studies consistently show that responding to a new lead within 5 minutes makes you 100x more likely to reach them than responding after 30 minutes.</p>
  <p>After 30 minutes, most leads have already moved on — contacted a competitor, lost interest, or simply gotten distracted.</p>
  <p><strong>What most businesses do:</strong> Respond when staff are available (usually 1–6 hours later).</p>
  <p><strong>What our clients do:</strong> Automate the first response so it goes out in under 60 seconds, every time, 24/7.</p>
  <p>You don't need to hire more people to hit the 5-minute mark. You just need the right system.</p>
  <p>Is <strong>${biz}</strong> hitting this benchmark today? Hit reply — I'm curious.</p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
</div>`,
  },
  case_study_2: {
    subject: (name) => `${name} — how a home service company recovered $12k in lost leads`,
    html: (name, biz) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">Another result worth sharing, ${name}</h2>
  <p>A residential HVAC company in Texas was running Google Ads and getting 40–60 leads per month. Their close rate was about 22%.</p>
  <p>After auditing their process, we found that 35% of leads never received a response at all — calls went to voicemail, forms sat unread on weekends.</p>
  <p><strong>We built:</strong></p>
  <ul style="line-height:1.8">
    <li>Missed call text-back (fires within 30 seconds of a missed call)</li>
    <li>Weekend and after-hours auto-response via SMS</li>
    <li>A 7-day follow-up sequence for unbooked leads</li>
  </ul>
  <p><strong>Month 1 result:</strong> Close rate jumped from 22% → 38%. That translated to roughly $12,000 in additional revenue from leads they were already paying for.</p>
  <p>Most businesses don't need more leads. They need to convert the ones they already have.</p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
</div>`,
  },
  testimonial_2: {
    subject: (name) => `${name}, this is what "set it and forget it" actually looks like`,
    html: (name, biz) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">Another client story, ${name}</h2>
  <blockquote style="border-left:4px solid #9a5c2e;padding-left:16px;margin:20px 0;font-style:italic;color:#555">
    "I was skeptical at first — I've tried other automation tools and they always required a ton of setup and babysitting. ClientSurge was different. They built everything, tested it, and handed it to me running. I check my dashboard once a week. That's it."
    <br><br>
    <strong>— Owner, Real Estate Investment Firm, Scottsdale AZ</strong>
  </blockquote>
  <p>Done-for-you means exactly that. We handle the build, the testing, and the optimization. You just review the results.</p>
  <p>Setup takes 5–7 business days. Most clients recover the cost within the first month.</p>
  <p>Want to see what this looks like for <strong>${biz}</strong>? Book a free 15-minute demo.</p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
</div>`,
  },
  tip_offer: {
    subject: (name) => `${name} — 3 follow-up mistakes that kill conversions (+ a free offer)`,
    html: (name, biz) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">3 mistakes we see constantly, ${name}</h2>
  <p><strong>1. Following up only once.</strong> Most leads convert on the 2nd or 3rd touchpoint. A single "just checking in" message and then silence kills your chances.</p>
  <p><strong>2. Only calling, never texting.</strong> Over 90% of SMS messages are read within 3 minutes. Calls go to voicemail. Meet your leads where they are.</p>
  <p><strong>3. No urgency in the message.</strong> Generic follow-ups ("just wanted to touch base!") perform 3–5x worse than specific, value-driven messages tied to the lead's stated problem.</p>
  <p>All three of these are solved automatically in our system — and we build and configure it for you.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
  <p><strong>Free offer:</strong> Book a 15-minute call this week and we'll do a free lead audit — showing you exactly where <strong>${biz}</strong> is losing conversions today.</p>
  <p>No pitch, no pressure. Just data.</p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
</div>`,
  },
  final_cta: {
    subject: (name) => `${name} — last message from us (your call)`,
    html: (name, biz) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">This is our last scheduled email, ${name}</h2>
  <p>Over the past 30 days, we've shared case studies, client results, and tips — all showing the same thing: businesses that automate their lead follow-up convert significantly more of the leads they're already generating.</p>
  <p>We don't know what's holding you back, but here's what we do know:</p>
  <ul style="line-height:1.8">
    <li>Every day without automation is another batch of leads going cold</li>
    <li>Setup takes less than a week</li>
    <li>Most clients see positive ROI in the first 30 days</li>
    <li>There's no long-term contract — month-to-month only</li>
  </ul>
  <p>If you're ready to see what this looks like for <strong>${biz}</strong>, book a free 15-minute demo. If now isn't the right time, no hard feelings — just reply "not now" and we'll stop reaching out.</p>
  <p>Either way, I hope the content was useful.</p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
  <p style="font-size:11px;color:#999;margin-top:32px">To stop receiving emails, reply "unsubscribe".</p>
</div>`,
  },
};

function daysSince(isoDate) {
  if (!isoDate) return 0;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function getApprovedCampaignSender(settings = {}) {
  return (
    settings.resend_from_email ||
    Deno.env.get("RESEND_FROM_LEADS") ||
    Deno.env.get("RESEND_FROM_EMAIL") ||
    Deno.env.get("SUPPORT_EMAIL") ||
    "support@clientsurgesystems.com"
  );
}

function getCampaignSendGate() {
  const campaignEnabled = String(Deno.env.get("EMAIL_CAMPAIGN_ENABLED") || "").trim().toLowerCase() === "true";
  const proofStatus = String(Deno.env.get("EMAIL_DELIVERABILITY_PROOF_STATUS") || "").trim().toLowerCase();

  if (!campaignEnabled) {
    return {
      ok: false,
      reason: "EMAIL_CAMPAIGN_ENABLED must be true before nurture campaign sends.",
      proof_status: proofStatus || "missing",
    };
  }
  if (!PROOF_READY_VALUES.has(proofStatus)) {
    return {
      ok: false,
      reason: "EMAIL_DELIVERABILITY_PROOF_STATUS must be verified before nurture campaign sends.",
      proof_status: proofStatus || "missing",
    };
  }
  return { ok: true, proof_status: proofStatus };
}

// PL-67: Business hours gate — only send nurture emails 8am–7pm recipient local (Phoenix as default)
function isWithinBusinessHours() {
  const now = new Date();
  const hour = parseInt(now.toLocaleString("en-US", { timeZone: "America/Phoenix", hour: "numeric", hour12: false }), 10);
  return hour >= 8 && hour < 19;
}

async function sendEmail(to, subject, html, resendKey, fromEmail) {
  // PL-66: include plain-text fallback for email clients that don't render HTML
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const res = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html, text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Resend send failed");
  }
  return true;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    // Allow scheduled OR admin direct call
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }
    if (!user && !allowAnonymousAutomation(req)) {
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }

    const campaigns = await base44.asServiceRole.entities.NurtureCampaign.filter(
      { status: "active" },
      "-enrolled_at",
      5000
    );

    if (!campaigns?.length) {
      return secureJson({ success: true, processed: 0, message: "No active nurture campaigns." });
    }

    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = getApprovedCampaignSender(settings);
    const resendReady = !!(resendKey && settings.resend_enabled);

    if (!resendReady) {
      return secureJson(
        { success: false, error: "Resend not configured. Enable Resend in Admin Settings." },
        { status: 503 }
      );
    }

    const sendGate = getCampaignSendGate();
    if (!sendGate.ok) {
      return secureJson(
        {
          success: false,
          error: "Nurture campaign sending is blocked until deliverability proof is complete.",
          email_sent: false,
          safe_to_continue: false,
          requires_owner_action: true,
          reason: sendGate.reason,
          proof_status: sendGate.proof_status,
        },
        { status: 403 }
      );
    }

    // PL-67: Only send during business hours (8am–7pm Arizona time)
    if (!isWithinBusinessHours()) {
      return secureJson({ success: true, processed: 0, message: "Outside business hours (8am–7pm AZ). Skipping nurture sends." });
    }

    const results = { fired: 0, skipped: 0, stopped: 0, errors: 0 };
    // ── DEPLOYMENT OBSERVABILITY: Cache for per-client deployment lookups ──
    const deploymentCache = {};

    for (const campaign of campaigns) {
      try {
        const lead = await base44.asServiceRole.entities.Leads.get(campaign.lead_id);
        if (!lead) {
          await base44.asServiceRole.entities.NurtureCampaign.update(campaign.id, { status: "stopped", stop_reason: "manual_stop", notes: "Lead not found." });
          results.stopped++;
          continue;
        }

        // ── DEPLOYMENT OBSERVABILITY: Resolve deployment + check permission ──
        if (lead.client_id && !deploymentCache[lead.client_id]) {
          try {
            const deps = await base44.asServiceRole.entities.ClientDeployment.filter(
              { client_id: lead.client_id, deployment_status: { $in: ['live', 'onboarding', 'configuring', 'ready'] } },
              '-created_date', 1
            );
            const dep = deps?.[0] || null;
            if (dep) {
              const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
                deployment_id: dep.id, module_key: 'lead_nurture'
              });
              deploymentCache[lead.client_id] = {
                deployment_id: dep.id, authorized: permRes.data?.authorized === true, reason: permRes.data?.reason,
              };
            } else { deploymentCache[lead.client_id] = null; }
          } catch (e) { deploymentCache[lead.client_id] = null; }
        }
        const _depCtx = lead.client_id ? deploymentCache[lead.client_id] : null;
        if (_depCtx && !_depCtx.authorized) {
          await base44.asServiceRole.functions.invoke('logAutomationExecution', {
            client_deployment_id: _depCtx.deployment_id, client_id: lead.client_id,
            module_key: 'lead_nurture', trigger_event: 'scheduled_nurture',
            execution_status: 'blocked',
            error_message: `Module not authorized (reason: ${_depCtx.reason || 'unknown'})`,
            error_code: _depCtx.reason || 'module_not_authorized', lead_id: lead.id,
          }).catch(() => {});
          results.skipped++; continue;
        }

        // Auto-stop if lead converted
        if (STOP_STATUSES.includes(lead.status)) {
          const stopReason = lead.status === "Booked" ? "booked" : "closed";
          await base44.asServiceRole.entities.NurtureCampaign.update(campaign.id, { status: "stopped", stop_reason: stopReason });
          results.stopped++;
          continue;
        }

        // #95: TCPA — skip if lead has opted out via SMS STOP keyword
        if (lead.automation_enabled === false || lead.cadence_paused === true) {
          await base44.asServiceRole.entities.NurtureCampaign.update(campaign.id, {
            status: "stopped",
            stop_reason: "opted_out",
            notes: "Lead opted out via SMS STOP or cadence manually paused."
          });
          results.stopped++;
          continue;
        }

        const daysSinceEnroll = daysSince(campaign.enrolled_at);
        let updates = { last_step_run_at: new Date().toISOString() };
        let allDone = true;

        for (const step of STEPS) {
          const statusKey = `${step.field}_status`;
          const sentAtKey = `${step.field}_sent_at`;
          const currentStatus = campaign[statusKey];

          if (currentStatus === "sent" || currentStatus === "skipped") continue;
          if (daysSinceEnroll < step.daysRequired) { allDone = false; continue; }

          allDone = false;

          const name = lead.full_name || "there";
          const biz = lead.business_name || "your business";
          const bookingLink = settings.booking_link_default || "";

          // Use admin-editable templates if set, otherwise fall back to hardcoded defaults
          const adminSubject = settings[`nurture_step${step.num}_subject`];
          const adminBody    = settings[`nurture_step${step.num}_body`];

          const content = EMAIL_CONTENT[step.theme];
          const subject = adminSubject
            ? adminSubject.replace(/{name}/g, name).replace(/{business_name}/g, biz)
            : content.subject(name, biz);
          const html = adminBody
            ? `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;white-space:pre-wrap">${
                adminBody
                  .replace(/{name}/g, name)
                  .replace(/{business_name}/g, biz)
                  .replace(/{booking_link}/g, bookingLink)
              }</div>`
            : content.html(name, biz);

          let sent = false;
          let error = null;

          try {
            await sendEmail(lead.email || campaign.lead_email, subject, html, resendKey, fromEmail);
            sent = true;
            // ── DEPLOYMENT OBSERVABILITY: Log successful execution ──
            if (_depCtx) {
              await base44.asServiceRole.functions.invoke('logAutomationExecution', {
                client_deployment_id: _depCtx.deployment_id, client_id: lead.client_id,
                module_key: 'lead_nurture', trigger_event: 'scheduled_nurture',
                execution_status: 'completed', lead_id: lead.id,
              }).catch(() => {});
            }
          } catch (err) {
            error = err.message;
            console.error(`[processNurtureCampaigns] processNurtureCampaigns [step${step.num}] error for ${campaign.lead_id}:`, err.message);
            // ── DEPLOYMENT OBSERVABILITY: Log failed execution ──
            if (_depCtx) {
              await base44.asServiceRole.functions.invoke('logAutomationExecution', {
                client_deployment_id: _depCtx.deployment_id, client_id: lead.client_id,
                module_key: 'lead_nurture', trigger_event: 'scheduled_nurture',
                execution_status: 'failed', error_message: err.message,
                error_code: 'resend_send_failed', lead_id: lead.id,
              }).catch(() => {});
            }
          }

          updates[statusKey] = sent ? "sent" : "failed";
          if (sent) {
            updates[sentAtKey] = new Date().toISOString();
          }
          updates.current_step = step.num;

          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: campaign.lead_id,
            channel: "email",
            direction: "outbound",
            event_type: "email_sent",
            provider: "resend",
            status: sent ? "sent" : "failed",
            subject: `Nurture Step ${step.num} — ${subject}`,
            message_body: `Nurture email (Day ${step.daysRequired}, theme: ${step.theme})`,
            error_message: error || undefined,
            metadata_json: JSON.stringify({ nurture_step: step.num, campaign_id: campaign.id, theme: step.theme }),
          });

          sent ? results.fired++ : results.errors++;

          // Only send one step per run to avoid flooding
          break;
        }

        // Check if all 8 steps done
        const allSent = STEPS.every((s) => {
          const v = updates[`${s.field}_status`] ?? campaign[`${s.field}_status`];
          return v === "sent" || v === "skipped";
        });

        if (allSent) {
          updates.status = "completed";
          updates.stop_reason = "completed_all_steps";
        }

        await base44.asServiceRole.entities.NurtureCampaign.update(campaign.id, updates);

      } catch (err) {
        console.error(`[processNurtureCampaigns] processNurtureCampaigns error for campaign ${campaign.id}:`, err.message);
        results.errors++;
      }
    }

    return secureJson({ success: true, campaigns_checked: campaigns.length, ...results });

  } catch (error) {
    console.error("[processNurtureCampaigns] processNurtureCampaigns error:", error);
    return secureJson({ error: error.message || "Failed to process nurture campaigns" }, { status: 500 });
  }
});