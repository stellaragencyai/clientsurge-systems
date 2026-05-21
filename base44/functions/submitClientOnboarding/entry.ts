import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  ClientOnboardingAccessError,
  submitClientOnboardingAccess,
} from "../_shared/clientOnboardingAccess.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    if (req.method !== 'POST') {
      return secureJson({ error: 'Method not allowed' }, { status: 405 });
    }

    const data = await req.json();
    const result = await submitClientOnboardingAccess({
      base44,
      payload: data,
    });

    return secureJson(result);
  } catch (error) {
    if (error instanceof ClientOnboardingAccessError) {
      return secureJson({ error: error.message, code: error.code }, { status: error.status });
    }

    console.error('[submitClientOnboarding] Error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
