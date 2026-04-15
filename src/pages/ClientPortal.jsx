import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, LogOut, LayoutDashboard } from "lucide-react";
import BuildTracker from "../components/portal/BuildTracker";
import SupportChat from "../components/portal/SupportChat";
import PlanManager from "../components/portal/PlanManager";

const TABS = [
  { id: "progress", label: "Build Progress" },
  { id: "support", label: "Support & Messaging" },
  { id: "plan", label: "My Plan" },
];

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("progress");

  useEffect(() => {
    const init = async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }
      const me = await base44.auth.me();
      setUser(me);
      // Find project by client email
      const projects = await base44.entities.ClientProject.filter({ client_email: me.email });
      if (projects.length === 0) {
        setNotFound(true);
      } else {
        setProject(projects[0]);
      }
      setLoading(false);
    };
    init();
  }, []);

  const refreshProject = async () => {
    if (!user) return;
    const projects = await base44.entities.ClientProject.filter({ client_email: user.email });
    if (projects.length > 0) setProject(projects[0]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">No Project Found</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            We couldn't find a project linked to <span className="font-semibold text-foreground">{user?.email}</span>.
            If you've recently signed up, your project may still be getting set up. Please contact us.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-display font-semibold text-foreground flex flex-col leading-tight">
            <span className="text-sm">ClientSurge</span>
            <span className="text-xs text-primary">Systems</span>
          </div>
          <span className="text-muted-foreground/40 text-lg">·</span>
          <span className="text-sm font-medium text-muted-foreground">Client Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-foreground">{project.business_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            onClick={() => base44.auth.logout("/")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Hero greeting */}
      <div
        className="px-6 py-10"
        style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 60%,#c8965c 100%)" }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-amber-300/70 uppercase tracking-widest mb-1">Welcome Back</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-white mb-1">
            {project.business_name}
          </h1>
          <p className="text-amber-100/70 text-sm">
            Plan: <span className="font-semibold text-amber-200">{project.plan}</span>
            {project.go_live_date && (
              <span className="ml-3">· Target go-live: <span className="font-semibold text-amber-200">{project.go_live_date}</span></span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-white px-6">
        <div className="max-w-4xl mx-auto flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === "progress" && (
          <BuildTracker project={project} />
        )}
        {activeTab === "support" && (
          <SupportChat project={project} user={user} />
        )}
        {activeTab === "plan" && (
          <PlanManager project={project} onUpdated={refreshProject} />
        )}
      </div>
    </div>
  );
}