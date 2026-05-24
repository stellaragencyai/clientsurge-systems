import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import QuickSetupWizard from "@/components/onboarding/QuickSetupWizard";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import SetupStatus from "@/internal-pages/SetupStatus";

export default function BusinessSetup() {
  const navigate = useNavigate();
  const [projectId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("project_id") || null;
  });
  const [orderId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("order_id") || params.get("orderId") || null;
  });

  const handleSetupComplete = () => {
    // Redirect to admin dashboard
    if (projectId) {
      navigate(`/admin?project_id=${projectId}`);
    } else {
      navigate("/admin");
    }
  };

  if (orderId && !projectId) {
    return <SetupStatus orderIdOverride={orderId} />;
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Setup Required
          </h1>
          <p className="text-muted-foreground">
            Project ID missing. Please start from your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-12">
          <QuickSetupWizard
            projectId={projectId}
            onComplete={handleSetupComplete}
          />
        </div>
      </div>
    </DemoBookingProvider>
  );
}
