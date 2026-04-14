import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, full_name, business_name, scheduled_date, scheduled_time } = await req.json();

    if (!email || !full_name || !scheduled_date || !scheduled_time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subject = "Your ApexFlow Med Spa Demo is Scheduled ✓";
    const body = `Hi ${full_name},

Thank you for scheduling your ApexFlow demo! We're excited to show you how to turn your med spa leads into booked consultations.

📅 Demo Details:
Date: ${scheduled_date}
Time: ${scheduled_time}
Duration: 15 minutes
Link: [Will be sent 24 hours before]

What to Expect:
✓ Live walkthrough of your med spa automation system
✓ Demo of instant lead response & follow-up
✓ Your personalized booking timeline
✓ Q&A about your specific challenges

See you soon,
The ApexFlow Team

P.S. If you need to reschedule, just reply to this email or call us.`;

    await base44.integrations.Core.SendEmail({
      to: email,
      subject,
      body,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});