import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildWebsiteCopyFinalizerPrompt,
  inferAffectedWebsiteSections,
  mergeFinalizedWebsiteSections,
  parseMaybeJson,
} from "../_shared/websiteCopyFinalizer.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { spec_id, order_id } = await req.json().catch(() => ({}));
    const specId = spec_id || (await base44.asServiceRole.entities.WebsiteSpec.filter({ order_id }, "-created_date", 1).catch(() => []))[0]?.id;
    if (!specId) return Response.json({ error: "WebsiteSpec not found" }, { status: 404 });

    const spec = await base44.asServiceRole.entities.WebsiteSpec.get(specId).catch(() => null);
    if (!spec) return Response.json({ error: "WebsiteSpec not found" }, { status: 404 });
    const revisionNotes = spec.revision_notes || "";
    if (!revisionNotes.trim()) {
      return Response.json({ error: "revision_notes required" }, { status: 400 });
    }

    const pages = parseMaybeJson(spec.pages, []);
    const brand = parseMaybeJson(spec.brand, spec.brand || {});
    const normalizedSpec = { ...spec, pages, brand };
    const affectedSections = inferAffectedWebsiteSections(pages, revisionNotes);
    const sectionsToRevise = affectedSections.length ? affectedSections : ["hero"];

    const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildWebsiteCopyFinalizerPrompt({
        spec: normalizedSpec,
        affectedSections: sectionsToRevise,
        revisionNotes,
      }),
      response_json_schema: { type: "object" },
      model: "claude_sonnet_4_6",
    });

    const finalizedSections = Array.isArray(generated?.sections) ? generated.sections : [];
    const updatedPages = mergeFinalizedWebsiteSections(pages, finalizedSections);
    const now = new Date().toISOString();

    await base44.asServiceRole.entities.WebsiteSpec.update(specId, {
      pages: JSON.stringify(updatedPages),
      status: "approved",
      revision_requested: false,
      revision_finalized_at: now,
      approved_at: now,
    });

    if (spec.order_id || order_id) {
      await base44.asServiceRole.entities.Order.update(spec.order_id || order_id, {
        workflow_stage: "Website Approved",
      }).catch(() => {});
    }

    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id: spec.order_id || order_id || null,
      context_type: "website_spec",
      context_id: specId,
      channel: "internal",
      direction: "system",
      event_type: "ai_generated",
      provider: "internal",
      status: "processed",
      subject: "Website copy revision finalized",
      metadata_json: JSON.stringify({
        affected_sections: sectionsToRevise,
        finalized_section_count: finalizedSections.length,
        finalized_by: user.email,
      }),
    }).catch(() => {});

    return Response.json({ success: true, spec_id: specId, affected_sections: sectionsToRevise, finalized_section_count: finalizedSections.length });
  } catch (error) {
    console.error("[aiWebsiteCopyFinalizer]", error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
