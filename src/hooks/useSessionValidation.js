/**
 * Hook to re-validate user session periodically
 * Ensures token hasn't been revoked at server-level
 * Prevents stale sessions from accessing protected routes
 *
 * NOTE: The initial auth check is already done by AuthContext on mount.
 * This hook only runs a periodic background check and redirects to login
 * ONLY on definitive 401/403 responses — transient errors are ignored
 * so they don't log out users with valid sessions.
 */

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useSessionValidation() {
  const { user, navigateToLogin } = useAuth();
  const navigateRef = useRef(navigateToLogin);
  navigateRef.current = navigateToLogin;

  useEffect(() => {
    if (!user) return;

    const validateSession = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          navigateRef.current();
        }
      } catch (error) {
        // Only redirect on definitive auth failures (401/403).
        // Transient errors (network, timeout, 500) should NOT log the user out.
        const status = error?.status || error?.response?.status;
        if (status === 401 || status === 403) {
          navigateRef.current();
        }
      }
    };

    const interval = setInterval(validateSession, SESSION_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [user]);
}

export default useSessionValidation;