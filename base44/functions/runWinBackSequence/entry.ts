/**
 * runWinBackSequence
 * Scheduled: Daily at 5pm
 * Purpose: Scan orders with canceled/past_due/failed payment status for 30+ days
 *          and send a 3-step win-back email sequence:
 *   - Day 30: Special offer email
 *   - Day 37: Diagnostic call invite
 *   - Day 44: Final CTA / last chance
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const STEPS = [
  { key: "win_back_day30", daysRequired: 30, label: "Day 30 — Special Offer" },
  { key: "win_back_day37", daysRequired: 37, label: "Day 37 — Diagnostic Call" },
  { key: "win_back_day44", daysRequired: 44, label: "Day 44 — Final CTA" },
];

const CHURNED_STATUSES = ["canceled", "past_due", "failed"];

function daysSince(isoDate) {
  if (!isoDate) return 0;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function buildEmailContent(stepKey, customerName, businessName, bookingLink) {
  const name = customerName || "there";
  const biz = businessName || "your business";
  const link = bookingLink || "https://clientsurgesystems.com/book";

  if (stepKey === "win_back_day30") {
    return {
      subject: `${name}, we want to help you get back on track`,
      html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">We noticed your account is on pause, ${name}</h2>
  <p>We understand that things come up — but we'd hate for <strong>${biz}</strong> to miss out on the leads and bookings that come from having an automated follow-up system in place.</p>
  <p><strong>For a limited time, we're offering a special reinstatement deal:</strong></p>
  <ul style="line-height:1.8">
    <li>✅ Waived reactivation fee</li>
    <li>✅ First month at 20% off</li>
    <li>✅ Full system audit included at no charge</li>
  </ul>
  <p>This offer is available for the next 7 days. Just reply to this email or book a quick call and we'll get you set back up immediately.</p>
  <p style="margin-top:20px"><a href="${link}" style="background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Claim Your Offer →</a></p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
</div>`,
    };
  }

  if (stepKey === "win_back_day37") {
    return {
      subject: `${name} — free diagnostic call to review what's working`,
      html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">Let's figure out what's best for ${biz}, ${name}</h2>
  <p>We know automation isn't one-size-fits-all. Sometimes systems need to be adjusted, simplified, or rebuilt based on how your business has changed.</p>
  <p>We'd like to offer you a <strong>free 20-minute diagnostic call</strong> — no sales pitch, just a look at:</p>
  <ul style="line-height:1.8">
    <li>📊 Where your lead flow stands right now</li>
    <li>🔧 What's working and what isn't</li>
    <li>💡 What we'd do differently if we rebuilt your system today</li>
  </ul>
  <p>If there's a fit to work together again, great. If not, you'll still walk away with clarity on your current process.</p>
  <p style="margin-top:20px"><a href="${link}" style="background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Book Free Diagnostic →</a></p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
</div>`,
    };
  }

  // win_back_day44 — final CTA
  return {
    subject: `${name} — last message from us`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#9a5c2e">This is our last outreach, ${name}</h2>
  <p>We've reached out a couple of times and we don't want to be a bother — so this will be our last message about reactivating your account.</p>
  <p>If <strong>${biz}</strong> is in a place where automated lead follow-up makes sense again, we're here. Setup takes less than a week, and most clients recover the cost within the first month.</p>
  <p>If now isn't the right time, no hard feelings. Just reply "not now" and we'll make a note for a later date.</p>
  <p style="margin-top:20px"><a href="${link}" style="background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Reactivate My Account →</a></p>
  <p style="margin-top:24px">— The ClientSurge Team</p>
  <p style="font-size:11px;color:#999;margin-top:32px">Reply "unsubscribe" to stop receiving emails.</p>
</div>`,
  };
}

async function checkAlreadySent(base44, orderId, stepKey) {
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    {
      context_id: orderId,
      context_type: "win_back",
      metadata_json: { $regex: `"step_key":"${stepKey}"` },
      event_type: "email_sent",
    },
    "-created_date",
    1
  ).catch(() => []);
  return events?.length > 0;
}

async function sendEmail(toEmail, subject, html, resendKey, fromEmail) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromEmail, to: toEmail, subject, html }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Resend error ${res.status}`);
  }
  const data = await res.json();
  return data.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automation (no user) or admin
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return Response.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
    }

    // Load settings
    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};
    const fromEmail = settings.resend_from_email || Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurgesystems.com";
    const bookingLink = settings.booking_link_default || "https://clientsurgesystems.com/book";

    // Find orders with churned payment status
    const orders = await base44.asServiceRole.entities.Order.filter(
      { subscription_status: { $in: CHURNED_STATUSES } },
      "-updated_date",
      1000
    ).catch(() => []);

    if (!orders?.length) {
      return Response.json({ success: true, processed: 0, message: "No churned orders found." });
    }

    const results = { processed: 0, sent: 0, skipped: 0, failed: 0 };

    for (const order of orders) {
      try {
        // Use updated_date as the churn anchor (when status last changed)
        const daysChurned = daysSince(order.updated_date);
        if (daysChurned < 30) { results.skipped++; continue; }

        const toEmail = order.customer_email;
        if (!toEmail) { results.skipped++; continue; }

        // Process each step in sequence — only send the first unsent due step per run
        for (const step of STEPS) {
          if (daysChurned < step.daysRequired) continue;

          const alreadySent = await checkAlreadySent(base44, order.id, step.key);
          if (alreadySent) continue;

          const { subject, html } = buildEmailContent(
            step.key,
            order.customer_name,
            order.business_name,
            bookingLink
          );

          let emailId = null;
          let success = false;
          let errorMsg = null;

          try {
            emailId = await sendEmail(toEmail, subject, html, resendKey, fromEmail);
            success = true;
          } catch (err) {
            errorMsg = err.message;
            console.error(`[runWinBackSequence] Email failed for order ${order.id} (${step.key}): ${err.message}`);
          }

          await base44.asServiceRole.entities.CommunicationEvent.create({
            context_id: order.id,
            context_type: "win_back",
            channel: "email",
            direction: "outbound",
            event_type: "email_sent",
            provider: "resend",
            status: success ? "sent" : "failed",
            subject: `Win-back: ${step.label}`,
            message_body: subject,
            provider_message_id: emailId || undefined,
            error_message: errorMsg || undefined,
            metadata_json: JSON.stringify({
              step_key: step.key,
              days_churned: Math.floor(daysChurned),
              order_id: order.id,
              timestamp: new Date().toISOString(),
            }),
          });

          success ? results.sent++ : results.failed++;

          // Only send one step per order per run
          break;
        }

        results.processed++;
      } catch (err) {
        console.error(`[runWinBackSequence] Order ${order.id} error: ${err.message}`);
        results.failed++;
      }
    }

    console.log(`[runWinBackSequence] Done:`, results);
    return Response.json({ success: true, ...results });

  } catch (error) {
    console.error("[runWinBackSequence] Fatal error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});