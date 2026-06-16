import { secureJson } from "../_shared/response.ts";
/**
 * classifyInstallError — #497
 * Reads AgentLog entries with log_type="error" and classifies them.
 * Categories: credential_missing | service_config_fail | stripe_issue |
 *             twilio_issue | openai_fail | unknown
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const ERROR_PATTERNS: Record<string, RegExp[]> = {
  credential_missing: [/missing.*credential/i, /required field/i, /no.*phone/i, /no.*booking/i],
  service_config_fail: [/configureService/i, /install.*fail/i, /activation.*error/i],
  stripe_issue: [/stripe/i, /payment.*fail/i, /webhook.*stripe/i, /invoice.*failed/i],
  twilio_issue: [/twilio/i, /sms.*fail/i, /number.*not.*found/i, /21/i],
  openai_fail: [/openai/i, /llm/i, /completion.*fail/i, /model.*error/i],
};

function classifyError(summary: string, details: string): string {
  const text = `${summary} ${details}`.toLowerCase();
  for (const [category, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (patterns.some(p => p.test(text))) return category;
  }
  return "unknown";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { limit = 50 } = await req.json().catch(() => ({}));

    const logs = await base44.asServiceRole.entities.AgentLog
      .filter({ log_type: "error", resolved: false }).catch(() => []);

    const classified = (logs || []).slice(0, limit).map((log: any) => ({
      id: log.id,
      agent: log.agent_name,
      category: classifyError(log.summary || "", log.details || ""),
      summary: log.summary,
      service: log.service,
      created: log.created_date,
      requires_nolan: log.requires_nolan,
    }));

    const breakdown = classified.reduce((acc: any, l: any) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {});

    return secureJson({ success: true, total: classified.length, breakdown, errors: classified });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
