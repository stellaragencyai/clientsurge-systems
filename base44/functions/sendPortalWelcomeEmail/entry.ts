import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";
import {
  formatFromAddress,
  getOnboardingFromEmail,
  getSupportReplyTo,
  getSystemInboxEmail,
} from "../_shared/emailConfig.js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// #234: verified — fires when client portal account is first created/activated
// #378: called from stripeWebhookOrders after Order paid + ClientInstallationOS initialized
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return secureJson({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user || user.role !== 'admin') {
      return secureJson({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    if (!RESEND_API_KEY) {
      return secureJson({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const { client_name, client_email, business_name } = await req.json();
    if (!client_name || !client_email || !business_name) {
      return secureJson({ error: 'client_name, client_email, and business_name are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)) {
      return secureJson({ error: 'client_email must be valid' }, { status: 400 });
    }
    const safeClientName = escapeHtml(client_name);
    const safeBusinessName = escapeHtml(business_name);
    const safeClientEmail = escapeHtml(client_email);

    const portalUrl = `https://clientsurgesystems.com/client-portal`;

    // Welcome email to the new client
    const clientHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e0d8;">
        <div style="background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 60%, #c8965c 100%); padding: 40px 40px 32px;">
          <h1 style="color: #f5e6d0; font-size: 28px; font-weight: 700; margin: 0 0 8px;">Welcome to ClientSurge Systems</h1>
          <p style="color: rgba(245,230,208,0.75); font-size: 15px; margin: 0;">Your automation system is being built</p>
        </div>
        <div style="padding: 40px;">
          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 16px;">Hi ${safeClientName},</p>
          <p style="font-size: 15px; color: #444; line-height: 1.7; margin: 0 0 24px;">
            Thanks for creating your account for <strong>${safeBusinessName}</strong>. Our team has received your details and will be in touch within 24 hours to kick off your system setup.
          </p>
          <p style="font-size: 15px; color: #444; line-height: 1.7; margin: 0 0 16px;">
            You'll receive a separate email with your activation link to access your Client Portal, where you can:
          </p>
          <ul style="font-size: 15px; color: #444; line-height: 1.9; margin: 0 0 32px; padding-left: 20px;">
            <li>Track your system build progress</li>
            <li>Message our team directly</li>
            <li>Manage your plan</li>
          </ul>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 100%); color: #f5e6d0; text-decoration: none; font-weight: 700; font-size: 16px; padding: 16px 40px; border-radius: 9999px;">
              Access Your Client Portal →
            </a>
          </div>
          <p style="font-size: 13px; color: #888; line-height: 1.6; margin: 0;">
            Questions? Just reply to this email or message us in your portal. We typically respond within a few hours.
          </p>
        </div>
        <div style="padding: 20px 40px; background: #faf8f5; border-top: 1px solid #e5e0d8; text-align: center;">
          <p style="font-size: 12px; color: #aaa; margin: 0;">© ${new Date().getFullYear()} ClientSurge Systems · Built for businesses that run on bookings</p>
        </div>
      </div>
    `;

    // Admin notification email
    const adminHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e0d8;">
        <div style="background: #1a1a1a; padding: 24px 32px;">
          <h2 style="color: #f5e6d0; font-size: 20px; font-weight: 700; margin: 0;">🆕 New Account Created</h2>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333;">
            <tr><td style="padding: 8px 0; font-weight: 600; width: 140px;">Name</td><td style="padding: 8px 0;">${safeClientName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Business</td><td style="padding: 8px 0;">${safeBusinessName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Email</td><td style="padding: 8px 0;"><a href="mailto:${safeClientEmail}" style="color: #9a5c2e;">${safeClientEmail}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Time</td><td style="padding: 8px 0;">${new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })} (AZ)</td></tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #faf8f5; border-radius: 8px; border-left: 4px solid #9a5c2e;">
            <p style="margin: 0; font-size: 13px; color: #555;">A Client record, ClientProject, and portal invitation have been automatically created. Follow up within 24 hours.</p>
          </div>
        </div>
      </div>
    `;

    // Send both emails in parallel via Resend
    const [clientRes, adminRes] = await Promise.all([
      resendFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: formatFromAddress(getOnboardingFromEmail()),
          reply_to: getSupportReplyTo(),
          to: [client_email],
          subject: `Welcome to ClientSurge Systems, ${safeClientName} 🚀`,
          html: clientHtml,
        }),
      }),
      resendFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: formatFromAddress(getOnboardingFromEmail()),
          to: [getSystemInboxEmail()],
          subject: `🆕 New Account: ${safeClientName} — ${safeBusinessName}`,
          html: adminHtml,
        }),
      }),
    ]);

    const clientData = await clientRes.json();
    const adminData = await adminRes.json();

    if (!clientRes.ok) {
      throw new Error(`Resend client email failed: ${JSON.stringify(clientData)}`);
    }
    if (!adminRes.ok) {
      throw new Error(`Resend admin email failed: ${JSON.stringify(adminData)}`);
    }

    return secureJson({ success: true, client_email_id: clientData.id, admin_email_id: adminData.id });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});
