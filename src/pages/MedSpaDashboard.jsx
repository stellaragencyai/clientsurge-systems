import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { RefreshCw, Loader2, LayoutDashboard, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCards from "@/components/medspa-dashboard/StatsCards";
import PipelineChart from "@/components/medspa-dashboard/PipelineChart";
import ConversionFunnel from "@/components/medspa-dashboard/ConversionFunnel";
import RecentActivity from "@/components/medspa-dashboard/RecentActivity";
import NicheBreakdown from "@/components/medspa-dashboard/NicheBreakdown";

export default function MedSpaDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Lead.list("-updated_date", 500);
    setLeads(data);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-display text-lg font-semibold text-foreground">
              Apex<span className="text-primary">Flow</span>
            </Link>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm font-medium">Med Spa Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link to="/lead-intelligence">
              <Button size="sm" className="gap-2">
                <Zap className="w-3.5 h-3.5" />
                Discover Leads
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Legacy Lead Discovery Overview</h1>
          <p className="text-muted-foreground">Legacy `Lead` analytics only. Not the canonical paid-customer CRM.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <StatsCards leads={leads} />

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PipelineChart leads={leads} />
              <ConversionFunnel leads={leads} />
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity leads={leads} />
              <NicheBreakdown leads={leads} />
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/lead-intelligence"
                className="flex items-center justify-between p-5 bg-white rounded-xl border border-border hover:border-primary transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Lead Intelligence</p>
                    <p className="text-xs text-muted-foreground">Discover and score new leads</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              <Link
                to="/sam"
                className="flex items-center justify-between p-5 bg-white rounded-xl border border-border hover:border-primary transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary">S</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Chat with Sam</p>
                    <p className="text-xs text-muted-foreground">Manage leads via AI assistant</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
