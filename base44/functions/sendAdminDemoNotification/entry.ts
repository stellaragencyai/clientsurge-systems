import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { full_name, business_name, email, phone, scheduled_date, scheduled_time, monthly_leads, biggest_issue } = await req.json();

    if (!full_name || !email || !scheduled_date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get admin email from settings or use default
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@apexflow.com';

    const subject = `🎯 New Demo Scheduled: ${business_name}`;
    const body = `A new med spa demo has been scheduled!

👤 Contact:
Name: ${full_name}
Business: ${business_name}
Email: ${email}
Phone: ${phone}

📊 Info:
Monthly Leads: ${monthly_leads || 'Not specified'}
Challenge: ${biggest_issue || 'Not specified'}

📅 Demo Scheduled:
Date: ${scheduled_date}
Time: ${scheduled_time}
Duration: 15 minutes

Action: Add this to your calendar and prepare talking points for their specific challenge.`;

    await base44.integrations.Core.SendEmail({
      to: adminEmail,
      subject,
      body,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});