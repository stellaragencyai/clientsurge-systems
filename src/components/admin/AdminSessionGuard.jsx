/**
 * Finding #149: Admin session timeout wrapper component.
 * Wraps the admin shell with a 30-minute inactivity timeout.
 * Shows a warning modal at 25 minutes, auto-logout at 30 minutes.
 */
import { useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useSessionTimeout } from "@/lib/useSessionTimeout";
import { AlertTriangle } from "lucide-react";

export default function AdminSessionGuard({ children, isAdmin }) {
  const { logout } = useAuth();

  const handleTimeout = useCallback(() => {
    logout("/login");
  }, [logout]);

  const { showWarning, timeRemaining, resetTimer } = useSessionTimeout(handleTimeout, isAdmin);

  if (!isAdmin) return children;

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-900">
                Session expiring soon
              </p>
              <p className="text-xs text-orange-700 mt-1">
                You'll be automatically logged out in {Math.ceil(timeRemaining / 60000)} minutes due to inactivity.
              </p>
              <button
                onClick={resetTimer}
                className="mt-2 text-xs font-semibold text-orange-900 underline hover:text-orange-800"
              >
                Stay logged in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}