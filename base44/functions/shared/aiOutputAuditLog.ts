/**
 * aiOutputAuditLog.ts — #478
 * Every LLM call writes to AgentLog: function_name, input_context, output_summary.
 * Import logAICall() in every function that calls OpenAI.
 */
import { scrubPII } from "./piiScrubber.ts";

export async function logAICall(
  base44: any,
  opts: {
    function_name: string;
    model: string;
    input_summary: string;
    output_summary: string;
    tokens_used?: number;
    order_id?: string;
    lead_id?: string;
    passed_guard?: boolean;
    guard_warnings?: string[];
  }
) {
  try {
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: opts.function_name,
      log_type: "info",
      summary: `AI call: ${opts.function_name} | model: ${opts.model} | tokens: ${opts.tokens_used || "?"}`,
      details: JSON.stringify({
        input: scrubPII(opts.input_summary).slice(0, 500),
        output: scrubPII(opts.output_summary).slice(0, 500),
        passed_guard: opts.passed_guard ?? true,
        guard_warnings: opts.guard_warnings || [],
        order_id: opts.order_id,
        lead_id: opts.lead_id,
      }),
      service: "openai",
      requires_nolan: (opts.passed_guard === false),
      resolved: (opts.passed_guard !== false),
    });
  } catch {
    // Never throw from audit log — fire and forget
  }
}
