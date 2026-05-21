import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmailInput(value: unknown) {
  const trimmed = cleanString(value);
  if (!trimmed) {
    return "";
  }

  const normalized = trimmed.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Email address must be valid.");
  }

  return normalized;
}

function normalizeDateInput(value: unknown, fieldLabel: string) {
  const trimmed = cleanString(value);
  if (!trimmed) {
    return "";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`${fieldLabel} must use YYYY-MM-DD format.`);
  }

  const [yearText, monthText, dayText] = trimmed.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`${fieldLabel} is not a valid date.`);
  }

  return trimmed;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return secureJson({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const contactEmail = normalizeEmailInput(payload?.contact_email);
    const timelinePersonName = cleanString(payload?.timeline_person_name).slice(0, 120);
    const timelineBirthDate = normalizeDateInput(payload?.timeline_birth_date, "Birth date");
    const timelineDeathDate = normalizeDateInput(payload?.timeline_death_date, "Death date");

    if (timelineBirthDate && timelineDeathDate && timelineDeathDate < timelineBirthDate) {
      return secureJson(
        { error: "Death date must be later than or equal to birth date." },
        { status: 400 }
      );
    }

    const resolution = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    if (resolution.status !== "resolved" || !resolution.project?.id) {
      return secureJson({ error: "No portal project is linked to this account yet." }, { status: 404 });
    }

    const updatedProject = await base44.asServiceRole.entities.ClientProject.update(
      resolution.project.id,
      {
        contact_email: contactEmail,
        timeline_person_name: timelinePersonName,
        timeline_birth_date: timelineBirthDate,
        timeline_death_date: timelineDeathDate,
      }
    );

    return secureJson({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update portal timeline";
    return secureJson({ error: message }, { status: 500 });
  }
});
