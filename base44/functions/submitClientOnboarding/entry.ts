import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  ClientOnboardingAccessError,
  submitClientOnboardingAccess,
} from "../_shared/clientOnboardingAccess.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const data = await req.json();
    const result = await submitClientOnboardingAccess({
      base44,
      payload: data,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof ClientOnboardingAccessError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }

    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
