/**
 * applyLeadRoutingBackfillSafe — Admin-controlled safe backfill for lead routing
 * + CRM linkage. Updates WebsiteLead and Leads records ONLY for routing/linkage/data hygiene.
 *
 * SAFETY RULES (enforced):
 *   - No SMS, email, Twilio, Resend, Gmail, Stripe, or external provider calls
 *   - No follow-up automation triggered
 *   - No leads marked as contacted
 *   - No consent fields changed
 *   - No records deleted
 *   - No Stripe objects created or modified
 *   - Existing non-empty client_id, client_project_id, dedup_key, crm_lead_id NOT overwritten
 *     unless clearly invalid/test placeholder
 *   - Internal/test/QA leads flagged, NOT linked as production-ready
 *   - Production-eligible leads receive client_id=clientsurge_system, client_project_id=clientsurge_public_site
 *   - dedup_key generated from normalized email → phone → business name + source_page
 *   - Matching Leads record linked via crm_lead_id
 *   - New canonical Leads record created if no match and usable identity exists
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

// ── Deterministic internal/test classifier (same as simulation) ──
const INTERNAL_EMAIL_DOMAINS = /clientsurge-install\.internal|clientsurge\.test/i;
const INTERNAL_EMAIL_PREFIXES = /^(test\+|backfill-test\+|crm-smoke\+)/i;
const INTERNAL_SOURCES = ["install_test", "admin_test_lead", "crm_live_smoke_test", "post_patch_verification_internal_test"];
const INTERNAL_SOURCE_PAGE_PATTERNS = /install_test|ai_brain_backfill|verification=|smoke/i;
const INTERNAL_BUSINESS_NAMES = /Smoke QA|UI Function Smoke|Internal Test|Admin Test|ClientSurge Smoke|ClientSurge UI Function/i;
const INTERNAL_FULL_NAMES = /Install Test|Backfill Test|Admin Test|Post Patch Internal Test/i;
const PHONE_555 = /555/;

function classifyInternalTest(wl, ownerEmail) {
  const email = (wl.email || "").toLowerCase().trim();
  const source = (wl.source || "").toLowerCase().trim();
  const sourcePage = (wl.source_page || "").toLowerCase();
  const businessName = (wl.business_name || "");
  const fullName = (wl.full_name || "");
  const phone = (wl.phone_number || wl.phone || "");

  if (INTERNAL_EMAIL_DOMAINS.test(email)) return true;
  if (INTERNAL_EMAIL_PREFIXES.test(email)) return true;
  if (INTERNAL_SOURCES.includes(source)) return true;
  if (INTERNAL_SOURCE_PAGE_PATTERNS.test(sourcePage)) return true;
  if (INTERNAL_BUSINESS_NAMES.test(businessName)) return true;
  if (INTERNAL_FULL_NAMES.test(fullName)) return true;
  if (PHONE_555.test(phone)) return true;
  if (ownerEmail && email === ownerEmail.toLowerCase() && (source.includes("test") || source.includes("qa") || source.includes("smoke") || source.includes("admin"))) return true;
  return false;
}

// ── Test placeholder detection for safe overwrite ──
const TEST_PLACEHOLDER_PATTERNS = /^test$|^placeholder$|^todo$|^tbd$|^unknown$|^none$|^n\/a$|^xxx/i;

function isTestPlaceholder(value) {
  if (!value) return false;
  return TEST_PLACEHOLDER_PATTERNS.test(value.trim().toLowerCase());
}

// ── Normalization ──
function normalizeEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim().replace(/\s+/g, "");
}
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return digits;
}
function normalizeBusinessName(name) {
  if (!name) return null;
  return name.toLowerCase().trim().replace(/\s+/g, " ").replace(/[.,&'"]/g, "");
}
function generateDedupKey(wl) {
  const email = normalizeEmail(wl.email);
  if (email) return `email:${email}`;
  const phone = normalizePhone(wl.phone_number || wl.phone);
  if (phone) return `phone:${phone}`;
  const biz = normalizeBusinessName(wl.business_name);
  if (biz) return `biz:${biz}:${(wl.source_page || "unknown").toLowerCase().slice(0, 40)}`;
  return null;
}
function hasUsableIdentity(wl) {
  return !!(wl.email || wl.phone_number || wl.phone || wl.business_name);
}

const CLIENT_ID_DEFAULT = "clientsurge_system";
const CLIENT_PROJECT_ID_DEFAULT = "clientsurge_public_site";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const ownerEmail = user.email || "";
    const now = new Date().toISOString();

    // ── Fetch WebsiteLead records ──
    const websiteLeads = await svc.entities.WebsiteLead.list("", 500).catch(() => []);

    // ── Fetch Leads records for matching ──
    const crmLeads = await svc.entities.Leads.list("", 500).catch(() => []);

    const crmByEmail = new Map();
    const crmByPhone = new Map();
    const crmByWebsiteLeadId = new Map();
    for (const cl of (crmLeads || [])) {
      if (cl.email) crmByEmail.set(cl.email.toLowerCase().trim(), cl);
      if (cl.phone) {
        const digits = cl.phone.replace(/\D/g, "");
        if (digits.length >= 7) crmByPhone.set(digits, cl);
      }
      if (cl.website_lead_id) crmByWebsiteLeadId.set(cl.website_lead_id, cl);
    }

    const counts = {
      total_scanned: (websiteLeads || []).length,
      production_eligible: 0,
      internal_test_skipped: 0,
      missing_identity_blocked: 0,
      website_leads_updated: 0,
      crm_links_created: 0,
      leads_created: 0,
      leads_updated: 0,
    };

    const blockers = [];
    const warnings = [];
    const sampleUpdatedIds = [];
    const sampleSkippedIds = [];
    const sampleCreatedLeadIds = [];

    for (const wl of (websiteLeads || [])) {
      const isInternal = classifyInternalTest(wl, ownerEmail);

      if (isInternal) {
        counts.internal_test_skipped++;
        if (sampleSkippedIds.length < 10) sampleSkippedIds.push(wl.id);
        // Flag internal/test leads using available quality fields where safe
        try {
          const qualityUpdate = {};
          if (wl.lead_quality !== "internal_test") qualityUpdate.lead_quality = "internal_test";
          if (wl.dashboard_truth_status !== "blocked") qualityUpdate.dashboard_truth_status = "blocked";
          if (wl.dashboard_excluded !== true) qualityUpdate.dashboard_excluded = true;
          if (wl.dashboard_exclusion_reason !== "Internal/test/QA lead — excluded from production dashboard") {
            qualityUpdate.dashboard_exclusion_reason = "Internal/test/QA lead — excluded from production dashboard";
          }
          if (Object.keys(qualityUpdate).length > 0) {
            await svc.entities.WebsiteLead.update(wl.id, qualityUpdate);
          }
        } catch (err) {
          warnings.push(`Failed to flag internal/test lead ${wl.id}: ${err.message}`);
        }
        continue;
      }

      if (!hasUsableIdentity(wl)) {
        counts.missing_identity_blocked++;
        if (sampleSkippedIds.length < 10) sampleSkippedIds.push(wl.id);
        continue;
      }

      counts.production_eligible++;

      // ── Build safe update for WebsiteLead ──
      const update = {};
      const dedupKey = generateDedupKey(wl);

      // client_id — only set if missing or test placeholder
      if (!wl.client_id || isTestPlaceholder(wl.client_id)) {
        update.client_id = CLIENT_ID_DEFAULT;
      }
      // client_project_id — only set if missing or test placeholder
      if (!wl.client_project_id || isTestPlaceholder(wl.client_project_id)) {
        update.client_project_id = CLIENT_PROJECT_ID_DEFAULT;
      }
      // dedup_key — only set if missing
      if (!wl.dedup_key && dedupKey) {
        update.dedup_key = dedupKey;
      }

      // ── CRM linkage ──
      let linkedLeadId = wl.crm_lead_id;

      if (!wl.crm_lead_id || isTestPlaceholder(wl.crm_lead_id)) {
        // Try matching
        const emailMatch = wl.email ? crmByEmail.get(wl.email.toLowerCase().trim()) : null;
        const phoneDigits = (wl.phone_number || wl.phone || "").replace(/\D/g, "");
        const phoneMatch = phoneDigits.length >= 7 ? crmByPhone.get(phoneDigits) : null;
        const websiteLeadIdMatch = wl.id ? crmByWebsiteLeadId.get(wl.id) : null;
        const matchedLead = emailMatch || phoneMatch || websiteLeadIdMatch;

        if (matchedLead) {
          linkedLeadId = matchedLead.id;
          update.crm_lead_id = matchedLead.id;
          counts.crm_links_created++;
        } else if (hasUsableIdentity(wl)) {
          // Create new canonical Leads record
          const newLeadData = {
            full_name: wl.full_name || wl.business_name || "Unknown",
            business_name: wl.business_name || "Unknown",
            email: wl.email || "",
            phone: wl.phone_number || wl.phone || "",
            business_type: wl.business_type || "Service Business",
            problem: wl.problem || wl.message || "",
            source: wl.source || "website_form",
            source_page: wl.source_page || "",
            utm_source: wl.utm_source || "",
            utm_medium: wl.utm_medium || "",
            utm_campaign: wl.utm_campaign || "",
            utm_content: wl.utm_content || "",
            utm_term: wl.utm_term || "",
            website_lead_id: wl.id,
            consent_given: wl.consent_given || false,
            consent_given_at: wl.consent_given_at || "",
            consent_ip: wl.consent_ip || "",
            consent_source: wl.consent_source || "",
            consent_text_version: wl.consent_text_version || "",
            requested_channels: wl.requested_channels || [],
            status: "New",
            crm_stage: "Not Contacted",
            outreach_status: "not_contacted",
            do_not_contact: false,
            client_id: CLIENT_ID_DEFAULT,
            client_project_id: CLIENT_PROJECT_ID_DEFAULT,
            normalized_email: normalizeEmail(wl.email) || "",
            normalized_phone: normalizePhone(wl.phone_number || wl.phone) || "",
            normalized_business_name: normalizeBusinessName(wl.business_name) || "",
          };

          try {
            const newLead = await svc.entities.Leads.create(newLeadData);
            linkedLeadId = newLead.id;
            update.crm_lead_id = newLead.id;
            counts.leads_created++;
            if (sampleCreatedLeadIds.length < 5) sampleCreatedLeadIds.push(newLead.id);

            // Add to lookup maps so subsequent matches find this new lead
            if (wl.email) crmByEmail.set(wl.email.toLowerCase().trim(), newLead);
            const phoneD = (wl.phone_number || wl.phone || "").replace(/\D/g, "");
            if (phoneD.length >= 7) crmByPhone.set(phoneD, newLead);
            crmByWebsiteLeadId.set(wl.id, newLead);
          } catch (err) {
            warnings.push(`Failed to create Leads record for WebsiteLead ${wl.id}: ${err.message}`);
          }
        }
      }

      // Apply WebsiteLead update if there are changes
      if (Object.keys(update).length > 0) {
        try {
          await svc.entities.WebsiteLead.update(wl.id, update);
          counts.website_leads_updated++;
          if (sampleUpdatedIds.length < 10) sampleUpdatedIds.push(wl.id);
        } catch (err) {
          warnings.push(`Failed to update WebsiteLead ${wl.id}: ${err.message}`);
        }
      }
    }

    // ── Determine safety to continue ──
    const safeToContinue = counts.missing_identity_blocked === 0 || counts.production_eligible === 0;
    if (counts.missing_identity_blocked > 0) {
      blockers.push(`${counts.missing_identity_blocked} record(s) have no usable identity — cannot route`);
    }

    const evidenceSummary = JSON.stringify({
      total: counts.total_scanned,
      production_eligible: counts.production_eligible,
      internal_test: counts.internal_test_skipped,
      updated: counts.website_leads_updated,
      crm_links: counts.crm_links_created,
      leads_created: counts.leads_created,
      no_provider_calls: true,
      no_records_deleted: true,
      no_consent_changes: true,
      mode: "applied",
    });

    // ── Write LeadRoutingBackfillResult (applied record) ──
    let resultRecordId = null;
    try {
      const resultRecord = await svc.entities.LeadRoutingBackfillResult.create({
        run_at: now,
        mode: "applied",
        total_scanned: counts.total_scanned,
        production_eligible: counts.production_eligible,
        internal_test_skipped: counts.internal_test_skipped,
        missing_identity_blocked: counts.missing_identity_blocked,
        website_leads_updated: counts.website_leads_updated,
        crm_links_created: counts.crm_links_created,
        leads_created: counts.leads_created,
        leads_updated: counts.leads_updated,
        blockers,
        warnings,
        evidence_summary: evidenceSummary,
        sample_updated_ids: sampleUpdatedIds,
        sample_skipped_ids: sampleSkippedIds,
        sample_created_lead_ids: sampleCreatedLeadIds,
        safe_to_continue_to_next_phase: safeToContinue,
        run_by: ownerEmail,
      });
      resultRecordId = resultRecord.id;
    } catch (err) {
      warnings.push(`Failed to write LeadRoutingBackfillResult: ${err.message}`);
    }

    return Response.json({
      success: true,
      mode: "applied",
      run_at: now,
      no_provider_calls: true,
      no_records_deleted: true,
      no_consent_changes: true,
      no_automation_triggered: true,
      counts,
      blockers,
      warnings,
      sample_updated_ids: sampleUpdatedIds,
      sample_skipped_ids: sampleSkippedIds,
      sample_created_lead_ids: sampleCreatedLeadIds,
      safe_to_continue_to_next_phase: safeToContinue,
      result_record_id: resultRecordId,
      evidence_summary: evidenceSummary,
      next_step: blockers.length > 0
        ? "Review blocked records — add identity or exclude, then re-run"
        : "Lead routing + CRM linkage complete — next: clean failed/stale jobs and pending dead letters",
    });
  } catch (error) {
    console.error("[applyLeadRoutingBackfillSafe] error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});