import React, { createContext, useContext, useEffect, useState } from "react";
import { createAxiosClient } from "@base44/sdk/dist/utils/axios-client";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import { isPublicRoute } from "@/lib/routeSecurity";

const AuthContext = createContext();

function shouldAllowLocalAuthBypass() {
  const hostname = window.location.hostname;
  const isLocalHost =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");

  return import.meta.env.DEV && isLocalHost;
}

function getLocalDevAdminUser() {
  if (!shouldAllowLocalAuthBypass()) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const enabled =
    params.get("local_admin") === "true" ||
    params.get("local_admin") === "1" ||
    window.localStorage.getItem("clientsurge_local_admin") === "true";

  if (!enabled) {
    return null;
  }

  if (params.get("local_admin")) {
    window.localStorage.setItem("clientsurge_local_admin", "true");
  }

  const role =
    params.get("local_super_admin") === "true" ||
    params.get("local_super_admin") === "1" ||
    window.localStorage.getItem("clientsurge_local_super_admin") === "true"
      ? "super_admin"
      : "admin";

  if (params.get("local_super_admin")) {
    window.localStorage.setItem("clientsurge_local_super_admin", "true");
  }

  return {
    id: "local-admin",
    email: "local-admin@clientsurge.test",
    full_name: role === "super_admin" ? "Local Super Admin" : "Local Admin",
    role,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    const currentPath = window.location.pathname;

    if (shouldAllowLocalAuthBypass()) {
      const localAdmin = getLocalDevAdminUser();
      if (localAdmin) {
        setUser(localAdmin);
        setIsAuthenticated(true);
      } else if (isPublicRoute(currentPath)) {
        setUser(null);
        setIsAuthenticated(false);
      } else {
        await checkUserAuth();
        setIsLoadingPublicSettings(false);
        setAuthError(null);
        return;
      }
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthError(null);
      return;
    }

    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const appClient = createAxiosClient({
        baseURL: "/api/apps/public",
        headers: {
          "X-App-Id": appParams.appId,
        },
        token: appParams.token,
        interceptResponses: true,
      });

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 5000)
        );

        const publicSettings = await Promise.race([
          appClient.get(`/prod/public-settings/by-id/${appParams.appId}`),
          timeoutPromise,
        ]);

        setAppPublicSettings(publicSettings);

        if (!isPublicRoute(currentPath)) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }

        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error("App state check failed:", appError);

        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;

          if (reason === "auth_required") {
            setAuthError({
              type: "auth_required",
              message: "Authentication required",
            });
          } else if (reason === "user_not_registered") {
            setAuthError({
              type: "user_not_registered",
              message: "User not registered for this app",
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message,
            });
          }
        } else {
          setAuthError({
            type: "unknown",
            message: appError.message || "Failed to load app",
          });
        }

        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setAuthError({
        type: "unknown",
        message: error.message || "An unexpected error occurred",
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      applyAuthenticatedUser(currentUser);
      setIsLoadingAuth(false);
      return currentUser;
    } catch (error) {
      console.error("User auth check failed:", error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setUser(null);

      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: "auth_required",
          message: "Authentication required",
        });
      }

      return null;
    }
  };

  const applyAuthenticatedUser = (currentUser) => {
    setUser(currentUser || null);
    setIsAuthenticated(Boolean(currentUser));
    setAuthError(null);
    setIsLoadingAuth(false);
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);

    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        checkUserAuth,
        applyAuthenticatedUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
