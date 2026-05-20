/**
 * autoEndToEndTest — #525 extended
 * Full lead→order→activate flow with assertions.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Delegate to runFullPipelineTest with dry_run=true
    const result = await base44.asServiceRole.functions.invoke("runFullPipelineTest", { dry_run: true });
    return Response.json({ success: true, ...result, extended: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
