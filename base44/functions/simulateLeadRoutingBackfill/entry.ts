/**
 * simulateLeadRoutingBackfill — Non-sending, non-destructive simulation of
 * lead routing + CRM linkage backfill for WebsiteLead records.
 *
 * Does NOT modify any records. Does NOT send messages. Does NOT call external providers.
 *
 * Outputs counts and sample IDs for:
 *   - records that would receive client_id = clientsurge_system
 *   - records that would receive client_project_id = clientsurge_public_site
 *   - records that would receive dedup_key
 *   - records that would be linked to existing Leads records
 *   - records that would create a new canonical Leads record
 *   - records blocked because internal/test/QA
 *   - records blocked because no usable identity
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

// ── Deterministic internal/test classifier ──
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

// ── Normalization helpers ──
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const ownerEmail = user.email || "";

    // ── Fetch WebsiteLead records (paginated safety: 500 max) ──
    const websiteLeads = await svc.entities.WebsiteLead.list("", 500).catch(() => []);

    // ── Fetch Leads records for matching ──
    const crmLeads = await svc.entities.Leads.list("", 500).catch(() => []);

    // Build lookup maps for CRM matching
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

    const now = new Date().toISOString();
    const counts = {
      total: (websiteLeads || []).length,
      production_eligible: 0,
      internal_test: 0,
      missing_identity_blocked: 0,
      would_receive_client_id: 0,
      would_receive_client_project_id: 0,
      would_receive_dedup_key: 0,
      would_link_to_existing_lead: 0,
      would_create_new_lead: 0,
      already_linked_to_lead: 0,
      missing_client_id: 0,
      missing_client_project_id: 0,
      missing_dedup_key: 0,
      missing_crm_lead_id: 0,
      missing_email_and_phone: 0,
    };

    const samples = {
      would_receive_client_id: [],
      would_receive_client_project_id: [],
      would_receive_dedup_key: [],
      would_link_to_existing_lead: [],
      would_create_new_lead: [],
      internal_test_skipped: [],
      missing_identity_blocked: [],
    };

    const blockers = [];
    const warnings = [];

    for (const wl of (websiteLeads || [])) {
      const isInternal = classifyInternalTest(wl, ownerEmail);

      if (isInternal) {
        counts.internal_test++;
        if (samples.internal_test_skipped.length < 5) samples.internal_test_skipped.push(wl.id);
        continue;
      }

      if (!hasUsableIdentity(wl)) {
        counts.missing_identity_blocked++;
        if (samples.missing_identity_blocked.length < 5) samples.missing_identity_blocked.push(wl.id);
        continue;
      }

      counts.production_eligible++;

      const wouldReceiveClientId = !wl.client_id || wl.client_id === "";
      const wouldReceiveClientProjectId = !wl.client_project_id || wl.client_project_id === "";
      const dedupKey = generateDedupKey(wl);
      const wouldReceiveDedupKey = !wl.dedup_key && dedupKey;

      if (wouldReceiveClientId) {
        counts.would_receive_client_id++;
        if (samples.would_receive_client_id.length < 5) samples.would_receive_client_id.push(wl.id);
      }
      if (wouldReceiveClientProjectId) {
        counts.would_receive_client_project_id++;
        if (samples.would_receive_client_project_id.length < 5) samples.would_receive_client_project_id.push(wl.id);
      }
      if (wouldReceiveDedupKey) {
        counts.would_receive_dedup_key++;
        if (samples.would_receive_dedup_key.length < 5) samples.would_receive_dedup_key.push(wl.id);
      }

      if (!wl.client_id) counts.missing_client_id++;
      if (!wl.client_project_id) counts.missing_client_project_id++;
      if (!wl.dedup_key) counts.missing_dedup_key++;
      if (!wl.crm_lead_id) counts.missing_crm_lead_id++;
      if (!wl.email && !(wl.phone_number || wl.phone)) counts.missing_email_and_phone++;

      if (wl.crm_lead_id) {
        counts.already_linked_to_lead++;
      } else {
        // Try matching to existing Leads
        const emailMatch = wl.email ? crmByEmail.get(wl.email.toLowerCase().trim()) : null;
        const phoneDigits = (wl.phone_number || wl.phone || "").replace(/\D/g, "");
        const phoneMatch = phoneDigits.length >= 7 ? crmByPhone.get(phoneDigits) : null;
        const websiteLeadIdMatch = wl.id ? crmByWebsiteLeadId.get(wl.id) : null;
        const matchedLead = emailMatch || phoneMatch || websiteLeadIdMatch;

        if (matchedLead) {
          counts.would_link_to_existing_lead++;
          if (samples.would_link_to_existing_lead.length < 5) samples.would_link_to_existing_lead.push({ website_lead_id: wl.id, crm_lead_id: matchedLead.id });
        } else if (hasUsableIdentity(wl)) {
          counts.would_create_new_lead++;
          if (samples.would_create_new_lead.length < 5) samples.would_create_new_lead.push(wl.id);
        }
      }
    }

    // ── Determine safety ──
    const safeToContinue = counts.missing_client_id === counts.would_receive_client_id
      && counts.missing_client_project_id === counts.would_receive_client_project_id
      && counts.missing_dedup_key === counts.would_receive_dedup_key
      && counts.missing_identity_blocked === 0
      || counts.production_eligible === 0;

    if (counts.missing_identity_blocked > 0) {
      blockers.push(`${counts.missing_identity_blocked} record(s) have no usable email/phone/business identity — cannot route`);
    }

    const evidenceSummary = JSON.stringify({
      total: counts.total,
      production_eligible: counts.production_eligible,
      internal_test: counts.internal_test,
      would_update: counts.would_receive_client_id,
      would_link: counts.would_link_to_existing_lead,
      would_create: counts.would_create_new_lead,
      no_provider_calls: true,
      no_records_modified: true,
      mode: "simulation",
    });

    // ── Write LeadRoutingBackfillResult (simulation record) ──
    let resultRecordId = null;
    try {
      const resultRecord = await svc.entities.LeadRoutingBackfillResult.create({
        run_at: now,
        mode: "simulation",
        total_scanned: counts.total,
        production_eligible: counts.production_eligible,
        internal_test_skipped: counts.internal_test,
        missing_identity_blocked: counts.missing_identity_blocked,
        website_leads_updated: 0,
        crm_links_created: 0,
        leads_created: 0,
        leads_updated: 0,
        blockers,
        warnings,
        evidence_summary: evidenceSummary,
        sample_updated_ids: samples.would_receive_client_id,
        sample_skipped_ids: [...samples.internal_test_skipped, ...samples.missing_identity_blocked].slice(0, 10),
        sample_created_lead_ids: [],
        safe_to_continue_to_next_phase: safeToContinue,
        run_by: ownerEmail,
      });
      resultRecordId = resultRecord.id;
    } catch (err) {
      warnings.push(`Failed to write LeadRoutingBackfillResult: ${err.message}`);
    }

    return Response.json({
      success: true,
      mode: "simulation",
      run_at: now,
      no_provider_calls: true,
      no_records_modified: true,
      counts,
      samples,
      blockers,
      warnings,
      safe_to_continue_to_next_phase: safeToContinue,
      result_record_id: resultRecordId,
      evidence_summary: evidenceSummary,
      next_step: counts.missing_identity_blocked > 0
        ? "Review records with no usable identity — add email/phone/business_name or exclude"
        : counts.production_eligible > 0
          ? "Run applyLeadRoutingBackfillSafe to apply routing + CRM linkage"
          : "No production-eligible records to backfill — data hygiene complete",
    });
  } catch (error) {
    console.error("[simulateLeadRoutingBackfill] error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});