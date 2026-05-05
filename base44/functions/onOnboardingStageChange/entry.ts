import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "nolan@clientsurgesystems.com";
const APP_URL = Deno.env.get("APP_URL") || "https://clientsurgesystems.com";

async function sendEmail({ to, subject, html, fromName = "ClientSurge Systems" }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[StageChange] Resend error for ${to}:`, err);
  }
  return res.ok;
}

// Stage → email config map
const STAGE_EMAILS = {
  step_onboarding: {
    subject: "✅ Your onboarding form is complete — here's what's next",
    clientBody: (project) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">
        <p style="font-size:16px;">Hi ${project.client_name || "there"},</p>
        <p style="font-size:15px;line-height:1.7;">
          Your onboarding form for <strong>${project.business_name}</strong> has been received and confirmed. 🎉
          Our team is now reviewing your details and beginning setup.
        </p>
        <p style="font-size:15px;line-height:1.7;">
          <strong>What's next:</strong> We'll confirm your payment and begin installing your systems within 1 business day.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${APP_URL}/client-dashboard" style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#f5e6d0;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:9999px;">
            View Your Dashboard →
          </a>
        </div>
        <p style="font-size:13px;color:#888;">— ClientSurge Systems</p>
      </div>
    `,
  },
  step_payment: {
    subject: "💳 Payment confirmed — your system is being installed",
    clientBody: (project) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">
        <p style="font-size:16px;">Hi ${project.client_name || "there"},</p>
        <p style="font-size:15px;line-height:1.7;">
          Your payment has been confirmed for <strong>${project.business_name}</strong>. Your automation systems are now being installed.
        </p>
        <p style="font-size:15px;line-height:1.7;">
          You'll receive updates as each component goes live. This typically takes 1–3 business days.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${APP_URL}/client-dashboard" style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#f5e6d0;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:9999px;">
            Track Your Install →
          </a>
        </div>
        <p style="font-size:13px;color:#888;">— ClientSurge Systems</p>
      </div>
    `,
  },
  step_sms: {
    subject: "📱 Your SMS system is live — here's how to test it",
    clientBody: (project) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">
        <p style="font-size:16px;">Hi ${project.client_name || "there"},</p>
        <p style="font-size:15px;line-height:1.7;">
          Great news — your <strong>SMS automation</strong> for ${project.business_name} is now live and active!
        </p>
        <div style="background:#f9f4ef;border-left:4px solid #9a5c2e;border-radius:6px;padding:16px 20px;margin:20px 0;">
          <p style="font-size:14px;font-weight:700;color:#9a5c2e;margin:0 0 8px;">What this means:</p>
          <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.8;">
            <li>New leads receive an instant SMS response within 60 seconds</li>
            <li>Missed calls trigger an automatic text-back</li>
            <li>Follow-up sequences run automatically</li>
          </ul>
        </div>
        <p style="font-size:15px;line-height:1.7;">
          You can test it by submitting a lead through your form. We recommend testing today!
        </p>
        <p style="font-size:13px;color:#888;">— ClientSurge Systems</p>
      </div>
    `,
  },
  step_email: {
    subject: "📧 Your email automation is connected and running",
    clientBody: (project) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">
        <p style="font-size:16px;">Hi ${project.client_name || "there"},</p>
        <p style="font-size:15px;line-height:1.7;">
          Your <strong>email automation</strong> for ${project.business_name} is now connected and active.
        </p>
        <p style="font-size:15px;line-height:1.7;">
          New leads will now receive branded email confirmations and follow-up sequences automatically — no manual work needed.
        </p>
        <p style="font-size:13px;color:#888;">— ClientSurge Systems</p>
      </div>
    `,
  },
  step_booking: {
    subject: "📅 Your booking flow is live — leads can now schedule with you",
    clientBody: (project) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">
        <p style="font-size:16px;">Hi ${project.client_name || "there"},</p>
        <p style="font-size:15px;line-height:1.7;">
          Your <strong>AI booking system</strong> for ${project.business_name} is live! Leads can now be automatically guided to book appointments with you.
        </p>
        <p style="font-size:15px;line-height:1.7;">
          The system will intelligently route qualified leads to your booking link at the right moment in the conversation.
        </p>
        <p style="font-size:13px;color:#888;">— ClientSurge Systems</p>
      </div>
    `,
  },
  step_followup: {
    subject: "🔄 Your follow-up sequences are active",
    clientBody: (project) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">
        <p style="font-size:16px;">Hi ${project.client_name || "there"},</p>
        <p style="font-size:15px;line-height:1.7;">
          Your <strong>automated follow-up sequences</strong> for ${project.business_name} are now running.
        </p>
        <p style="font-size:15px;line-height:1.7;">
          Every lead that doesn't respond will automatically receive timed follow-up messages — so no lead slips through the cracks.
        </p>
        <p style="font-size:13px;color:#888;">— ClientSurge Systems</p>
      </div>
    `,
  },
  step_live: {
    subject: "🚀 You're LIVE! Your full system is up and running",
    clientBody: (project) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">
        <div style="background:linear-gradient(135deg,#6b3f1f,#9a5c2e);border-radius:12px;padding:28px;color:#fff;margin-bottom:28px;text-align:center;">
          <h1 style="font-size:28px;margin:0 0 8px;">🚀 You're LIVE!</h1>
          <p style="font-size:16px;margin:0;opacity:0.9;">Your full automation system is up and running for ${project.business_name}</p>
        </div>
        <p style="font-size:16px;">Hi ${project.client_name || "there"},</p>
        <p style="font-size:15px;line-height:1.7;">
          Your complete AI automation system is officially <strong>live and working</strong>. Here's what's running 24/7 for you:
        </p>
        <div style="background:#f9f4ef;border-left:4px solid #9a5c2e;border-radius:6px;padding:16px 20px;margin:20px 0;">
          <ul style="margin:0;padding-left:18px;font-size:14px;line-height:2;">
            <li>✅ Instant SMS response to every new lead (under 60 seconds)</li>
            <li>✅ Missed call text-back running automatically</li>
            <li>✅ Multi-day follow-up sequences active</li>
            <li>✅ AI booking agent routing qualified leads to your calendar</li>
            <li>✅ Email automation connected</li>
          </ul>
        </div>
        <p style="font-size:15px;line-height:1.7;">
          In 30 days, we'll do a performance check-in to review your results and optimize from there.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${APP_URL}/client-dashboard" style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#f5e6d0;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:9999px;">
            View Your Live Dashboard →
          </a>
        </div>
        <p style="font-size:15px;line-height:1.7;">
          Thank you for trusting us to build this for you. Excited to see the results roll in! 🎉<br/><br/>
          — <strong>Nolan</strong><br/>
          <span style="color:#9a5c2e;">ClientSurge Systems</span>
        </p>
      </div>
    `,
    adminSubject: (project) => `🚀 CLIENT LIVE: ${project.business_name}`,
    adminBody: (project) => `
      <p>Hi Nolan,</p>
      <p><strong>${project.business_name}</strong> just went fully live!</p>
      <table style="border-collapse:collapse;font-size:14px;margin:16px 0;">
        <tr><td style="padding:4px 16px 4px 0;color:#888;">Client</td><td>${project.client_name}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#888;">Email</td><td>${project.client_email}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#888;">Plan</td><td>${project.plan}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#888;">Business</td><td>${project.business_name}</td></tr>
      </table>
      <p><strong>Actions:</strong></p>
      <ul style="font-size:14px;line-height:1.8;">
        <li>30-day check-in email will fire in 30 days</li>
        <li>Monitor their lead flow in the admin panel</li>
        <li>Set a personal reminder to check in at day 7</li>
      </ul>
      <p><a href="${APP_URL}/admin/onboarding">View in Admin →</a></p>
      <p>— ClientSurge Automation</p>
    `,
  },
};

