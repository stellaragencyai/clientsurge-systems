import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { title, description, start_time, duration_minutes } = await req.json();

    if (!title || !start_time || !duration_minutes) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create calendar event in database for tracking
    await base44.entities.DemoRequest.create({
      lead_id: '',
      scheduled_date: start_time.split('T')[0],
      scheduled_time: start_time.split('T')[1].substring(0, 5),
      status: 'scheduled',
      notes: description,
    });

    // If you have Google Calendar integration, you can add it here
    // For now, we're tracking it in the database
    // You can later add Google Calendar API call if needed

    return Response.json({ success: true, message: 'Calendar event created' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});