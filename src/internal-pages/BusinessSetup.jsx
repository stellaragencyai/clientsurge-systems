import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import QuickSetupWizard from "@/components/onboarding/QuickSetupWizard";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";

function MissingSetupContext() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center rounded-3xl border border-border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground mb-2">Setup link needs verification</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          This setup page needs a verified <code>project_id</code> or <code>order_id</code>. Start from your client portal or use the link from your confirmation email.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/client-portal/progress" className="cs-btn-primary text-sm">Open Client Portal</Link>
          <a href="mailto:support@clientsurgesystems.com?subject=Setup%20link%20help" className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">Contact Support</a>
        </div>
      </div>
    </div>
  );
}

export default function BusinessSetup() {
  const navigate = useNavigate();
  const setupContext = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      projectId: params.get("project_id") || null,
      orderId: params.get("order_id") || null,
      section: params.get("section") || "",
      source: params.get("source") || "client_setup",
    };
  }, []);
  const [projectId] = useState(setupContext.projectId);

  const handleSetupComplete = () => {
    const next = new URLSearchParams();
    if (projectId) next.set("project_id", projectId);
    next.set("setup_submitted", "1");
    navigate(`/client-portal/progress?${next.toString()}`);
  };

  // Paid orders use the verified credentials wizard. The legacy project-only
  // quick setup must never ask a post-purchase client to choose a package again.
  if (setupContext.orderId) {
    const next = new URLSearchParams({ order_id: setupContext.orderId });
    if (setupContext.section) next.set("section", setupContext.section);
    return <Navigate to={`/setup/credentials?${next.toString()}`} replace />;
  }

  if (!projectId) return <MissingSetupContext />;

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 pt-28">
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Setup progress is saved to your ClientSurge project records. After submission, you will return to the client portal to see current status.
          </div>
        </div>
        <div className="pb-12">
          <QuickSetupWizard projectId={projectId} onComplete={handleSetupComplete} />
        </div>
      </div>
    </DemoBookingProvider>
  );
}
