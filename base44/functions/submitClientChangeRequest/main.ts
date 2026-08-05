import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.41";
import { AuthGuardError, requireAuthenticatedUser } from "../_shared/authGuards.js";

const TARGETS = {
  ClientProject: new Set([
    "booking_link",
    "onboarding_wizard_completed",
    "plan_change_request",
  ]),
  AutomationChecklist: new Set([
    "client_approved",
    "failure_notes",
    "review_link_set",
  ]),
  AutomationChecklistStep: new Set([
    "notes",
  ]),
} as const;

const MAX_REASON_LENGTH = 2000;
const MAX_CHANGE_KEYS = 12;

class ChangeRequestError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "invalid_change_request") {
    super(message);
    this.name = "ChangeRequestError";
    this.status = status;
    this.code = code;
  }
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function pickAllowedChanges(targetEntity: keyof typeof TARGETS, requestedChanges: unknown) {
  if (!isRecord(requestedChanges)) {
    throw new ChangeRequestError("requested_changes must be an object");
  }

  const allowed = TARGETS[targetEntity];
  const entries = Object.entries(requestedChanges)
    .filter(([key, value]) => allowed.has(key) && value !== undefined)
    .slice(0, MAX_CHANGE_KEYS);

  if (entries.length === 0) {
    throw new ChangeRequestError("No allowed changes were requested");
  }

  return Object.fromEntries(entries);
}

function userOwnsTarget(user: Record<string, unknown>, target: Record<string, unknown>) {
  const userEmail = normalizeEmail(user.email);
  const userClientId = String(user.client_id || user.clientId || "").trim();

  const targetEmail = normalizeEmail(target.client_email || target.contact_email || target.requested_by_email);
  const targetClientId = String(target.client_id || "").trim();

  return Boolean(
    (userEmail && targetEmail && userEmail === targetEmail) ||
      (userClientId && targetClientId && userClientId === targetClientId)
  );
}

function summarizeTarget(target: Record<string, unknown>) {
  return {
    id: target.id,
    client_id: target.client_id,
    client_project_id: target.client_project_id,
    client_email: target.client_email,
    business_name: target.business_name,
    status: target.status || target.client_project_status,
    updated_date: target.updated_date,
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAuthenticatedUser(base44);
    const payload = await req.json().catch(() => ({}));

    const targetEntity = String(payload.target_entity || "") as keyof typeof TARGETS;
    if (!TARGETS[targetEntity]) {
      throw new ChangeRequestError("Unsupported target_entity");
    }

    const targetId = String(payload.target_id || "").trim();
    if (!targetId) {
      throw new ChangeRequestError("target_id is required");
    }

    const target = await base44.asServiceRole.entities[targetEntity]
      .get(targetId)
      .catch(() => null);

    if (!target) {
      throw new ChangeRequestError("Target record was not found", 404, "target_not_found");
    }

    if (!userOwnsTarget(user as Record<string, unknown>, target as Record<string, unknown>)) {
      throw new ChangeRequestError("You can only request changes for your own project", 403, "target_not_owned");
    }

    const requestedChanges = pickAllowedChanges(targetEntity, payload.requested_changes);
    const requestReason = String(payload.request_reason || "").trim().slice(0, MAX_REASON_LENGTH);
    const userEmail = normalizeEmail((user as Record<string, unknown>).email);

    const changeRequest = await base44.asServiceRole.entities.ClientChangeRequest.create({
      target_entity: targetEntity,
      target_id: targetId,
      requested_changes: requestedChanges,
      request_reason: requestReason,
      requested_by_user_id: String((user as Record<string, unknown>).id || ""),
      requested_by_email: userEmail,
      client_id: String((target as Record<string, unknown>).client_id || ""),
      client_project_id: String(
        (target as Record<string, unknown>).client_project_id ||
          (targetEntity === "ClientProject" ? targetId : "")
      ),
      status: "pending",
      target_snapshot: summarizeTarget(target as Record<string, unknown>),
      source_route: String(payload.source_route || "").slice(0, 300),
    });

    return secureJson({
      success: true,
      status: "pending_review",
      request: changeRequest,
    });
  } catch (error) {
    if (error instanceof AuthGuardError || error instanceof ChangeRequestError) {
      return secureJson(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("[submitClientChangeRequest] failed:", error);
    return secureJson({ error: "Unable to submit change request" }, { status: 500 });
  }
});
