import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { secureJson } from "../_shared/response.ts";
import {
  LAUNCH_EMAIL_CAMPAIGNS,
  plainTextToSimpleHtml,
} from "../_shared/launchEmailCampaigns.js";

const APPLY_CONFIRMATION = "SEED LAUNCH EMAIL CAMPAIGNS";

function buildCampaignRecord(template) {
  return {
    tenant_scope_status: "system_internal",
    name: template.campaign_name,
    description: `Reviewed ClientSurge first-touch draft for ${template.label}. No unsupported performance claims.`,
    subject: template.subject,
    body_text: template.body_text,
    body_html: plainTextToSimpleHtml(template.body_text),
    status: "draft",
    industry_sequence: template.key,
    landing_page_url: template.landing_page_url,
    max_recipients: 25,
    follow_up_days: 3,
    segment_filters: {
      statuses: template.statuses,
      industries: template.industries,
      tags: template.tags,
      lead_score_min: 0,
      lead_score_max: 100,
      max_recipients: 25,
      outbound_ready_only: true,
      website_mode: "has_website",
    },
  };
}

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, comparable(nested)]),
    );
  }
  return value ?? null;
}

function changedFields(existing, target) {
  return Object.keys(target).filter(
    (key) => JSON.stringify(comparable(existing?.[key])) !== JSON.stringify(comparable(target[key])),
  );
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

    if (!dryRun && body?.confirm_phrase !== APPLY_CONFIRMATION) {
      return secureJson(
        {
          error: `confirm_phrase must equal "${APPLY_CONFIRMATION}" when dry_run is false`,
          code: "LAUNCH_CAMPAIGN_CONFIRMATION_REQUIRED",
        },
        { status: 400 },
      );
    }

    const results = [];
    for (const template of LAUNCH_EMAIL_CAMPAIGNS) {
      const target = buildCampaignRecord(template);
      const matches = await base44.asServiceRole.entities.EmailCampaign.filter(
        { name: target.name },
        "-created_date",
        10,
      );
      const existing = matches?.[0] || null;
      const duplicateIds = (matches || []).slice(1).map((record) => record.id);
      let action = "create";
      let fields = Object.keys(target);
      let reason = "missing_reviewed_draft";

      if (existing) {
        if (existing.status !== "draft") {
          action = "skip";
          fields = [];
          reason = `existing_campaign_status_${existing.status}`;
        } else {
          fields = changedFields(existing, target);
          action = fields.length ? "update" : "unchanged";
          reason = fields.length ? "draft_requires_sync" : "draft_already_current";
        }
      }

      if (!dryRun && action === "create") {
        await base44.asServiceRole.entities.EmailCampaign.create(target);
      } else if (!dryRun && action === "update") {
        await base44.asServiceRole.entities.EmailCampaign.update(existing.id, target);
      }

      results.push({
        industry_sequence: template.key,
        campaign_name: target.name,
        action,
        reason,
        changed_fields: fields,
        existing_id: existing?.id || null,
        duplicate_record_ids: duplicateIds,
      });
    }

    const summary = {
      dry_run: dryRun,
      create: results.filter((item) => item.action === "create").length,
      update: results.filter((item) => item.action === "update").length,
      unchanged: results.filter((item) => item.action === "unchanged").length,
      skipped: results.filter((item) => item.action === "skip").length,
      duplicate_records_found: results.reduce(
        (total, item) => total + item.duplicate_record_ids.length,
        0,
      ),
      sends_triggered: 0,
      results,
      completed_at: new Date().toISOString(),
    };

    return secureJson({
      success: true,
      message: dryRun
        ? "Launch campaign draft audit completed; no records or emails were changed"
        : "Reviewed launch campaign drafts synchronized; no emails were sent",
      apply_confirmation_phrase: dryRun ? APPLY_CONFIRMATION : undefined,
      summary,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson({ error: error.message, code: error.code }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Launch campaign seeding failed";
    console.error("[seedLaunchEmailCampaigns]", message);
    return secureJson({ error: message }, { status: 500 });
  }
});
