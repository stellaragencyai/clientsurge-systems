import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react";
import QuickSetupWizard from "@/components/onboarding/QuickSetupWizard";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";

function MissingSetupContext() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06132c] px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_90%_85%,rgba(14,116,144,0.2),transparent_36%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 text-center shadow-[0_30px_100px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Verification required</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">This setup link needs a verified project.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300">
            Open setup from your client portal or use the secure link in your confirmation email. We require a valid project or order reference before displaying configuration controls.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/client-portal/progress" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 text-sm font-black text-[#06132c] shadow-[0_12px_34px_rgba(34,211,238,0.26)] transition hover:-translate-y-0.5 hover:bg-cyan-200">
              Open client portal <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="mailto:support@clientsurgesystems.com?subject=Setup%20link%20help" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10">
              <LifeBuoy className="h-4 w-4" /> Contact support
            </a>
          </div>
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

  if (setupContext.orderId) {
    const next = new URLSearchParams({ order_id: setupContext.orderId });
    if (setupContext.section) next.set("section", setupContext.section);
    return <Navigate to={`/setup/credentials?${next.toString()}`} replace />;
  }

  if (!projectId) return <MissingSetupContext />;

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-[linear-gradient(180deg,#eef9ff_0%,#f8fbff_42%,#ffffff_100%)]">
        <header className="border-b border-white/10 bg-[#06132c] text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles className="h-4 w-4" /> ClientSurge activation
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-300">Business system configuration</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 sm:flex">
              <ShieldCheck className="h-4 w-4 text-cyan-200" /> Verified project session
            </div>
          </div>
        </header>

        <main className="py-8 sm:py-12">
          <div className="mx-auto mb-6 max-w-6xl px-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-cyan-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Project-linked setup</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Your choices are saved to the verified ClientSurge project record after final confirmation.</p>
              </div>
              <Link to="/client-portal/progress" className="inline-flex items-center gap-2 text-sm font-black text-cyan-700 no-underline hover:text-cyan-600">
                Exit to portal <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <QuickSetupWizard projectId={projectId} onComplete={handleSetupComplete} />
        </main>
      </div>
    </DemoBookingProvider>
  );
}
