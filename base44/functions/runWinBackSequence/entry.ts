/**
 * runWinBackSequence — daily runner that detects clients whose subscription
 * has been canceled or past_due for 30+ days and sends a 3-step win-back
 * email sequence with a special incentive + diagnostic call offer.
 *
 * Step 1 (Day 30+):  "We miss you" — special offer (1 month free or 50% off)
 * Step 2 (Day 37+):  "Free diagnostic call" — Calendly CTA
 * Step 3 (Day 44+):  Final outreach — last chance offer
 *
 * Guard: won't re-send a step already sent (tracked in OnboardingClient.notes).
 * Guard: skips clients with no email.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const THIRTY_DAYS_MS  = 30 * 24 * 60 * 60 * 1000;
const THIRTY_SEVEN_MS = 37 * 24 * 60 * 60 * 1000;
const FORTY_FOUR_MS   = 44 * 24 * 60 * 60 * 1000;

const CALENDLY = Deno.env.get("WINBACK_CALENDLY_URL") || "https://calendly.com/nolan-clientsurgesystems";
const PORTAL   = Deno.env.get("WINBACK_PORTAL_URL") || "https://clientsurgesystems.com/client-portal";
const ORDER_LIMIT = 5000;
const CLIENT_LIMIT = 5000;

function daysSince(isoDate) {
  if (!isoDate) return 0;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function hasWinBackTag(notes, tag) {
  return (notes || "").includes(`[WinBack:${tag}]`);
}

function appendNote(notes, tag) {
  const ts = new Date().toISOString().split("T")[0];
  return (notes ? notes + "\n" : "") + `[WinBack:${tag}] Sent ${ts}`;
}

// ── Email builders ──────────────────────────────────────────────────────────

function buildStep1Email(client) {
  const name = client.owner_name || "there";
  const biz  = client.business_name;
  return {
    subject: `${biz} — we'd love to have you back (special offer inside)`,
    body: `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">

  <div style="border-bottom:3px solid #9a5c2e;padding-bottom:18px;margin-bottom:26px;">
    <p style="font-size:13px;font-weight:700;color:#9a5c2e;text-transform:uppercase;letter-spacing:1px;margin:0;">ClientSurge Systems</p>
  </div>

  <p style="font-size:16px;margin-bottom:6px;">Hey ${name},</p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    We noticed your subscription for <strong>${biz}</strong> is no longer active — and honestly, we miss working with you.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    A lot can change in a month. If the timing wasn't right before, we'd love to make it easier to come back.
  </p>

  <div style="background:#f9f4ef;border-left:4px solid #9a5c2e;border-radius:6px;padding:20px 24px;margin:24px 0;">
    <p style="font-size:13px;font-weight:700;color:#9a5c2e;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px 0;">🎁 Re-Activation Offer — For You Only</p>
    <p style="font-size:15px;font-weight:600;color:#2d2d2d;margin:0 0 8px 0;">Get your first month back at 50% off</p>
    <p style="font-size:14px;color:#555;margin:0;">
      Re-activate your plan this week and pay half price for month one. No commitments, no setup fees — your system picks up right where it left off.
    </p>
  </div>

  <div style="text-align:center;margin:30px 0;">
    <a href="${PORTAL}"
       style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#f5e6d0;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:9999px;">
      Reactivate My System →
    </a>
  </div>

  <p style="font-size:14px;color:#888;line-height:1.7;">
    If you have questions or want to hop on a quick call first, just reply to this email. I'm happy to walk you through what's changed and what we'd set up for you.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;margin-top:24px;">
    Talk soon,<br/>
    <strong>Nolan</strong><br/>
    <span style="color:#9a5c2e;font-size:13px;">ClientSurge Systems</span>
  </p>

  <div style="border-top:1px solid #e8ddd0;margin-top:28px;padding-top:14px;">
    <p style="font-size:12px;color:#aaa;margin:0;">Questions? Reply directly to this email.</p>
  </div>

</div>`,
  };
}

function buildStep2Email(client) {
  const name = client.owner_name || "there";
  const biz  = client.business_name;
  return {
    subject: `${name} — free 20-min diagnostic call for ${biz}`,
    body: `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">

  <div style="border-bottom:3px solid #9a5c2e;padding-bottom:18px;margin-bottom:26px;">
    <p style="font-size:13px;font-weight:700;color:#9a5c2e;text-transform:uppercase;letter-spacing:1px;margin:0;">ClientSurge Systems</p>
  </div>

  <p style="font-size:16px;margin-bottom:6px;">Hey ${name},</p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    I wanted to reach out one more time. Whether your subscription lapsed due to timing, budget, or results — I'd love 20 minutes to understand what happened and see if we can fix it.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    <strong>Here's what we'd cover on the call:</strong>
  </p>

  <ul style="font-size:15px;color:#444;line-height:1.9;margin:0 0 24px;padding-left:20px;">
    <li>What was working — and what wasn't</li>
    <li>Any changes to your business since we last worked together</li>
    <li>Whether a re-build or system tweak makes sense for <strong>${biz}</strong></li>
    <li>No pressure — it's a real conversation, not a sales pitch</li>
  </ul>

  <div style="text-align:center;margin:30px 0;">
    <a href="${CALENDLY}"
       style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#f5e6d0;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:9999px;">
      📞 Book Your Free Diagnostic Call
    </a>
  </div>

  <p style="font-size:14px;color:#888;line-height:1.7;">
    If now isn't a good time, just reply and let me know — I'll follow up when it works for you.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;margin-top:24px;">
    — <strong>Nolan</strong><br/>
    <span style="color:#9a5c2e;font-size:13px;">ClientSurge Systems</span>
  </p>

</div>`,
  };
}

function buildStep3Email(client) {
  const name = client.owner_name || "there";
  const biz  = client.business_name;
  return {
    subject: `Last note from me, ${name} — ${biz}`,
    body: `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">

  <div style="border-bottom:3px solid #9a5c2e;padding-bottom:18px;margin-bottom:26px;">
    <p style="font-size:13px;font-weight:700;color:#9a5c2e;text-transform:uppercase;letter-spacing:1px;margin:0;">ClientSurge Systems</p>
  </div>

  <p style="font-size:16px;margin-bottom:6px;">Hey ${name},</p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    This is my last note — I don't want to fill your inbox.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;">
    If you ever want to re-activate your system for <strong>${biz}</strong>, the door is always open. I'll make sure setup is fast, the price is fair, and the experience is better than before.
  </p>

  <div style="background:#f9f4ef;border-left:4px solid #9a5c2e;border-radius:6px;padding:18px 22px;margin:24px 0;">
    <p style="font-size:14px;color:#555;margin:0;">
      <strong>Standing offer:</strong> If you come back within the next 14 days, I'll personally handle your re-onboarding call, waive any setup fees, and give you month one at 50% off.
    </p>
  </div>

  <div style="text-align:center;margin:28px 0;">
    <a href="${PORTAL}"
       style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#f5e6d0;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:9999px;">
      Reactivate → clientsurgesystems.com
    </a>
  </div>

  <p style="font-size:14px;color:#888;line-height:1.7;">
    No hard feelings if now isn't the time. Wishing you and <strong>${biz}</strong> all the best.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#444;margin-top:24px;">
    — <strong>Nolan</strong><br/>
    <span style="color:#9a5c2e;font-size:13px;">Founder, ClientSurge Systems</span>
  </p>

  <div style="border-top:1px solid #e8ddd0;margin-top:28px;padding-top:14px;">
    <p style="font-size:12px;color:#aaa;margin:0;">To opt out of future emails, reply "stop".</p>
  </div>

</div>`,
  };
}

// ── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    // Allow scheduled (no user) OR admin direct call
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    // Load all orders with failed/canceled payment or subscription status
    const allOrders = await base44.asServiceRole.entities.Order.list("-created_date", ORDER_LIMIT);

    // Also load OnboardingClient records for email + name lookup
    const allClients = await base44.asServiceRole.entities.OnboardingClient.list("-created_date", CLIENT_LIMIT);
    const clientsByEmail = {};
    for (const c of allClients) {
      if (c.email) clientsByEmail[c.email.toLowerCase()] = c;
    }

    // Filter: orders where payment_status=failed OR subscription_status=canceled/past_due
    // and the status has been that way for 30+ days (use updated_date as proxy)
    const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

    const winBackCandidates = allOrders.filter(order => {
      const isFailedPayment = order.payment_status === "failed";
      const isCanceledSub   = ["canceled", "past_due", "unpaid"].includes(order.subscription_status);
      if (!isFailedPayment && !isCanceledSub) return false;
      // Must have been in this state for 30+ days (updated_date older than 30 days ago)
      const updatedAt = new Date(order.updated_date || order.created_date);
      return updatedAt < thirtyDaysAgo;
    });

    if (winBackCandidates.length === 0) {
      return Response.json({ success: true, processed: 0, message: "No win-back candidates found." });
    }

    const results = { step1_sent: 0, step2_sent: 0, step3_sent: 0, skipped: 0, errors: 0 };

    for (const order of winBackCandidates) {
      if (!order.customer_email) { results.skipped++; continue; }

      const email = order.customer_email.toLowerCase();
      const client = clientsByEmail[email];
      const notes  = client?.notes || order.notes || "";

      // Build a minimal client-like object for email templates
      const clientData = {
        owner_name:    client?.owner_name || order.customer_name || "",
        business_name: client?.business_name || order.business_name || "",
        email:         order.customer_email,
        notes,
      };

      const updatedAt = new Date(order.updated_date || order.created_date);
      const msElapsed = Date.now() - updatedAt.getTime();

      let stepSent = null;
      let updatedNotes = notes;

      try {
        // Step 3 — Day 44+
        if (msElapsed >= FORTY_FOUR_MS && !hasWinBackTag(notes, "step3")) {
          const { subject, body } = buildStep3Email(clientData);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: clientData.email,
            from_name: "Nolan @ ClientSurge Systems",
            subject,
            body,
          });
          updatedNotes = appendNote(updatedNotes, "step3");
          stepSent = "step3";
          results.step3_sent++;

        // Step 2 — Day 37+
        } else if (msElapsed >= THIRTY_SEVEN_MS && !hasWinBackTag(notes, "step2")) {
          const { subject, body } = buildStep2Email(clientData);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: clientData.email,
            from_name: "Nolan @ ClientSurge Systems",
            subject,
            body,
          });
          updatedNotes = appendNote(updatedNotes, "step2");
          stepSent = "step2";
          results.step2_sent++;

        // Step 1 — Day 30+
        } else if (msElapsed >= THIRTY_DAYS_MS && !hasWinBackTag(notes, "step1")) {
          const { subject, body } = buildStep1Email(clientData);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: clientData.email,
            from_name: "Nolan @ ClientSurge Systems",
            subject,
            body,
          });
          updatedNotes = appendNote(updatedNotes, "step1");
          stepSent = "step1";
          results.step1_sent++;

        } else {
          results.skipped++;
        }

        // Persist the updated notes so we don't re-send
        if (stepSent) {
          // Keep both client and order notes aligned so resend protection stays consistent.
          if (client?.id) {
            await base44.asServiceRole.entities.OnboardingClient.update(client.id, { notes: updatedNotes });
          }
          await base44.asServiceRole.entities.Order.update(order.id, { notes: updatedNotes });
          console.log(`Win-back ${stepSent} sent to ${clientData.email} (${clientData.business_name})`);
        }

      } catch (err) {
        console.error(`Win-back error for ${clientData.email}:`, err.message);
        results.errors++;
      }
    }

    return Response.json({
      success: true,
      candidates: winBackCandidates.length,
      ...results,
    });

  } catch (error) {
    console.error("runWinBackSequence error:", error);
    return Response.json({ error: error.message || "Win-back sequence failed" }, { status: 500 });
  }
});
