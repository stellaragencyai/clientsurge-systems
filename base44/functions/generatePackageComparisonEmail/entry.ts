/**
 * generatePackageComparisonEmail — #475
 * Finds Starter/Growth clients live for ~60 days.
 * Sends them an email showing what they're missing at the next tier.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

const TIER_BENEFITS = {
  starter: {
    current: ["Instant Lead Response", "Missed Call Text-Back"],
    upgrade_to: "Growth",
    missing: ["Follow-Up Sequences (Day 1, 3, 7)", "AI Appointment Booking"],
    upgrade_cost: 500, // $997/mo - $497/mo
    cta: "See What's Included",
  },
  growth: {
    current: ["Instant Lead Response", "Missed Call Text-Back", "Follow-Up Sequences", "AI Appointment Booking"],
    upgrade_to: "Elite",
    missing: ["Review Request AI", "Reactivation Campaign"],
    upgrade_cost: 1000, // $1997/mo - $997/mo
    cta: "Unlock Full Suite",
  },
};

function buildComparisonEmail(client_name, current_tier, benefits) {
  const upcomingTier = benefits.upgrade_to;
  return `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;background:#fff;">
    <h2 style="color:#0A0F1E;font-size:20px;font-weight:800;margin:0 0 6px">You're getting great results — ready for more?</h2>
    <p style="color:#6B7280;font-size:13px;margin:0 0 20px">Hi ${client_name},</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px">Your ${current_tier} system has been working hard for 60 days. You're capturing leads and following up automatically — awesome.</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px">A lot of our successful Starter clients scale to Growth within the first 3 months because they want more automation. Here's what you'd unlock:</p>
    <div style="background:#F3F4F6;border-radius:12px;padding:20px;margin-bottom:20px">
      <p style="color:#1F2937;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Current (${current_tier})</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:13px;line-height:1.8">
        ${benefits.current.map(b => `<li>${b}</li>`).join("")}
      </ul>
      <p style="color:#1F2937;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Add with ${upcomingTier}</p>
      <ul style="margin:0;padding-left:20px;color:#10B981;font-size:13px;line-height:1.8;font-weight:600">
        ${benefits.missing.map(b => `<li>+ ${b}</li>`).join("")}
      </ul>
    </div>
    <p style="color:#374151;font-size:13px;margin:0 0 20px;line-height:1.6"><b>The bottom line:</b> Growth automates your entire follow-up pipeline. Leads go from inquiry → phone call → scheduled appointment — no manual work.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://clientsurgesystems.com/upgrade" style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#00FFB3);color:#0A0F1E;border-radius:9999px;padding:12px 28px;font-size:14px;font-weight:800;text-decoration:none">
        ${benefits.cta} →
      </a>
    </div>
    <p style="color:#6B7280;font-size:12px;margin-top:20px">You can reply to this or reach out to Nolan anytime — we're here to help you scale.</p>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    // Find Starter/Growth clients live for ~60 days
    const candidates = await base44.asServiceRole.entities.Order.filter({ payment_status: "paid" }).catch(() => []);
    const eligible = (candidates || []).filter((o) => {
      const goLiveDate = o.went_live_at ? new Date(o.went_live_at) : null;
      if (!goLiveDate) return false;
      const daysSinceLive = (now.getTime() - goLiveDate.getTime()) / (24 * 60 * 60 * 1000);
      return daysSinceLive >= 55 && daysSinceLive <= 65 && ["starter", "growth"].includes(o.package_key);
    });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    let sent = 0;

    for (const order of eligible) {
      const benefits = TIER_BENEFITS[order.package_key];
      if (!benefits || !order.client_email) continue;

      const html = buildComparisonEmail(order.client_name || "there", order.package_key, benefits);

      if (resendKey) {
        await resendFetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: \`Bearer \${resendKey}\`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "system@clientsurgesystems.com",
            reply_to: "nolan@clientsurgesystems.com",
            to: order.client_email,
            subject: \`See what you're missing — Scale to \${benefits.upgrade_to} 🚀\`,
            html,
          }),
        }).catch(() => {});
        sent++;
      }
    }

    // Log run
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "generatePackageComparisonEmail",
      log_type: "info",
      summary: \`Day-60 upgrade emails sent to \${sent} clients\`,
      details: JSON.stringify({ eligible: eligible.length, sent }),
      service: "email_marketing",
      requires_nolan: false,
      resolved: true,
    }).catch(() => {});

    console.log(\`[Day60Upgrade] Sent \${sent} upgrade emails\`);
    return Response.json({ success: true, eligible: eligible.length, sent });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
