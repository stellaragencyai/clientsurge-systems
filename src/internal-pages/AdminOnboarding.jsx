import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Link2, Loader2, Users } from "lucide-react";
import ClientOnboardingCard from "@/components/admin/onboarding/ClientOnboardingCard";
import AddClientModal from "@/components/admin/onboarding/AddClientModal";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");

  const loadClients = async () => {
    const data = await base44.entities.OnboardingClient.list("-created_date", 100);
    setClients(data);
    setLoading(false);
  };

  useEffect(() => { loadClients(); }, []);

  // Admin-only guard
  if (user && user.role !== "admin") {
    return (
      <AdminShell title="Access Denied" activeId="">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">Admin access required.</p>
          </div>
        </div>
      </AdminShell>
    );
  }

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
      <AdminShell title="Client Onboarding" activeId="onboarding">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Client Onboarding" activeId="onboarding">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Client Onboarding</h1>
            <p className="text-sm text-muted-foreground mt-1">{clients.length} client{clients.length !== 1 ? "s" : ""} total</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 h-10 text-sm font-bold text-white rounded-full hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)" }}
          >
            <Link2 className="w-4 h-4" /> Attach Paid Order
          </button>
        </div>
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Clients" value={clients.length} color="primary" />
          <StatCard label="Live" value={liveCount} color="green" />
          <StatCard label="In Setup" value={inSetupCount} color="blue" />
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
            <p className="font-semibold">No canonically linked onboarding records yet</p>
            <p className="text-sm mt-1">Use "Attach Paid Order" to link a paid order into internal onboarding.</p>
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
    </AdminShell>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    primary: "bg-primary/8 text-primary border-primary/20",
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}