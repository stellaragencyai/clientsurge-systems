import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

function safeParseMetadata(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch (_) {
    return {};
  }
}

function isLeadNote(event) {
  if (!event) return false;
  const metadata = safeParseMetadata(event.metadata_json);
  return (
    event.channel === "internal" &&
    event.event_type === "status_update" &&
    metadata.entry_kind === "lead_note"
  );
}

function normalizeLeadNote(event) {
  const metadata = safeParseMetadata(event.metadata_json);
  return {
    id: event.id,
    lead_id: event.lead_id,
    text: event.message_body || "",
    created_date: event.created_date,
    created_by: metadata.created_by || null,
    deleted_at: metadata.deleted_at || null,
    deleted_by: metadata.deleted_by || null,
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);
    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "list";

    if (action === "list") {
      const leadId = body?.lead_id ?? null;
      if (!leadId) {
        return Response.json({ error: "lead_id is required" }, { status: 400 });
      }

      const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { lead_id: leadId, channel: "internal", event_type: "status_update" },
        "-created_date",
        200
      );

      const notes = (events || [])
        .filter((event) => isLeadNote(event))
        .map((event) => normalizeLeadNote(event))
        .filter((note) => !note.deleted_at);

      return Response.json({ success: true, notes });
    }

    if (action === "create") {
      const leadId = body?.lead_id ?? null;
      const text = typeof body?.text === "string" ? body.text.trim() : "";

      if (!leadId) {
        return Response.json({ error: "lead_id is required" }, { status: 400 });
      }

      if (!text) {
        return Response.json({ error: "text is required" }, { status: 400 });
      }

      const noteEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: leadId,
        channel: "internal",
        direction: "system",
        event_type: "status_update",
        provider: "internal",
        status: "processed",
        subject: "Lead note added",
        message_body: text,
        metadata_json: JSON.stringify({
          entry_kind: "lead_note",
          created_by: user.email,
          created_at: new Date().toISOString(),
        }),
      });

      return Response.json({ success: true, note: normalizeLeadNote(noteEvent) });
    }

    if (action === "delete") {
      const noteId = body?.note_id ?? null;
      if (!noteId) {
        return Response.json({ error: "note_id is required" }, { status: 400 });
      }

      const existing = await base44.asServiceRole.entities.CommunicationEvent.get(noteId);
      if (!isLeadNote(existing)) {
        return Response.json({ error: "Lead note not found" }, { status: 404 });
      }

      const metadata = safeParseMetadata(existing.metadata_json);
      if (metadata.deleted_at) {
        return Response.json({ success: true, deleted: true });
      }

      const deletedAt = new Date().toISOString();

      await base44.asServiceRole.entities.CommunicationEvent.update(noteId, {
        metadata_json: JSON.stringify({
          ...metadata,
          deleted_at: deletedAt,
          deleted_by: user.email,
        }),
      });

      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: existing.lead_id,
        channel: "internal",
        direction: "system",
        event_type: "status_update",
        provider: "internal",
        status: "processed",
        subject: "Lead note deleted",
        message_body: "A CRM drawer note was deleted.",
        metadata_json: JSON.stringify({
          entry_kind: "lead_note_deletion",
          deleted_note_id: noteId,
          deleted_by: user.email,
          deleted_at: deletedAt,
        }),
      });

      return Response.json({ success: true, deleted: true });
    }

    return Response.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("manageLeadNotes error:", error);
    if (error instanceof AuthGuardError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return Response.json({ error: error.message || "Failed to manage lead notes" }, { status: 500 });
  }
});
