/**
 * DEPRECATED: enrichLeadWithAI
 * Consolidated into enrichLead — use that function instead.
 * This stub exists to prevent 404s on any stale references.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  console.warn("[enrichLeadWithAI] DEPRECATED — forwarding to enrichLead");
  try {
    const body = await req.json().catch(() => ({}));
    // Forward to enrichLead
    const enrichLeadUrl = req.url.replace("enrichLeadWithAI", "enrichLead");
    const response = await fetch(enrichLeadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": req.headers.get("Authorization") || "" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return Response.json({ ...result, _forwarded_from: "enrichLeadWithAI" });
  } catch (err) {
    return Response.json({ error: "Forwarding failed", detail: err.message }, { status: 500 });
  }
});
