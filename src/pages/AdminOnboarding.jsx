import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, Users, CheckCircle2, Zap, ArrowLeft } from "lucide-react";
import ClientOnboardingCard from "@/components/admin/onboarding/ClientOnboardingCard";
import AddClientModal from "@/components/admin/onboarding/AddClientModal";

export default function AdminOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");

  // Admin-only guard
  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required.</p>
        </div>
      </div>
    );
  }

  const loadClients = async () => {
    const data = await base44.entities.OnboardingClient.list("-created_date", 100);
    setClients(data);
    setLoading(false);
  };

  useEffect(() => { loadClients(); }, []);

  const liveCount = clients.filter(c => c.status === "Live").length;
  const inSetupCount = clients.filter(c => c.status === "In Setup").length;
  const onboardingCount = clients.filter(c => c.status === "Onboarding" || !c.status).length;

  const filtered = filter === "all" ? clients
    : clients.filter(c => {
        if (filter === "live") return c.status === "Live";
        if (filter === "setup") return c.status === "In Setup";
        if (filter === "onboarding") return c.status === "Onboarding" || !c.status;
        return true;
      });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Admin
            </button>
            <div className="w-px h-5 bg-border" />
            <div>
              <h1 className="font-display text-xl font-semibold text-foreground leading-tight">
                Client Onboarding
              </h1>
              <p className="text-xs text-muted-foreground">{clients.length} client{clients.length !== 1 ? "s" : ""} total</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", borderRadius: "9999px" }}
            className="flex items-center gap-2 px-5 h-10 text-sm font-bold text-amber-100 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Clients" value={clients.length} color="primary" />
          <StatCard label="Live" value={liveCount} color="green" />
          <StatCard label="In Setup" value={inSetupCount} color="amber" />
          <StatCard label="Onboarding" value={onboardingCount} color="gray" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "all", label: "All" },
            { id: "onboarding", label: "Onboarding" },
            { id: "setup", label: "In Setup" },
            { id: "live", label: "Live" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Client Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No clients yet</p>
            <p className="text-sm mt-1">Click "Add Client" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(client => (
              <ClientOnboardingCard
                key={client.id}
                client={client}
                onUpdate={loadClients}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onSaved={loadClients}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    primary: "bg-primary/8 text-primary border-primary/20",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}