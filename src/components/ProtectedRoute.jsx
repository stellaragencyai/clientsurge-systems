import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { useSessionValidation } from "@/hooks/useSessionValidation";
import {
  CSAuthLoadingState,
  CSSessionExpiredState,
  CSUnauthorizedState,
} from "@/components/design-system";

function LoginRedirect({ navigateToLogin, fallback }) {
  useEffect(() => {
    navigateToLogin();
  }, [navigateToLogin]);

  return fallback;
}

export default function ProtectedRoute({
  allowedRoles,
  fallback = <CSAuthLoadingState />,
  unauthenticatedElement,
  unauthorizedElement,
}) {
  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
  } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return fallback;
  }

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  if (["session_expired", "token_revoked", "invalid_session"].includes(authError?.type)) {
    return <CSSessionExpiredState onSignIn={navigateToLogin} />;
  }

  if (!isAuthenticated) {
    return (
      unauthenticatedElement || (
        <LoginRedirect navigateToLogin={navigateToLogin} fallback={fallback} />
      )
    );
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    const role = String(user?.role || "").toLowerCase();
    const returnPath = role === "admin" || role === "super_admin" ? "/admin" : "/client-portal";
    return unauthorizedElement || <CSUnauthorizedState onReturn={() => { window.location.href = returnPath; }} />;
  }

  return <ProtectedOutlet />;
}

function ProtectedOutlet() {
  useSessionValidation();
  return <Outlet />;
}
