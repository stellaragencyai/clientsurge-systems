import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const ALLOWED_CATEGORIES = new Set([
  "logo",
  "photo",
  "credentials",
  "document",
  "other",
]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCategory(value) {
  const category = cleanString(value);
  return ALLOWED_CATEGORIES.has(category) ? category : "other";
}

function normalizeFileUrl(value) {
  const fileUrl = cleanString(value);
  if (!fileUrl) {
    throw new Error("file_url required");
  }

  try {
    const parsed = new URL(fileUrl);
    if (!["https:", "http:"].includes(parsed.protocol)) {
      throw new Error("File URL must be http or https.");
    }
  } catch {
    throw new Error("file_url must be a valid URL");
  }

  return fileUrl;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return secureJson({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    if (access.status !== "resolved" || !access.project?.id) {
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const fileUrl = normalizeFileUrl(body?.file_url);
    const fileRecord = {
      id: `portal-file-${crypto.randomUUID()}`,
      name: cleanString(body?.name).slice(0, 260) || "Uploaded file",
      file_url: fileUrl,
      file_type: cleanString(body?.file_type).slice(0, 120) || "application/octet-stream",
      category: normalizeCategory(body?.category),
      uploaded_at: new Date().toISOString(),
      note: cleanString(body?.note).slice(0, 500) || null,
    };

    const currentProject = await base44.asServiceRole.entities.ClientProject.get(access.project.id);
    const existingFiles = Array.isArray(currentProject?.files) ? currentProject.files : [];

    const updatedProject = await base44.asServiceRole.entities.ClientProject.update(access.project.id, {
      files: [...existingFiles, fileRecord],
    });

    return secureJson({
      success: true,
      file: fileRecord,
      project: updatedProject,
      file_count: Array.isArray(updatedProject?.files) ? updatedProject.files.length : existingFiles.length + 1,
    });
  } catch (error) {
    console.error("[clientPortalProjectFiles] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
