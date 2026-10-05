import { createClient } from '@base44/sdk';
import { createAuthModule } from '@base44/sdk/dist/modules/auth.js';
import { createEntitiesModule } from '@base44/sdk/dist/modules/entities.js';
import { createFunctionsModule } from '@base44/sdk/dist/modules/functions.js';
import { createIntegrationsModule } from '@base44/sdk/dist/modules/integrations.js';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client.js';
import { getAccessToken } from '@base44/sdk/dist/utils/auth-utils.js';
import { appParams } from '@/lib/app-params';
import { isPublicRoute } from '@/lib/routeSecurity';

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

function createPublicRouteClient() {
  const headers = {
    "X-App-Id": String(appId),
  };

  const functionHeaders = functionsVersion
    ? {
        ...headers,
        "Base44-Functions-Version": functionsVersion,
      }
    : headers;

  const axiosClient = createAxiosClient({
    baseURL: "/api",
    headers,
    token,
  });

  const functionsAxiosClient = createAxiosClient({
    baseURL: "/api",
    headers: functionHeaders,
    token,
    interceptResponses: false,
  });

  const auth = createAuthModule(axiosClient, functionsAxiosClient, appId, {
    appBaseUrl,
    serverUrl: "",
  });

  if (typeof window !== "undefined") {
    const accessToken = token || getAccessToken();
    if (accessToken) {
      auth.setToken(accessToken);
    }
  }

  return {
    auth,
    analytics: {
      track: async () => null,
      cleanup: () => {},
    },
    entities: createEntitiesModule({
      axios: axiosClient,
      appId,
      getSocket: () => {
        throw new Error("Realtime subscriptions are disabled on public routes.");
      },
    }),
    functions: createFunctionsModule(functionsAxiosClient, appId, {
      getAuthHeaders: () => {
        const currentToken = token || getAccessToken();
        return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
      },
      baseURL: functionsAxiosClient.defaults?.baseURL,
    }),
    integrations: createIntegrationsModule(axiosClient, appId),
    setToken(newToken) {
      auth.setToken(newToken);
    },
    getConfig() {
      return {
        serverUrl: "",
        appId,
        requiresAuth: false,
      };
    },
  };
}

const ADMIN_GATEWAY_FUNCTION = "adminDataGateway";

function unwrapGatewayResult(response) {
  const data = response?.data ?? response;
  if (data && typeof data === "object" && Object.prototype.hasOwnProperty.call(data, "result")) {
    return data.result;
  }
  return data;
}

function installAdminGatewayProxy(client) {
  const invoke = client?.functions?.invoke;
  if (typeof invoke !== "function") return client;

  const invokeGateway = async (payload) => {
    const response = await invoke.call(client.functions, ADMIN_GATEWAY_FUNCTION, payload);
    return unwrapGatewayResult(response);
  };

  const entityCollection = new Proxy(
    {},
    {
      get(_target, entityName) {
        if (typeof entityName !== "string") return undefined;

        return {
          list: (sort = "", limit = 50, skip = 0) =>
            invokeGateway({
              kind: "entity",
              entityName,
              operation: "list",
              args: { sort, limit, skip },
            }),
          filter: (query = {}, sort = "", limit = 50, skip = 0) =>
            invokeGateway({
              kind: "entity",
              entityName,
              operation: "filter",
              args: { query, sort, limit, skip },
            }),
          get: (id) =>
            invokeGateway({
              kind: "entity",
              entityName,
              operation: "get",
              args: { id },
            }),
          create: (data) =>
            invokeGateway({
              kind: "entity",
              entityName,
              operation: "create",
              args: { data },
            }),
          update: (id, data) =>
            invokeGateway({
              kind: "entity",
              entityName,
              operation: "update",
              args: { id, data },
            }),
          delete: (id) =>
            invokeGateway({
              kind: "entity",
              entityName,
              operation: "delete",
              args: { id },
            }),
          subscribe: () => () => {},
        };
      },
    }
  );

  client.admin = {
    entities: entityCollection,
    functions: {
      invoke: (functionName, payload = {}) =>
        invokeGateway({
          kind: "function",
          functionName,
          payload,
        }),
    },
  };

  return client;
}

function shouldUsePublicRouteClient() {
  if (typeof window === "undefined") return false;
  return isPublicRoute(window.location.pathname);
}

const OWNER_PREVIEW_EMAIL = "nolanfstrommer@gmail.com";

function installOwnerPortalPreviewFallback(client) {
  const invoke = client?.functions?.invoke;
  if (typeof invoke !== "function" || typeof client?.auth?.me !== "function") return client;

  const originalInvoke = invoke.bind(client.functions);

  client.functions.invoke = async (functionName, payload = {}) => {
    const response = await originalInvoke(functionName, payload);
    if (functionName !== "getClientPortalContext") return response;

    const context = response?.data || response;
    if (context?.project) return response;

    try {
      const user = await client.auth.me();
      const email = String(user?.email || "").trim().toLowerCase();
      if (email !== OWNER_PREVIEW_EMAIL) return response;

      return await originalInvoke("getAdminPreviewData", { state: "live" });
    } catch (error) {
      console.error("[base44Client] Owner portal preview fallback failed:", error);
      return response;
    }
  };

  return client;
}

const sdkClient = installOwnerPortalPreviewFallback(
  installAdminGatewayProxy(
    isLocalPreview()
      ? createLocalPreviewClient()
      : shouldUsePublicRouteClient()
        ? createPublicRouteClient()
        : createClient({
            appId,
            token,
            functionsVersion,
            serverUrl: '',
            requiresAuth: false,
            appBaseUrl
          })
  )
);

export const base44 = sdkClient;
