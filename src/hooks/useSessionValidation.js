/**
 * Hook to re-validate user session on route changes
 * Ensures token hasn't been revoked at server-level
 * Prevents stale sessions from accessing protected routes
 */

import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export function useSessionValidation() {
  const { user, redirectToLogin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    // Validate session on route change to protected areas
    const isProtectedRoute = location.pathname.startsWith("/admin") ||
                            location.pathname.startsWith("/client-portal") ||
                            location.pathname.startsWith("/dashboard");

    if (!isProtectedRoute) return;

    const validateSession = async () => {
      try {
        // Call auth.me() to validate token is still valid
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          redirectToLogin();
        }
      } catch (error) {
        console.warn("Session validation failed:", error);
        redirectToLogin();
      }
    };

    // Validate immediately and then every 5 minutes
    validateSession();
    const interval = setInterval(validateSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, location.pathname, redirectToLogin]);
}

export default useSessionValidation;