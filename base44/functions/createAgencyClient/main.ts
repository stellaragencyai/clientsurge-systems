import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Create Agency Client: Provision a new Client under an Agency
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      agency_id,
      client_name,
      client_email,
      contact_name,
      industry,
      business_type,
      relationship_type,
    } = await req.json();

    if (!agency_id || !client_name || !client_email) {
      return Response.json(
        { error: 'agency_id, client_name, client_email required' },
        { status: 400 }
      );
    }

    // Verify agency exists
    const agency = await base44.asServiceRole.entities.Agency.filter(
      { id: agency_id },
      null,
      1
    ).then(results => results?.[0]).catch(() => null);

    if (!agency) {
      return Response.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Check max clients limit
    if (agency.max_clients_allowed > 0 && agency.current_clients_count >= agency.max_clients_allowed) {
      return Response.json(
        { error: 'Agency has reached maximum clients limit' },
        { status: 400 }
      );
    }

    // Create new Client under the agency
    const newClient = {
      business_name: client_name,
      primary_contact_email: client_email,
      contact_name: contact_name,
      industry: industry,
      business_type: business_type,
      status: 'prospect',
      lifecycle_stage: 'onboarding',
    };

    const client = await base44.asServiceRole.entities.Client.create(newClient);

    // Create mapping
    const mapping = {
      agency_id,
      client_id: client.id,
      relationship_type: relationship_type || 'owned',
      mapped_at: new Date().toISOString(),
      is_active: true,
    };

    await base44.asServiceRole.entities.AgencyClientMapping.create(mapping);

    // Update agency client count
    await base44.asServiceRole.entities.Agency.update(agency_id, {
      current_clients_count: (agency.current_clients_count || 0) + 1,
    });

    return Response.json({
      success: true,
      client: {
        id: client.id,
        name: client.business_name,
        email: client.primary_contact_email,
        status: client.status,
        created_at: client.created_date,
      },
      mapping: {
        agency_id,
        client_id: client.id,
        relationship_type: relationship_type || 'owned',
      },
    });
  } catch (error) {
    console.error('[createAgencyClient] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});