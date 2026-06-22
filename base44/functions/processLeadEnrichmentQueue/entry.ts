import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || 25, 50);
    const leadIds = body.lead_ids || null;

    // ── Fetch leads needing enrichment ──
    let leadsToEnrich;
    if (leadIds && leadIds.length > 0) {
      leadsToEnrich = await base44.asServiceRole.entities.Leads.filter(
        { _id: { $in: leadIds } },
        '-created_date',
        limit
      );
    } else {
      leadsToEnrich = await base44.asServiceRole.entities.Leads.filter(
        { enrichment_status: 'needs_lookup', quality_review_status: { $in: ['active', 'audit_pending'] } },
        '-created_date',
        limit
      );
    }

    if (!leadsToEnrich || leadsToEnrich.length === 0) {
      return Response.json({
        success: true,
        summary: { enriched: 0, failed: 0, not_found: 0, message: 'No leads pending enrichment' }
      });
    }

    let enriched = 0;
    let failed = 0;
    let notFound = 0;
    const results = [];

    for (const lead of leadsToEnrich) {
      try {
        const businessName = lead.business_name || '';
        const city = lead.canonical_city || lead.city || '';
        const state = lead.canonical_state || lead.state || '';

        if (!businessName) {
          await base44.asServiceRole.entities.Leads.update(lead.id, {
            enrichment_status: 'failed',
            enrichment_notes: 'No business name available for lookup'
          });
          failed++;
          results.push({ id: lead.id, status: 'failed', reason: 'no_business_name' });
          continue;
        }

        // ── Use InvokeLLM with web search to find Google Business Profile data ──
        const searchQuery = `${businessName} ${city} ${state}`.trim();
        const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Search for the business "${businessName}" located in ${city}, ${state}. Find their official website URL, Google Business Profile rating, review count, and Google Maps URL. If this is a real business, return the data. If you cannot find this business or it appears to be a test/fake business, say so.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              found: { type: "boolean" },
              website_url: { type: "string" },
              google_rating: { type: "number" },
              google_review_count: { type: "integer" },
              google_maps_url: { type: "string" },
              google_place_id: { type: "string" },
              address: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              phone: { type: "string" },
              confidence: { type: "string", enum: ["high", "medium", "low"] }
            }
          }
        });

        const data = llmResponse || {};

        if (!data.found) {
          await base44.asServiceRole.entities.Leads.update(lead.id, {
            enrichment_status: 'not_found',
            enrichment_notes: `No business found for "${searchQuery}"`,
            enriched_at: new Date().toISOString()
          });
          notFound++;
          results.push({ id: lead.id, status: 'not_found' });
          continue;
        }

        // ── Update lead with enriched data ──
        const updateData = {
          enrichment_status: 'enriched',
          enriched_at: new Date().toISOString(),
          enrichment_notes: `Enriched via web search. Confidence: ${data.confidence || 'unknown'}`
        };

        if (data.website_url) {
          updateData.website = data.website_url;
          updateData.website_url = data.website_url;
          updateData.canonical_website_url = data.website_url.startsWith('http') ? data.website_url : `https://${data.website_url}`;
        }
        if (data.google_rating !== undefined && data.google_rating !== null) {
          updateData.google_rating = data.google_rating;
        }
        if (data.google_review_count !== undefined && data.google_review_count !== null) {
          updateData.google_review_count = data.google_review_count;
        }
        if (data.google_maps_url) {
          updateData.google_business_profile_url = data.google_maps_url;
        }
        if (data.google_place_id) {
          updateData.google_place_id = data.google_place_id;
        }
        if (data.city && !lead.city) {
          updateData.city = data.city;
          updateData.canonical_city = data.city.toLowerCase().trim();
        }
        if (data.state && !lead.state) {
          updateData.state = data.state;
          updateData.canonical_state = data.state.toLowerCase().trim();
        }
        if (data.phone && !lead.phone) {
          updateData.phone = data.phone;
        }
        if (data.address && !lead.canonical_business_name) {
          updateData.canonical_business_name = (businessName || '').toLowerCase().trim();
        }

        await base44.asServiceRole.entities.Leads.update(lead.id, updateData);
        enriched++;
        results.push({ id: lead.id, status: 'enriched', website: data.website_url, rating: data.google_rating });
      } catch (err) {
        console.error(`Enrichment error for lead ${lead.id}:`, err.message);
        await base44.asServiceRole.entities.Leads.update(lead.id, {
          enrichment_status: 'failed',
          enrichment_notes: `Enrichment error: ${err.message}`
        }).catch(() => {});
        failed++;
        results.push({ id: lead.id, status: 'failed', error: err.message });
      }
    }

    return Response.json({
      success: true,
      summary: {
        total_processed: leadsToEnrich.length,
        enriched,
        failed,
        not_found,
      },
      results
    });
  } catch (error) {
    console.error('Lead Enrichment Queue Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});