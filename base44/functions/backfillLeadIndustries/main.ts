import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { secureJson } from "../_shared/response.ts";
import {
  buildIndustryDataQualityFlags,
  classifyLeadIndustry,
  serializeIndustryClassification,
} from "../_shared/industryClassifier.ts";

const MAX_RECORDS = 10_000;
const MAX_BATCH_SIZE = 500;
const CHANGE_SAMPLE_LIMIT = 100;

function positiveInteger(value, fallback, max) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}

function normalizedTags(existingTags, canonicalLabel) {
  const values = Array.isArray(existingTags) ? existingTags.filter(Boolean).map(String) : [];
  const seen = new Set();
  const output = [];
  for (const value of [canonicalLabel, ...values]) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(value.trim());
  }
  return output.slice(0, 8);
}

function arraysEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function buildUpdate(lead, classification, now) {
  const targetIndustry = classification.status === "classified"
    ? classification.industry_label
    : classification.status === "excluded_test"
      ? "Internal Test / Excluded"
      : "Needs Manual Review";

  const flags = buildIndustryDataQualityFlags(lead.data_quality_flags, classification);
  const update = {
    id: lead.id,
    industry: targetIndustry,
    assigned_agent_name: classification.routing.agent_name,
    industry_tags: normalizedTags(lead.industry_tags, targetIndustry),
    ai_last_classification: serializeIndustryClassification(classification),
    ai_confidence: classification.confidence,
    data_quality_flags: flags,
    data_quality_checked_at: now,
    audited_at: now,
  };

  const changed =
    lead.industry !== update.industry ||
    lead.assigned_agent_name !== update.assigned_agent_name ||
    lead.ai_last_classification !== update.ai_last_classification ||
    Number(lead.ai_confidence || 0) !== update.ai_confidence ||
    !arraysEqual(lead.industry_tags || [], update.industry_tags) ||
    !arraysEqual(lead.data_quality_flags || [], update.data_quality_flags);

  return { update, changed };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run !== false;
    const startOffset = positiveInteger(body?.offset, 0, MAX_RECORDS);
    const requestedLimit = positiveInteger(body?.limit, MAX_RECORDS, MAX_RECORDS);
    const batchSize = Math.max(1, positiveInteger(body?.batch_size, MAX_BATCH_SIZE, MAX_BATCH_SIZE));
    const now = new Date().toISOString();

    const summary = {
      dry_run: dryRun,
      scanned: 0,
      changed: 0,
      unchanged: 0,
      classified: 0,
      review_required: 0,
      excluded_test: 0,
      failed: 0,
      offset: startOffset,
      requested_limit: requestedLimit,
      category_counts: {},
      previous_industry_counts: {},
      changes_by_previous_industry: {},
      change_sample: [],
      completed_at: null,
      has_more: false,
    };

    let cursor = startOffset;
    let remaining = requestedLimit;

    while (remaining > 0) {
      const take = Math.min(batchSize, remaining);
      const leads = await base44.asServiceRole.entities.Leads.list("-created_date", take, cursor);
      if (!Array.isArray(leads) || leads.length === 0) break;

      const pendingUpdates = [];

      for (const lead of leads) {
        summary.scanned += 1;
        const previousIndustry = lead.industry || "(missing)";
        summary.previous_industry_counts[previousIndustry] = (summary.previous_industry_counts[previousIndustry] || 0) + 1;

        try {
          const classification = classifyLeadIndustry(lead);
          summary[classification.status] += 1;
          summary.category_counts[classification.industry_label] = (summary.category_counts[classification.industry_label] || 0) + 1;

          const { update, changed } = buildUpdate(lead, classification, now);
          if (!changed) {
            summary.unchanged += 1;
            continue;
          }

          summary.changed += 1;
          summary.changes_by_previous_industry[previousIndustry] = (summary.changes_by_previous_industry[previousIndustry] || 0) + 1;
          pendingUpdates.push(update);

          if (summary.change_sample.length < CHANGE_SAMPLE_LIMIT) {
            summary.change_sample.push({
              id: lead.id,
              business_name: lead.business_name,
              previous_industry: previousIndustry,
              new_industry: update.industry,
              status: classification.status,
              confidence: classification.confidence,
              reason: classification.reason,
            });
          }
        } catch (error) {
          summary.failed += 1;
          console.error(`[backfillLeadIndustries] Failed to classify ${lead.id}:`, error);
        }
      }

      if (!dryRun && pendingUpdates.length > 0) {
        for (let index = 0; index < pendingUpdates.length; index += MAX_BATCH_SIZE) {
          await base44.asServiceRole.entities.Leads.bulkUpdate(
            pendingUpdates.slice(index, index + MAX_BATCH_SIZE),
          );
        }
      }

      cursor += leads.length;
      remaining -= leads.length;
      if (leads.length < take) break;
    }

    if (remaining === 0) {
      const probe = await base44.asServiceRole.entities.Leads.list("-created_date", 1, cursor);
      summary.has_more = Array.isArray(probe) && probe.length > 0;
    }

    summary.completed_at = new Date().toISOString();

    return secureJson({
      success: true,
      message: dryRun
        ? "Industry backfill audit completed; no records were changed"
        : "Industry backfill completed",
      summary,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson({ error: error.message, code: error.code }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Lead industry backfill failed";
    console.error("[backfillLeadIndustries]", error);
    return secureJson({ error: message }, { status: 500 });
  }
});
