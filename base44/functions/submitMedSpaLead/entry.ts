import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Validate required fields
    const { name, business_name, email, phone, service_interest, problem } = body;
    if (!name || !business_name || !email || !phone || !service_interest || !problem) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create lead in database
    const lead = await base44.asServiceRole.entities.MedSpaLead.create({
      name,
      business_name,
      email,
      phone,
      service_interest,
      problem,
      source: 'med_spa_page',
      status: 'new',
    });

    // Track analytics event
    await base44.analytics.track({
      eventName: 'med_spa_lead_submitted',
      properties: {
        service_interest,
        business_name,
      },
    });

    return Response.json({
      success: true,
      lead_id: lead.id,
      message: 'Lead submitted successfully',
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});