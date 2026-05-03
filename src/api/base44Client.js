import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

/** @typedef {import('@base44/sdk').Base44Client} Base44Client */

const { appId, token, functionsVersion, appBaseUrl } = appParams;
const PREVIEW_CLIENT_ERROR_CODE = 'BASE44_PREVIEW_APP_ID_REQUIRED';

/**
 * @param {string} targetPath
 * @returns {Error & { code: string, target: string }}
 */
const createPreviewClientError = (targetPath) =>
  Object.assign(
    new Error(
      `Base44 app context is unavailable in this preview, so \`${targetPath}\` cannot run until a real app id is provided.`
    ),
    {
      code: PREVIEW_CLIENT_ERROR_CODE,
      target: targetPath,
    }
  );

/**
 * @typedef {'noop' | 'resolveFalse' | 'resolveNull' | 'reject' | 'returnConfig' | 'unsubscribe'} PreviewStrategy
 */

/**
 * @param {string} targetPath
 * @param {PreviewStrategy} [strategy='reject']
 * @returns {(...args: any[]) => any}
 */
const createPreviewMethod = (targetPath, strategy = 'reject') => {
  if (strategy === 'noop') {
    return () => undefined;
  }

  if (strategy === 'resolveFalse') {
    return () => Promise.resolve(false);
  }

  if (strategy === 'resolveNull') {
    return () => Promise.resolve(null);
  }

  if (strategy === 'returnConfig') {
    return () => ({
      serverUrl: '',
      appId: '',
      requiresAuth: false,
    });
  }

  if (strategy === 'unsubscribe') {
    return () => () => {};
  }

  return () => Promise.reject(createPreviewClientError(targetPath));
};

/**
 * @param {string[]} path
 * @param {Record<string, PreviewStrategy>} [strategies={}]
 * @returns {Record<string, any>}
 */
const createPreviewMethodNamespace = (path, strategies = {}) =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return undefined;
        }

        const segment = String(prop);
        const targetPath = [...path, segment].join('.');
        return createPreviewMethod(targetPath, strategies[segment] ?? 'reject');
      },
    }
  );

/**
 * @param {string[]} path
 * @returns {Record<string, any>}
 */
const createPreviewCollectionNamespace = (path) =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return undefined;
        }

        return createPreviewMethodNamespace([...path, String(prop)], {
          subscribe: 'unsubscribe',
        });
      },
    }
  );

/**
 * @param {string[]} path
 * @returns {Record<string, any>}
 */
const createPreviewIntegrationsNamespace = (path) =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return undefined;
        }

        return createPreviewMethodNamespace([...path, String(prop)]);
      },
    }
  );

/**
 * @returns {Base44Client}
 */
const createPreviewSafeClient = () => {
  const previewServiceRoleClient = {
    agents: createPreviewMethodNamespace(['asServiceRole', 'agents'], {
      subscribeToConversation: 'unsubscribe',
    }),
    appLogs: createPreviewMethodNamespace(['asServiceRole', 'appLogs']),
    connectors: createPreviewMethodNamespace(['asServiceRole', 'connectors']),
    entities: createPreviewCollectionNamespace(['asServiceRole', 'entities']),
    functions: createPreviewMethodNamespace(['asServiceRole', 'functions']),
    integrations: createPreviewIntegrationsNamespace(['asServiceRole', 'integrations']),
    sso: createPreviewMethodNamespace(['asServiceRole', 'sso']),
    cleanup: createPreviewMethod('asServiceRole.cleanup', 'noop'),
  };

  return /** @type {Base44Client} */ ({
    agents: createPreviewMethodNamespace(['agents'], {
      subscribeToConversation: 'unsubscribe',
    }),
    analytics: createPreviewMethodNamespace(['analytics'], {
      cleanup: 'noop',
      track: 'noop',
    }),
    appLogs: createPreviewMethodNamespace(['appLogs']),
    auth: createPreviewMethodNamespace(['auth'], {
      isAuthenticated: 'resolveFalse',
      logout: 'noop',
      me: 'resolveNull',
      redirectToLogin: 'noop',
    }),
    connectors: createPreviewMethodNamespace(['connectors']),
    entities: createPreviewCollectionNamespace(['entities']),
    functions: createPreviewMethodNamespace(['functions']),
    integrations: createPreviewIntegrationsNamespace(['integrations']),
    cleanup: createPreviewMethod('cleanup', 'noop'),
    setToken: createPreviewMethod('setToken', 'noop'),
    getConfig: createPreviewMethod('getConfig', 'returnConfig'),
    get asServiceRole() {
      return previewServiceRoleClient;
    },
  });
};

/**
 * Create a client with authentication required.
 *
 * The preview-safe stub keeps public previews responsive when Base44 does not inject an app id.
 * Any real data call still fails closed with a clear error message until a live app context exists.
 *
 * @type {Base44Client}
 */
export const base44 = appParams.hasBase44AppId
  ? createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl,
    })
  : createPreviewSafeClient();
