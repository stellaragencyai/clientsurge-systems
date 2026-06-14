import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return secureJson({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { lead_id, contact_info } = payload;

    if (!lead_id || !contact_info) {
      return secureJson({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log contact form completion to CommunicationEvent
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: 'internal',
      direction: 'system',
      event_type: 'lead_created',
      provider: 'internal',
      status: 'processed',
      subject: 'Contact form submitted',
      message_body: `Contact form completion logged for ${contact_info.business_type || 'unknown'}`,
      metadata_json: JSON.stringify({
        event_type: 'contact_form_completion',
        business_type: contact_info.business_type,
        timestamp: new Date().toISOString(),
        source: 'website_contact_form',
      }),
    });

    // Also track via analytics for dashboard insights
    base44.analytics.track({
      eventName: 'contact_form_completed',
      properties: {
        lead_id,
        business_type: contact_info.business_type,
        timestamp: new Date().toISOString(),
      },
    });

    return secureJson({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to track form completion';
    return secureJson({ error: message }, { status: 500 });
  }
});