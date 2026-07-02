import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  ClientOnboardingAccessError,
  submitClientOnboardingAccess,
} from "../_shared/clientOnboardingAccess.js";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  try {
    const base44 = createClientFromRequest(req);
    
    if (req.method !== 'POST') {
      return secureJson(
        {
          error: 'Method not allowed',
          code: 'method_not_allowed',
          request_id: requestId,
        },
        { status: 405 }
      );
    }

    const data = await req.json();
    const result = await submitClientOnboardingAccess({
      base44,
      payload: data,
    });

    return secureJson({ ...result, request_id: requestId });
  } catch (error) {
    if (error instanceof ClientOnboardingAccessError) {
      return secureJson(
        {
          error: error.message,
          code: error.code,
          request_id: requestId,
        },
        { status: error.status }
      );
    }

    console.error('[submitClientOnboarding] Unexpected error', {
      requestId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return secureJson(
      {
        error: 'We could not complete onboarding right now. Please try again or contact support with this request ID.',
        code: 'client_onboarding_unexpected_error',
        request_id: requestId,
      },
      { status: 500 }
    );
  }
});
