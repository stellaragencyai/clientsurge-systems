/**
 * PLATFORM-WEBSITE-ONLY
 * Website form completion tracking is scoped to ClientSurge's own WebsiteLead funnel.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { buildPlatformWebsiteLeadMetadata } from "../_shared/leadModel.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { lead_id, website_lead_id, contact_info } = payload;
    const websiteLeadId = website_lead_id || lead_id;

    if (!websiteLeadId || !contact_info) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log contact form completion to CommunicationEvent
    await base44.asServiceRole.entities.CommunicationEvent.create({
      website_lead_id: websiteLeadId,
      channel: 'internal',
      direction: 'system',
      event_type: 'lead_created',
      provider: 'internal',
      status: 'processed',
      subject: 'Contact form submitted',
      message_body: `Contact form completion logged for ${contact_info.business_type || 'unknown'}`,
      metadata_json: JSON.stringify(buildPlatformWebsiteLeadMetadata({
        event_type: 'contact_form_completion',
        business_type: contact_info.business_type,
        timestamp: new Date().toISOString(),
        source: 'website_contact_form',
      })),
    });

    // Also track via analytics for dashboard insights
    base44.analytics.track({
      eventName: 'contact_form_completed',
      properties: {
        website_lead_id: websiteLeadId,
        business_type: contact_info.business_type,
        timestamp: new Date().toISOString(),
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to track form completion';
    return Response.json({ error: message }, { status: 500 });
  }
});
