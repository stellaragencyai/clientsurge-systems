/**
 * Client-facing setup progress lookup
 * Route: /setup-lookup
 * Public page — no login required.
 */
import { useState } from "react";
import {
  CheckCircle2, Clock, Loader2, AlertCircle, ArrowRight,
  Phone, MessageSquare, Calendar, Star, RefreshCw, Zap,
  Shield, ChevronRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";

const STAGES = [
  { key: "payment", label: "Payment Confirmed", description: "Your order has been received and payment processed." },
  { key: "credentials", label: "Business Info Collected", description: "We have your credentials and business details." },
  { key: "configuring", label: "Systems Configuring", description: "Your AI systems are being configured and personalized." },
  { key: "website", label: "Website Building", description: "Your conversion website is being built." },
  { key: "live", label: "Everything Live", description: "All systems are active and tracking results." },
];

const AUTOMATION_WORKFLOWS = [
  { id: "missed_call", icon: Phone, label: "Missed Call Text-Back", desc: "Responds to missed calls within 12 seconds", color: "#00AEEF", packages: ["starter", "growth", "elite"] },
  { id: "lead_followup", icon: MessageSquare, label: "AI Lead Follow-Up", desc: "Multi-step SMS + email sequence for new leads", color: "#006BB0", packages: ["starter", "growth", "elite"] },
  { id: "booking", icon: Calendar, label: "Appointment Booking", desc: "AI guides leads from inquiry to booked slot", color: "#0052A5", packages: ["growth", "elite"] },
  { id: "review", icon: Star, label: "Review Requests", desc: "Auto-requests Google reviews post-appointment", color: "#F59E0B", packages: ["growth", "elite"] },
  { id: "reactivation", icon: RefreshCw, label: "Lead Reactivation", desc: "Re-engages cold leads from up to 90 days ago", color: "#8B5CF6", packages: ["elite"] },
  { id: "voice", icon: Zap, label: "AI Voice Agent", desc: "Answers & triages inbound calls with AI", color: "#10B981", packages: ["elite"] },
];

function getStageIndex(workflowStage) {
  const s = (workflowStage || "").toLowerCase();
  if (s.includes("live") || s.includes("went_live") || s.includes("activated")) return 4;
  if (s.includes("website") || s.includes("preview") || s.includes("approved")) return 3;
  if (s.includes("configur") || s.includes("install") || s.includes("testing") || s.includes("activation_ready")) return 2;
  if (s.includes("credentials") || s.includes("intake") || s.includes("onboarding")) return 1;
  return 0;
}

function getPackageKey(order) {
  const pkg = (order.activation_package_key || order.package_type || order.selected_package_type || "").toLowerCase();
  if (pkg.includes("elite") || pkg.includes("pro")) return "elite";
  if (pkg.includes("growth")) return "growth";
  return "starter";
}

function AutomationWorkflowMap({ packageKey, currentStage }) {
  const isLive = currentStage >= 4;
  const isConfiguring = currentStage >= 2;
  const activeWorkflows = AUTOMATION_WORKFLOWS.filter(w => w.packages.includes(packageKey));

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Automation Workflows</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {activeWorkflows.map((w) => {
          const WIcon = w.icon;
          const status = isLive ? "live" : isConfiguring ? "configuring" : "pending";
          return (
            <div
              key={w.id}
              className="flex items-start gap-3 rounded-xl border p-3 transition-colors"
              style={{
                borderColor: status === "live" ? `${w.color}33` : "hsl(var(--border))",
                background: status === "live" ? `${w.color}08` : "transparent",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${w.color}15`, border: `1px solid ${w.color}30` }}
              >
                <WIcon size={15} style={{ color: w.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-xs font-semibold text-foreground truncate">{w.label}</p>
                  {status === "live" && (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE
                    </span>
                  )}
                  {status === "configuring" && (
                    <span className="flex-shrink-0 text-[10px] font-bold text-primary">Setting up</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">{w.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      {!isLive && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          {isConfiguring
            ? "Your workflows are being configured and will go live shortly."
            : "Workflows will activate once setup is complete."}
        </p>
      )}
    </div>
  );
}

export default function ClientSetupLookup() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await base44.functions.invoke("getOrderStatus", { order_id: query.trim(), email: query.trim() });
      if (res?.data?.order) {
        setResult(res.data.order);
      } else {
        setError("We couldn't find an order matching that email or order ID. Double-check the email you used during checkout.");
      }
    } catch {
      setError("Unable to look up your setup status right now. Please try again or email support@clientsurgesystems.com.");
    } finally {
      setLoading(false);
    }
  };

  const currentStage = result ? getStageIndex(result.workflow_stage || result.order_status) : -1;
  const packageKey = result ? getPackageKey(result) : "starter";

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="px-6 pb-24 pt-[calc(var(--cs-nav-height)+48px)]">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 mb-4">
                <Shield size={12} className="text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Secure Setup Tracker</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Check Your Setup Progress
              </h1>
              <p className="text-muted-foreground text-base max-w-lg mx-auto">
                Enter the email you used at checkout or your order ID to see exactly where your system setup stands.
              </p>
            </div>

            {/* Lookup form */}
            <form onSubmit={handleLookup} className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
              <label htmlFor="setup-query" className="block text-sm font-semibold text-foreground mb-2">
                Email address or Order ID
              </label>
              <div className="flex gap-3">
                <input
                  id="setup-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="jane@yourcompany.com  or  order_abc123"
                  className="flex-1 h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="h-12 px-6 rounded-xl font-semibold text-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {loading ? "Looking up..." : "Check Status"}
                </button>
              </div>
              {error && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </form>

            {/* Result card */}
            {result && (
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Business header */}
                <div className="px-6 pt-6 pb-5 border-b border-border"
                  style={{ background: "linear-gradient(135deg, rgba(0,107,176,0.04) 0%, transparent 60%)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Business on file</p>
                      <p className="text-xl font-bold text-foreground">{result.business_name || result.customer_name || "Your business"}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{result.customer_email}</p>
                    </div>
                    {currentStage >= 4 && (
                      <div className="flex-shrink-0 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-700">LIVE</span>
                      </div>
                    )}
                  </div>
                  {(result.activation_package_name || result.activation_package_key) && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-primary/8 border border-primary/15 rounded-full px-3 py-1">
                      <Zap size={11} className="text-primary" />
                      <span className="text-xs font-semibold text-primary capitalize">
                        {result.activation_package_name || result.activation_package_key?.replace(/_/g, " ")} Plan
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-6 py-5 space-y-6">
                  {/* Stage tracker */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Setup Progress</p>
                    <div className="space-y-3">
                      {STAGES.map((stage, idx) => {
                        const isDone = currentStage > idx;
                        const isActive = currentStage === idx;
                        return (
                          <div key={stage.key} className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                              isDone ? "bg-emerald-500 text-white" :
                              isActive ? "bg-primary/15 border-2 border-primary" :
                              "bg-muted border border-border"
                            }`}>
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : isActive ? (
                                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <p className={`text-sm font-semibold ${isDone ? "text-emerald-700" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                {stage.label}
                                {isActive && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                                    <ChevronRight size={10} /> In progress
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Automation workflow map */}
                  <div className="border-t border-border pt-5">
                    <AutomationWorkflowMap packageKey={packageKey} currentStage={currentStage} />
                  </div>

                  {/* Actions */}
                  <div className="border-t border-border pt-5 flex flex-col sm:flex-row gap-3">
                    <a
                      href="/client-portal"
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Open Client Portal <ArrowRight size={15} />
                    </a>
                    <a
                      href="mailto:support@clientsurgesystems.com"
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      Email Support
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Help footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                Questions? Reach us at{" "}
                <a href="mailto:support@clientsurgesystems.com" className="text-primary hover:underline font-medium">
                  support@clientsurgesystems.com
                </a>{" "}
                or{" "}
                <a href="tel:+16025843227" className="text-primary hover:underline font-medium">
                  (602) 584-3227
                </a>
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </DemoBookingProvider>
  );
}