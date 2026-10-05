import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.41";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

const ALLOWED_ENTITIES = new Set([
  "AdminSettings",
  "Alert",
  "AuditLog",
  "AutomationChecklist",
  "AutomationChecklistStep",
  "AutomationExecutionLog",
  "AutomationJob",
  "AutomationProofLog",
  "AutomationRule",
  "AutomationRuleInsights",
  "ClientAccountConfig",
  "ClientDeployment",
  "ClientExperiencePortal",
  "ClientInstallationOS",
  "ClientProject",
  "CommunicationEvent",
  "ConversionFunnel",
  "DeadLetterLog",
  "EventQueue",
  "FailureRecoveryResult",
  "GrowthOptimizationSignal",
  "IdempotencyKey",
  "LandingPageAnalytics",
  "LaunchGate",
  "LeadRoutingBackfillResult",
  "Leads",
  "OnboardingOrchestration",
  "OptimizationAction",
  "OrchestrationWorkflow",
  "Order",
  "OutboundLead",
  "ProjectTask",
  "RevenueTracking",
  "SupportMessage",
  "WebsiteLead",
]);

const ALLOWED_FUNCTIONS = new Set([
  "getSalesAutomationMetrics",
]);

const ALLOWED_ENTITY_OPS = new Set([
  "list",
  "filter",
  "get",
  "create",
  "update",
  "delete",
]);

const MAX_LIMIT = 500;
const MAX_SKIP = 5000;

class GatewayError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "bad_gateway_request") {
    super(message);
    this.name = "GatewayError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clampInteger(value: unknown, fallback: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}

function normalizeSort(value: unknown) {
  return typeof value === "string" ? value.slice(0, 120) : "";
}

function normalizeQuery(value: unknown) {
  if (!isRecord(value)) return {};
  return value;
}

async function runEntityOperation(base44: any, payload: Record<string, unknown>) {
  const entityName = String(payload.entityName || "");
  const operation = String(payload.operation || "");
  const args = isRecord(payload.args) ? payload.args : {};

  if (!ALLOWED_ENTITIES.has(entityName)) {
    throw new GatewayError("Entity is not allowed", 403, "entity_not_allowed");
  }

  if (!ALLOWED_ENTITY_OPS.has(operation)) {
    throw new GatewayError("Entity operation is not allowed", 403, "operation_not_allowed");
  }

  const entity = base44.asServiceRole.entities[entityName];
  if (!entity) {
    throw new GatewayError("Entity is not available", 404, "entity_not_available");
  }

  const limit = clampInteger(args.limit, 50, MAX_LIMIT);
  const skip = clampInteger(args.skip, 0, MAX_SKIP);
  const sort = normalizeSort(args.sort);
  const id = String(args.id || "").trim();

  switch (operation) {
    case "list":
      return entity.list(sort, limit, skip);
    case "filter":
      return entity.filter(normalizeQuery(args.query), sort, limit, skip);
    case "get":
      if (!id) throw new GatewayError("id is required");
      return entity.get(id);
    case "create":
      if (!isRecord(args.data)) throw new GatewayError("data must be an object");
      return entity.create(args.data);
    case "update":
      if (!id) throw new GatewayError("id is required");
      if (!isRecord(args.data)) throw new GatewayError("data must be an object");
      return entity.update(id, args.data);
    case "delete":
      if (!id) throw new GatewayError("id is required");
      return entity.delete(id);
    default:
      throw new GatewayError("Unsupported operation");
  }
}

async function runFunctionOperation(base44: any, payload: Record<string, unknown>) {
  const functionName = String(payload.functionName || "");
  const functionPayload = isRecord(payload.payload) ? payload.payload : {};

  if (!ALLOWED_FUNCTIONS.has(functionName)) {
    throw new GatewayError("Function is not allowed", 403, "function_not_allowed");
  }

  const result = await base44.functions.invoke(functionName, functionPayload);
  return result?.data ?? result;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);
    const payload = await req.json().catch(() => ({}));

    const kind = String(payload.kind || "");
    const result =
      kind === "entity"
        ? await runEntityOperation(base44, payload)
        : kind === "function"
          ? await runFunctionOperation(base44, payload)
          : (() => {
              throw new GatewayError("kind must be entity or function");
            })();

    return secureJson({ success: true, result });
  } catch (error) {
    if (error instanceof AuthGuardError || error instanceof GatewayError) {
      return secureJson(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("[adminDataGateway] failed:", error);
    return secureJson({ error: "Admin data request failed" }, { status: 500 });
  }
});
