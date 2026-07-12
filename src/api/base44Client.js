import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import {
  trackAuditRequestSubmitted,
  trackLeadSubmit,
  trackSuccessfulFormSubmit,
} from '@/utils/ga4Events';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

function isLocalPreview() {
  if (typeof window === "undefined") return false;

  const { hostname } = window.location;
  const isLocalHost =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");

  return import.meta.env.DEV && isLocalHost;
}

function createLocalPreviewClient() {
  const entityCollection = new Proxy(
    {},
    {
      get() {
        return {
          list: async () => [],
          filter: async () => [],
          get: async () => null,
          create: async (record) => ({ id: "local-preview", ...record }),
          update: async (_id, record) => ({ id: _id, ...record }),
          delete: async () => null,
        };
      },
    }
  );

  const functionCollection = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "invoke") {
          return async (functionName, payload = {}) => ({
            data: {
              success: true,
              local_preview: true,
              function_name: functionName,
              lead_id: "local-preview-lead",
              crm_lead_id: "local-preview-crm-lead",
              payload,
            },
          });
        }

        return async () => ({ data: { success: true, local_preview: true } });
      },
    }
  );

  return {
    auth: {
      me: async () => null,
      logout: () => {},
      redirectToLogin: () => {},
    },
    analytics: {
      track: async () => null,
    },
    entities: entityCollection,
    functions: functionCollection,
  };
}

function trackSuccessfulFunctionOutcome(functionName, payload, result) {
  const data = result?.data && typeof result.data === "object" ? result.data : result;
  if (functionName !== "scheduleDemoBooking" || data?.success === false) return;

  const industry = payload?.industry || payload?.business_type || "unknown";
  const source = payload?.source_page || "/book";

  trackSuccessfulFormSubmit({
    form_id: "audit_request_form",
    page_path: source,
    source: "audit_request",
  });
  trackAuditRequestSubmitted({
    industry,
    scheduled_date: payload?.scheduled_date,
    source,
  });
  trackLeadSubmit({
    industry,
    has_website: Boolean(payload?.website || payload?.business_website_url),
    lead_source: "audit_request",
  });
}

function addFunctionOutcomeTracking(client) {
  const functions = client?.functions;
  if (!functions || typeof functions.invoke !== "function") return client;

  const originalInvoke = functions.invoke.bind(functions);
  const trackedInvoke = async (functionName, payload = {}) => {
    const result = await originalInvoke(functionName, payload);
    try {
      trackSuccessfulFunctionOutcome(functionName, payload, result);
    } catch (error) {
      console.warn("[base44Client] outcome tracking failed:", error?.message);
    }
    return result;
  };

  const trackedFunctions = new Proxy(functions, {
    get(target, prop, receiver) {
      if (prop === "invoke") return trackedInvoke;
      return Reflect.get(target, prop, receiver);
    },
  });

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "functions") return trackedFunctions;
      return Reflect.get(target, prop, receiver);
    },
  });
}

const sdkClient = isLocalPreview() ? createLocalPreviewClient() : createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

export const base44 = addFunctionOutcomeTracking(sdkClient);
