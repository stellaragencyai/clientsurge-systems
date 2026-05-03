// @ts-nocheck
import React, { createContext, useContext, useEffect, useState } from "react";
import { createAxiosClient } from "@base44/sdk/dist/utils/axios-client";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import {
  clearPortalTestFixture,
  isPortalTestModeEnabled,
  readPortalTestFixture,
} from "@/lib/portalTestMode";

const AuthContext = createContext();

function shouldAllowLocalAuthBypass() {
  if (!import.meta.env.DEV) {
    return false;
  }

  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
}

function shouldSkipBase44Bootstrap() {
  return shouldAllowLocalAuthBypass() || !appParams.hasBase44AppId;
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
    const portalTestFixture = readPortalTestFixture();
    if (portalTestFixture?.user && isPortalTestModeEnabled()) {
      setUser(portalTestFixture.user);
      setIsAuthenticated(true);
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthError(null);
      return;
    }

    if (shouldSkipBase44Bootstrap()) {
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthError(null);
      setAppPublicSettings(null);
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
          setTimeout(() => reject(new Error("timeout")), 1500)
        );

        const publicSettings = await Promise.race([
          appClient.get(`/prod/public-settings/by-id/${appParams.appId}`),
          timeoutPromise,
        ]);

        setAppPublicSettings(publicSettings);

        if (appParams.token) {
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
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error("User auth check failed:", error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: "auth_required",
          message: "Authentication required",
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    if (!appParams.hasBase44AppId) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);

      if (shouldRedirect && typeof window !== "undefined") {
        window.location.assign("/");
      }
      return;
    }

    if (isPortalTestModeEnabled()) {
      clearPortalTestFixture();
      if (shouldRedirect && typeof window !== "undefined") {
        window.location.assign("/");
      }
      return;
    }

    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      base44.auth.logout("/");
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    if (!appParams.hasBase44AppId) {
      return;
    }

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
        hasBase44AppId: appParams.hasBase44AppId,
        isPreviewWithoutAppId: appParams.isPreviewWithoutAppId,
        logout,
        navigateToLogin,
        checkAppState,
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
