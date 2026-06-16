import { secureJson } from "../_shared/response.ts";
/**
 * approveWebsiteCopy
 * Persists approved website copy sections to Order.install_configuration.website_copy
 *
 * Payload:
 *   - order_id: string
 *   - approved_sections: { [section_key]: object } — the new copy to save
 *
 * Returns: { success: true, saved_sections: string[] }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return secureJson({ error: 'Admin access required' }, { status: 403 });
    }

    const { order_id, approved_sections } = await req.json();
    if (!order_id || !approved_sections || typeof approved_sections !== 'object') {
      return secureJson({ error: 'order_id and approved_sections are required' }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return secureJson({ error: 'Order not found' }, { status: 404 });
    }

    // Merge approved sections into existing website_copy
    const existingConfig = order.install_configuration || {};
    const existingCopy = existingConfig.website_copy || {};
    const merged = { ...existingCopy, ...approved_sections };

    await base44.asServiceRole.entities.Order.update(order_id, {
      install_configuration: {
        ...existingConfig,
        website_copy: merged,
        website_copy_last_updated: new Date().toISOString(),
        website_copy_approved_by: user.email,
      },
    });

    const savedSections = Object.keys(approved_sections);
    console.log(`[approveWebsiteCopy] Saved ${savedSections.length} sections for order ${order_id}: ${savedSections.join(', ')}`);

    // Log to CommunicationEvent
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      channel: 'internal',
      direction: 'system',
      event_type: 'service_configuration_updated',
      provider: 'internal',
      status: 'processed',
      subject: `Website copy updated — ${savedSections.length} section(s) approved`,
      metadata_json: JSON.stringify({ saved_sections: savedSections, approved_by: user.email }),
    });

    return secureJson({ success: true, saved_sections: savedSections });

  } catch (error) {
    console.error('[approveWebsiteCopy] Error:', error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});