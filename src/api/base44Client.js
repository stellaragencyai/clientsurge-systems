import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Keep auth optional at the SDK bootstrap so public marketing and checkout
// pages can render. Private routes and operational functions enforce auth
// through routeSecurity, ProtectedRoute, entity rules, and function guards.
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});
