import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const MAX_MESSAGES = 100;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function safeFilter(collection, query, sort = "created_date", limit = 25) {
  try {
    const results = await collection.filter(query, sort, limit);
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

async function markAdminMessagesRead(base44, messages) {
  const unreadAdminMessages = messages.filter((message) => message.role === "admin" && !message.read);
  await Promise.all(
    unreadAdminMessages.map((message) =>
      base44.asServiceRole.entities.SupportMessage.update(message.id, { read: true }).catch(() => null)
    )
  );
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
    const action = cleanString(body?.action) || "load";
    const projectId = access.project.id;

    if (action === "send") {
      const message = cleanString(body?.message);
      if (!message) {
        return secureJson({ error: "message required" }, { status: 400 });
      }

      await base44.asServiceRole.entities.SupportMessage.create({
        project_id: projectId,
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        role: "client",
        message,
        read: false,
      });
    } else if (action === "mark_read") {
      const messages = await safeFilter(
        base44.asServiceRole.entities.SupportMessage,
        { project_id: projectId },
        "created_date",
        MAX_MESSAGES
      );
      await markAdminMessagesRead(base44, messages);
    } else if (action !== "load") {
      return secureJson({ error: "Unsupported action" }, { status: 400 });
    }

    const messages = await safeFilter(
      base44.asServiceRole.entities.SupportMessage,
      { project_id: projectId },
      "created_date",
      MAX_MESSAGES
    );
    const unread_admin = messages.filter((message) => message.role === "admin" && !message.read).length;

    return secureJson({
      success: true,
      project_id: projectId,
      messages,
      unread_admin,
    });
  } catch (error) {
    console.error("[clientPortalSupportMessages] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
