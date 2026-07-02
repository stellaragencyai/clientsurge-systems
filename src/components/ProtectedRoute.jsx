import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { useSessionValidation } from "@/hooks/useSessionValidation";

const ADMIN_ROLES = ["admin", "super_admin"];
const ADMIN_ONLY_PREFIXES = [
  "/admin",
  "/dashboard",
  "/admin-settings",
  "/lead-intelligence",
  "/sam",
  "/medspa-dashboard",
  "/mission-control",
  "/saas/admin",
  "/launch-control",
  "/funnel-optimization",
  "/system-observability",
];

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
  </div>
);

function normalize(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0].toLowerCase();
  return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value || "/";
}

function isAdminOnlyPath(pathname = "/") {
  const path = normalize(pathname);
  return ADMIN_ONLY_PREFIXES.some((prefix) => {
    const normalizedPrefix = normalize(prefix);
    return path === normalizedPrefix || path.startsWith(`${normalizedPrefix}/`);
  });
}

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
  const location = useLocation();
  const inferredRoles = allowedRoles?.length
    ? allowedRoles
    : isAdminOnlyPath(location.pathname)
      ? ADMIN_ROLES
      : undefined;

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

  if (inferredRoles?.length && !inferredRoles.includes(user?.role)) {
    return unauthorizedElement || null;
  }

  // Validate session on protected routes — catches revoked tokens
  return <ProtectedOutlet />;
}

function ProtectedOutlet() {
  useSessionValidation();
  return <Outlet />;
}
