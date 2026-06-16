/**
 * sendDeploymentConfirmationEmail
 * Replaces demo confirmation with AI Brain deployment briefing.
 * Triggered immediately after Stripe payment (via postPaymentOrchestrator).
 *
 * Flow: Payment → Order Status: "paid_setup_in_progress" → This function
 * Purpose: Inform client that "AI Brain is provisioning" and provide portal access link.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

async function sendEmail(baseClient, to, subject, htmlBody) {
  try {
    const response = await baseClient.integrations.Core.SendEmail({
      to,
      subject,
      body: htmlBody,
      from_name: "ClientSurge Systems"
    });
    console.log("[sendDeploymentConfirmationEmail] Email sent successfully", { to, subject });
    return { success: true, response };
  } catch (err) {
    console.error("[sendDeploymentConfirmationEmail] SendEmail failed", { to, error: err.message });
    return { success: false, error: err.message };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const base44 = createClientFromRequest(req);

  try {
    const payload = await req.json();
    const { order_id, customer_email, customer_name, package_name, package_key } = payload;

    if (!order_id || !customer_email) {
      console.error("[sendDeploymentConfirmationEmail] Missing required fields", { order_id, customer_email });
      return new Response(JSON.stringify({ error: "Missing order_id or customer_email" }), { status: 400 });
    }

    // Determine estimated setup time based on package
    const setupTimeMap = {
      "starter_system": "2-3 hours",
      "growth_system": "3-4 hours",
      "pro_system": "4-6 hours"
    };
    const estimatedSetupTime = setupTimeMap[package_key] || "2-4 hours";

    // Build portal access link
    const portalLink = `${Deno.env.get("CLIENTSURGE_WEBSITE_URL") || "https://clientsurgesystems.com"}/client-dashboard`;

    const htmlBody = `
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0A1628; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { border-bottom: 2px solid #00AEEF; padding-bottom: 24px; margin-bottom: 32px; }
    .logo { height: 32px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #0A1628; }
    .section { margin-bottom: 28px; padding: 20px; background: rgba(0,174,239,0.04); border-left: 4px solid #00AEEF; border-radius: 8px; }
    .section h2 { margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #005f99; }
    .section p { margin: 0 0 12px; font-size: 14px; color: rgba(10,22,40,0.75); }
    .section p:last-child { margin-bottom: 0; }
    .cta-button { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #00AEEF, #003B8F); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .timeline { background: white; border: 1px solid #00AEEF; border-radius: 8px; padding: 20px; margin: 16px 0; }
    .timeline-item { display: flex; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(0,174,239,0.1); }
    .timeline-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: #00AEEF; margin-top: 5px; margin-right: 16px; flex-shrink: 0; }
    .timeline-content { font-size: 13px; }
    .timeline-content strong { color: #005f99; }
    .footer { border-top: 1px solid rgba(0,174,239,0.1); padding-top: 24px; margin-top: 32px; font-size: 12px; color: rgba(10,22,40,0.5); }
    .support-link { color: #00AEEF; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <svg class="logo" viewBox="0 0 240 72" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="50" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#0A1628">ClientSurge</text>
      </svg>
      <h1>Your AI Brain is Deploying 🚀</h1>
    </div>

    <div class="section">
      <h2>Deployment Status</h2>
      <p>Thank you for choosing <strong>${package_name}</strong>! Your AI automation system is being provisioned right now.</p>
      <p><strong>Status:</strong> Configuring your AI Brain to sync with your website and business systems.</p>
      <p><strong>Estimated time:</strong> ${estimatedSetupTime}</p>
    </div>

    <div class="section">
      <h2>What Happens Next</h2>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content"><strong>Now:</strong> AI Brain provisioning begins</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content"><strong>In 1–2 hours:</strong> System checks sync status</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content"><strong>Before go-live:</strong> Final test with a demo lead</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content"><strong>Final step:</strong> You'll receive your "System is LIVE" alert</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Access Your Dashboard</h2>
      <p>You can watch the deployment progress in real-time from your client dashboard. Click the button below to log in and monitor installation status.</p>
      <a href="${portalLink}" class="cta-button">View Deployment Status →</a>
    </div>

    <div class="section">
      <h2>Need Help?</h2>
      <p>Our onboarding team monitors every deployment. If you have questions or notice any issues, reply to this email or <a href="tel:+16025843227" class="support-link">call us at (602) 584-3227</a>.</p>
      <p><strong>Average response time:</strong> Under 4 hours</p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} ClientSurge Systems. All rights reserved.</p>
      <p>You're receiving this email because you purchased an AI automation package. If you have any questions, <a href="mailto:support@clientsurgesystems.com" class="support-link">contact support</a>.</p>
    </div>
  </div>
</body>
</html>
    `;

    const result = await sendEmail(
      base44,
      customer_email,
      `🚀 Your AI Brain is Deploying — ${package_name}`,
      htmlBody
    );

    if (result.success) {
      return new Response(JSON.stringify({ success: true, order_id, message: "Deployment confirmation email sent" }), { status: 200 });
    } else {
      console.error("[sendDeploymentConfirmationEmail] Email send failed", { order_id, error: result.error });
      return new Response(JSON.stringify({ success: false, error: result.error }), { status: 500 });
    }
  } catch (err) {
    console.error("[sendDeploymentConfirmationEmail] Handler error", { error: err.message });
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});