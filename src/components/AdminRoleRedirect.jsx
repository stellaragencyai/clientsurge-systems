import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

/**
 * AdminRoleRedirect — Route guard that redirects based on user role:
 * - Admins (role='admin' | 'super_admin') → /admin (Admin Dashboard)
 * - Non-admins → /mission-control (Mission Control)
 *
 * Use this as a protected-route wrapper for admin landing pages.
 */
export default function AdminRoleRedirect() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoadingAuth || !user) return;

    // Admin users (admin, super_admin) → Admin Dashboard
    if (user.role === "admin" || user.role === "super_admin") {
      navigate("/admin", { replace: true });
    } else {
      // Non-admin → Mission Control
      navigate("/mission-control", { replace: true });
    }
  }, [user, isLoadingAuth, navigate]);

  // Loading state
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
    </div>
  );
}