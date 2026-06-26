import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { useSessionValidation } from "@/hooks/useSessionValidation";

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
  </div>
);

function LoginRedirect({ navigateToLogin, fallback }) {
  useEffect(() => {
    navigateToLogin();
  }, [navigateToLogin]);

  return fallback;
}

export default function ProtectedRoute({
  allowedRoles,
  fallback = <DefaultFallback />,
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

  if (!isAuthenticated) {
    return (
      unauthenticatedElement || (
        <LoginRedirect navigateToLogin={navigateToLogin} fallback={fallback} />
      )
    );
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return unauthorizedElement || null;
  }

  // Validate session on protected routes — catches revoked tokens
  return <ProtectedOutlet />;
}

function ProtectedOutlet() {
  useSessionValidation();
  return <Outlet />;
}