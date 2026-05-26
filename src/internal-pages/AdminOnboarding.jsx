import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Link2, Loader2, Users } from "lucide-react";
import ClientOnboardingCard from "@/components/admin/onboarding/ClientOnboardingCard";
import AddClientModal from "@/components/admin/onboarding/AddClientModal";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminOnboarding() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadClients = async () => {
    const data = await base44.entities.OnboardingClient.list("-created_date", 100);
    setClients(data);
    setLoading(false);
  };

  useEffect(() => { loadClients(); }, []);

  // Role guard handled by ProtectedRoute in App.jsx
  // Use OnboardingClient real fields: activation_status and workflow_stage
  const liveCount = clients.filter(c => c.activation_status === "activated").length;
  const inSetupCount = clients.filter(c => c.activation_status === "ready_for_approval" || c.workflow_stage === "automation_setup" || c.workflow_stage === "automation_testing").length;
  const onboardingCount = clients.filter(c => !c.activation_status || c.activation_status === "not_ready").length;

  const filtered = clients.filter((client) => {
    const statusMatch = filter === "all"
      ? true
      : filter === "live"
        ? client.activation_status === "activated"
        : filter === "setup"
          ? (client.activation_status === "ready_for_approval" || client.workflow_stage?.includes("setup") || client.workflow_stage?.includes("testing"))
          : (!client.activation_status || client.activation_status === "not_ready");

    const query = search.trim().toLowerCase();
    const searchMatch = !query || [client.business_name, client.email, client.owner_name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));

    return statusMatch && searchMatch;
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
        <div className="max-w-md">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business name or email..."
            className="h-10 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
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