// Stage fields to watch
const WATCHED_STAGES = [
  "step_onboarding",
  "step_payment",
  "step_sms",
  "step_email",
  "step_booking",
  "step_followup",
  "step_live",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data: project, old_data, changed_fields } = body;

    if (!project) {
      return Response.json({ skipped: true, reason: "No project data" });
    }

    const clientEmail = project.client_email || project.contact_email;
    if (!clientEmail) {
      console.warn("[StageChange] No client email on project", project.id);
      return Response.json({ skipped: true, reason: "No client email" });
    }

    const results = [];

    // Check each stage field — only fire if it just flipped to "complete"
    for (const stageKey of WATCHED_STAGES) {
      const justCompleted =
        project[stageKey] === "complete" &&
        old_data?.[stageKey] !== "complete";

      if (!justCompleted) continue;

      const config = STAGE_EMAILS[stageKey];
      if (!config) continue;

      console.log(`[StageChange] ${stageKey} just completed for ${project.business_name}`);

      // Send client email
      const sent = await sendEmail({
        to: clientEmail,
        subject: config.subject,
        html: config.clientBody(project),
      });

      results.push({ stage: stageKey, sent });

      // Log to CommunicationEvent
      await base44.asServiceRole.entities.CommunicationEvent.create({
        client_project_id: project.id,
        client_id: project.client_id,
        channel: "email",
        direction: "outbound",
        event_type: "email_sent",
        provider: "resend",
        status: sent ? "sent" : "failed",
        subject: config.subject,
        message_body: `Stage email for ${stageKey}`,
      });

      // For go-live: also send admin notification
      if (stageKey === "step_live" && config.adminBody) {
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: config.adminSubject(project),
          html: config.adminBody(project),
          fromName: "ClientSurge Automation",
        });
        console.log(`[StageChange] Admin go-live alert sent for ${project.business_name}`);
      }
    }

    if (results.length === 0) {
      return Response.json({ skipped: true, reason: "No stage completions detected" });
    }

    return Response.json({ success: true, triggered: results });
  } catch (error) {
    console.error("[StageChange] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});