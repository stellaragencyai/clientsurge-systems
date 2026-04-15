import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { client_name, client_email, business_name } = await req.json();

  const portalUrl = `${req.headers.get('origin') || 'https://apexflow.base44.app'}/client-portal`;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e0d8;">
      <div style="background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 60%, #c8965c 100%); padding: 40px 40px 32px;">
        <h1 style="color: #f5e6d0; font-size: 28px; font-weight: 700; margin: 0 0 8px;">Welcome to ApexFlow</h1>
        <p style="color: rgba(245,230,208,0.75); font-size: 15px; margin: 0;">Your automation system is being built</p>
      </div>
      <div style="padding: 40px;">
        <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 16px;">Hi ${client_name},</p>
        <p style="font-size: 15px; color: #444; line-height: 1.7; margin: 0 0 24px;">
          Thanks for completing your onboarding for <strong>${business_name}</strong>. Our team has received everything and will begin building your system within 24 hours.
        </p>
        <p style="font-size: 15px; color: #444; line-height: 1.7; margin: 0 0 32px;">
          You can track your build progress, message our team, and manage your plan at any time through your Client Portal:
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 100%); color: #f5e6d0; text-decoration: none; font-weight: 700; font-size: 16px; padding: 16px 40px; border-radius: 9999px;">
            Access Your Client Portal →
          </a>
        </div>
        <p style="font-size: 13px; color: #888; line-height: 1.6; margin: 0;">
          Questions? Just reply to this email or message us directly in your portal. We typically respond within a few hours.
        </p>
      </div>
      <div style="padding: 20px 40px; background: #faf8f5; border-top: 1px solid #e5e0d8; text-align: center;">
        <p style="font-size: 12px; color: #aaa; margin: 0;">© ${new Date().getFullYear()} ApexFlow · Built for businesses that run on bookings</p>
      </div>
    </div>
  `;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: client_email,
    subject: `Your ApexFlow system is being built, ${client_name} 🚀`,
    body: html,
    from_name: "ApexFlow",
  });

  return Response.json({ success: true });
});