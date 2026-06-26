import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * regenerateWebsiteSections — #442
 * AI website copy finalizer: if client submitted revision_notes,
 * AI regenerates ONLY the affected sections, re-saves to WebsiteSpec,
 * and marks status = "approved".
 *
 * Payload: { spec_id } or { order_id }
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return json({ error: "Admin access required" }, 403);
    }

    const { spec_id, order_id } = await req.json().catch(() => ({}));

    let specId = spec_id;
    if (!specId && order_id) {
      const existing = await base44.asServiceRole.entities.WebsiteSpec.filter({ order_id }).catch(() => []);
      specId = existing?.[0]?.id;
    }
    if (!specId) return json({ error: "WebsiteSpec not found" }, 404);

    const spec = await base44.asServiceRole.entities.WebsiteSpec.get(specId).catch(() => null);
    if (!spec) return json({ error: "Spec not found" }, 404);

    if (!spec.revision_requested || !spec.revision_notes) {
      return json({ error: "No revision notes found on this spec" }, 400);
    }

    let pages = typeof spec.pages === "string" ? JSON.parse(spec.pages) : spec.pages;
    const brand = typeof spec.brand === "string" ? JSON.parse(spec.brand) : spec.brand;
    const revisionNotes = spec.revision_notes;

    // Ask AI to identify which sections need regeneration based on revision notes
    const sectionAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a website copy editor. A client submitted revision notes for their website spec.

Revision notes: "${revisionNotes}"

Current pages and sections:
${JSON.stringify(pages, null, 2)}

Identify which specific sections need copy regeneration based on the revision notes.
Return JSON with the page index, section index, and reason for each section that needs updating.
Only include sections that actually need changes based on the notes.

Return ONLY valid JSON:
{
  "sections_to_regenerate": [
    { "page_index": 0, "section_index": 0, "reason": "why this section needs updating" }
  ]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          sections_to_regenerate: {
            type: "array",
            items: {
              type: "object",
              properties: {
                page_index: { type: "number" },
                section_index: { type: "number" },
                reason: { type: "string" },
              },
            },
          },
        },
      },
    });

    const sectionsToRegen = sectionAnalysis?.sections_to_regenerate || [];
    const regeneratedSections = [];

    // Regenerate each identified section
    for (const target of sectionsToRegen) {
      const page = pages[target.page_index];
      const section = page?.sections?.[target.section_index];
      if (!page || !section) continue;

      const regenerated = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a website copywriter for ${brand?.business_name || "a local service business"}.
Industry: ${spec.industry}. Brand color: ${brand?.primary_color || "#00AEEF"}.

A client requested these revisions: "${revisionNotes}"

Current section copy:
${JSON.stringify(section, null, 2)}

Regenerate ONLY this section's copy to address the revision notes.
Keep the same JSON structure but update the copy_blocks, cta, or other text fields.
Do not change the section type or add new fields.

Return ONLY the updated section JSON object.`,
        response_json_schema: {
          type: "object",
          properties: {
            type: { type: "string" },
            copy_blocks: { type: "object" },
            cta: { type: "string" },
          },
        },
      });

      if (regenerated) {
        pages[target.page_index].sections[target.section_index] = {
          ...section,
          ...regenerated,
        };
        regeneratedSections.push({
          page: page.name,
          section_index: target.section_index,
          reason: target.reason,
        });
      }
    }

    // Save updated pages back to WebsiteSpec, mark as approved
    await base44.asServiceRole.entities.WebsiteSpec.update(specId, {
      pages: JSON.stringify(pages),
      status: "approved",
      revision_requested: false,
      revision_notes: "",
      revised_at: new Date().toISOString(),
    });

    // Log the revision
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      order_id: spec.order_id,
      subject: `Website spec revised: ${regeneratedSections.length} sections regenerated`,
      message_body: `Revision notes: "${revisionNotes.slice(0, 200)}". Sections updated: ${regeneratedSections.map(s => `${s.page}[${s.section_index}]`).join(", ")}`,
      environment: "production",
    }).catch(() => {});

    console.log(`[regenerateWebsiteSections] Revised ${regeneratedSections.length} sections for spec ${specId}`);

    return json({
      success: true,
      spec_id: specId,
      sections_regenerated: regeneratedSections.length,
      sections: regeneratedSections,
    });
  } catch (err) {
    console.error("[regenerateWebsiteSections]", err.message);
    return json({ error: err.message }, 500);
  }
});