/**
 * Task 13 & 14: Client-facing setup progress lookup
 * Route: /setup-lookup
 * Public page — no login required.
 * Client enters their email or order ID to see their setup progress.
 */
import { useState } from "react";
import { CheckCircle2, Clock, Loader2, AlertCircle, ArrowRight } from "lucide-react";
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

function getStageIndex(workflowStage) {
  const s = (workflowStage || "").toLowerCase();
  if (s.includes("live") || s.includes("went_live") || s.includes("activated")) return 4;
  if (s.includes("website") || s.includes("preview") || s.includes("approved")) return 3;
  if (s.includes("configur") || s.includes("install") || s.includes("testing") || s.includes("activation_ready")) return 2;
  if (s.includes("credentials") || s.includes("intake") || s.includes("onboarding")) return 1;
  return 0;
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

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="px-6 pb-24 pt-[calc(var(--cs-nav-height)+48px)]">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">Setup Tracker</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Check Your Setup Progress
              </h1>
              <p className="text-muted-foreground text-base">
                Enter the email you used at checkout or your order ID to see where your system setup stands.
              </p>
            </div>

            <form onSubmit={handleLookup} className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-8">
              <label htmlFor="setup-query" className="block text-sm font-semibold text-foreground mb-2">
                Email address or Order ID
              </label>
              <div className="flex gap-3">
                <input
                  id="setup-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="jane@yourcompany.com or order_abc123"
                  className="flex-1 h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="h-12 px-6 rounded-xl font-semibold text-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {loading ? "Looking up..." : "Check Status"}
                </button>
              </div>
              {error && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </form>

            {result && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Business</p>
                  <p className="text-lg font-bold text-foreground">{result.business_name || result.customer_name || "Your business"}</p>
                  <p className="text-sm text-muted-foreground">{result.customer_email}</p>
                </div>

                <div className="mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Setup Progress</p>
                  <div className="space-y-4">
                    {STAGES.map((stage, idx) => {
                      const isDone = currentStage > idx;
                      const isActive = currentStage === idx;
                      return (
                        <div key={stage.key} className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
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
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${isDone ? "text-emerald-700" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                              {stage.label}
                              {isActive && <span className="ml-2 text-xs font-medium text-primary">← In progress</span>}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-5 border-t border-border flex flex-col sm:flex-row gap-3">
                  <a
                    href="/client-portal"
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Go to Client Portal
                  </a>
                  <a
                    href="mailto:support@clientsurgesystems.com"
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Email Support
                  </a>
                </div>
              </div>
            )}

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