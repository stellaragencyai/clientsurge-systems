import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

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

//Create a client with authentication required
const sdkClient = isLocalPreview() ? createLocalPreviewClient() : createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

export const base44 = sdkClient;
