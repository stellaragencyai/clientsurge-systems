import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
  </div>
);

const PreviewFallback = ({ embedded }) => (
  <div className="min-h-screen flex items-center justify-center px-6">
    <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Preview Needs Base44 App Context</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This protected page cannot load without a real Base44 app id, so the preview is falling back
        safely instead of getting stuck on refresh.
      </p>
      <p className="mt-3 text-xs text-slate-500">
        {embedded
          ? "Open a public route for visual editing, or launch this view from a live app context."
          : "Open this route from a live app context to preview authenticated data."}
      </p>
    </div>
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
    hasBase44AppId,
    isPreviewWithoutAppId,
    navigateToLogin,
  } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return fallback;
  }

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  if (!hasBase44AppId && !isAuthenticated) {
    return <PreviewFallback embedded={isPreviewWithoutAppId} />;
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

  return <Outlet />;
}
