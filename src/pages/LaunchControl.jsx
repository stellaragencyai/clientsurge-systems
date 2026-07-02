import { useSearchParams, Navigate } from "react-router-dom";
import LaunchControlCenter from "@/components/portal/LaunchControlCenter";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/lib/AuthContext";

const AUTHORIZED_ROLES = ["admin", "super_admin", "client"];

export default function LaunchControl() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const orderId = searchParams.get("order_id");

  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!AUTHORIZED_ROLES.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Launch Control Center</h1>
            <p className="text-muted-foreground mt-2">
              Track your Pro Activation progress from setup to go-live.
            </p>
          </div>
          {orderId ? (
            <LaunchControlCenter orderId={orderId} />
          ) : (
            <div className="rounded-2xl border border-border bg-white p-12 text-center">
              <p className="text-muted-foreground">No order ID provided. Please access this page from your order confirmation link.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
