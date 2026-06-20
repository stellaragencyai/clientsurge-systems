import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Lead Data Quality Validation & Cleanup
 * Checks ~5800 leads for:
 * - Normalization completeness
 * - Deduplication integrity
 * - Scoring consistency (0-100 range, no conflicts)
 * - Lead state validity
 * - Data completeness
 * 
 * READ-ONLY: Adds quality flags only, does not modify raw data
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { batch_size = 500, start_from_id = null } = await req.json();

    // Fetch leads in batches
    const leads = await base44.asServiceRole.entities.Leads.filter({}, '-created_date', batch_size);
    
    if (!leads || leads.length === 0) {
      return Response.json({ summary: { total_checked: 0, issues_found: 0 } });
    }

    const issues = [];
    const quality_updates = [];

    // Process each lead
    leads.forEach(lead => {
      const flags = [];
      let data_quality_status = 'complete';
      let normalization_status = 'complete';
      let scoring_issues = [];
      let dedup_review_needed = false;

      // 1. Check required fields completeness
      if (!lead.email && !lead.phone) {
        flags.push('missing_email_and_phone');
        data_quality_status = 'incomplete';
      }
      if (!lead.business_name) {
        flags.push('missing_business_name');
        data_quality_status = data_quality_status === 'incomplete' ? 'incomplete' : 'partial';
      }
      if (!lead.industry) {
        flags.push('missing_industry');
        data_quality_status = data_quality_status === 'incomplete' ? 'incomplete' : 'partial';
      }

      // 2. Check normalization completeness
      const needs_normalization = [];
      if (lead.email && !lead.normalized_email) {
        needs_normalization.push('email');
      }
      if (lead.phone && !lead.normalized_phone) {
        needs_normalization.push('phone');
      }
      if (lead.business_name && !lead.normalized_business_name) {
        needs_normalization.push('business_name');
      }
      if ((lead.website || lead.email) && !lead.normalized_domain) {
        needs_normalization.push('domain');
      }

      if (needs_normalization.length > 0) {
        flags.push(`needs_normalization[${needs_normalization.join(',')}]`);
        normalization_status = needs_normalization.length === 4 ? 'pending' : 'partial';
      }

      // 3. Validate lead_state
      const validStates = ['NEW', 'UNQUALIFIED', 'QUALIFIED', 'ENGAGED', 'HOT', 'BOOKED', 'WON', 'LOST', 'DORMANT'];
      if (!lead.lead_state || !validStates.includes(lead.lead_state)) {
        flags.push('invalid_lead_state');
      }

      // 4. Check scoring consistency
      const scoreFields = [
        { name: 'lead_score', value: lead.lead_score },
        { name: 'intent_score', value: lead.intent_score },
        { name: 'engagement_score', value: lead.engagement_score },
        { name: 'recency_score', value: lead.recency_score },
        { name: 'intelligence_score', value: lead.intelligence_score },
      ];

      scoreFields.forEach(sf => {
        if (typeof sf.value === 'number') {
          if (sf.value < 0 || sf.value > 100) {
            scoring_issues.push(`${sf.name}_out_of_range`);
          }
        }
      });

      // Check intelligence_score alignment with components
      if (lead.intelligence_score && lead.intelligence_score > 0) {
        const componentAvg = (
          (lead.engagement_score || 0) +
          (lead.intent_score || 0) +
          (lead.recency_score || 0)
        ) / 3;
        if (Math.abs(componentAvg - lead.intelligence_score) > 20) {
          scoring_issues.push('intelligence_mismatch_with_components');
        }
      }

      if (scoring_issues.length > 0) {
        flags.push(...scoring_issues);
      }

      // 5. Deduplication review logic
      if (lead.dedupe_status === 'duplicate_candidate' && !lead.dedupe_duplicate_of) {
        dedup_review_needed = true;
        flags.push('dedup_candidate_unresolved');
      }
      if (lead.dedupe_status === 'manual_review') {
        dedup_review_needed = true;
      }

      // 6. Prepare update if issues found
      if (flags.length > 0 || data_quality_status !== 'complete' || normalization_status !== 'complete') {
        quality_updates.push({
          id: lead.id,
          data: {
            data_quality_status,
            data_quality_flags: flags,
            normalization_status,
            dedup_review_needed,
            scoring_validation_issues: scoring_issues,
            data_quality_checked_at: new Date().toISOString(),
          },
        });

        issues.push({
          lead_id: lead.id,
          business_name: lead.business_name,
          flags,
          quality_status: data_quality_status,
          normalization: normalization_status,
          scoring_issues,
        });
      }
    });

    // Batch apply updates efficiently
    let updated_count = 0;
    if (quality_updates.length > 0) {
      for (const update of quality_updates) {
        try {
          await base44.asServiceRole.entities.Leads.update(update.id, update.data);
          updated_count++;
        } catch (e) {
          console.error(`Failed to update lead ${update.id}:`, e);
        }
      }
    }

    return Response.json({
      summary: {
        total_checked: leads.length,
        issues_found: issues.length,
        records_updated: updated_count,
        completion_percentage: leads.length > 0 ? Math.round((updated_count / leads.length) * 100) : 0,
      },
      issues_sample: issues.slice(0, 10),
      next_batch_available: leads.length >= batch_size,
    });
  } catch (error) {
    console.error('[validateLeadDataQuality]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});