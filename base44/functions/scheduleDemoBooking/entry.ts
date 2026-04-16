import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { full_name, business_name, email, phone, scheduled_date, scheduled_time, monthly_leads, biggest_issue, industry } = await req.json();

    // Validate required fields
    if (!full_name || !email || !phone || !scheduled_date || !scheduled_time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create lead in database
    const lead = await base44.entities.Leads.create({
      full_name,
      business_name,
      email,
      phone,
      business_type: industry || "General",
      problem: biggest_issue || monthly_leads || "Scheduling demo",
      status: "Booked",
      booking_link_sent_at: new Date().toISOString(),
      booked_at: new Date().toISOString(),
    });

    // Parse scheduled date/time
    const [year, month, day] = scheduled_date.split('-');
    const [hour, minute] = scheduled_time.split(':');
    const bookingDateTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    ).toISOString();

    // 2. Send confirmation email to lead
    await base44.functions.invoke('sendDemoConfirmationEmail', {
      email,
      full_name,
      business_name,
      scheduled_date,
      scheduled_time,
    });

    // 3. Send SMS confirmation to lead
    await base44.functions.invoke('sendDemoConfirmationSMS', {
      phone,
      full_name,
      scheduled_date,
      scheduled_time,
    });

    // 4. Send admin notification email
    await base44.functions.invoke('sendAdminDemoNotification', {
      full_name,
      business_name,
      email,
      phone,
      scheduled_date,
      scheduled_time,
      monthly_leads,
      biggest_issue,
      industry,
    });

    // 5. Create calendar event
    await base44.functions.invoke('createDemoCalendarEvent', {
      title: `Demo: ${business_name} - ${full_name}`,
      description: `Demo Booking\n\nBusiness: ${business_name}\nIndustry: ${industry || 'General'}\nContact: ${full_name}\nEmail: ${email}\nPhone: ${phone}\nMonthly Leads: ${monthly_leads}\nChallenge: ${biggest_issue}`,
      start_time: bookingDateTime,
      duration_minutes: 15,
    });

    return Response.json({
      success: true,
      lead_id: lead.id,
      message: 'Demo scheduled successfully',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});