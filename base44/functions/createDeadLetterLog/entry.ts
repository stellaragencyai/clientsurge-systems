/**
 * Initialize or verify DeadLetterLog entity exists
 * Call once during system startup to ensure the schema is in place
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Try to read schema; if it fails, the entity doesn't exist yet
    // This is informational - the entity must be created via the UI/schema editor
    try {
      const schema = await base44.asServiceRole.entities.DeadLetterLog.schema();
      return Response.json({ status: 'exists', schema });
    } catch (err) {
      return Response.json({
        status: 'not_found',
        message: 'DeadLetterLog entity does not exist yet. Create it via the Base44 UI with the DeadLetterLog schema.',
        error: err.message,
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});