/**
 * LeadRoutingPanel — admin UI to configure team member routing settings.
 * Shows each user's routing status, phone, max lead cap, and category preferences.
 */

import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Phone,
  RefreshCw,
  Save,
  Shield,
  User,
  Users,
  Zap,
} from "lucide-react";

const CATEGORIES = ["High-Value", "Standard"];

function UserRoutingCard({ user, onSave }) {
  const [form, setForm] = useState({
    phone: user.phone || "",
    routing_active: user.routing_active || false,
    max_active_leads: user.max_active_leads || 20,
    routing_categories: user.routing_categories || [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      routing_categories: prev.routing_categories.includes(cat)
        ? prev.routing_categories.filter((c) => c !== cat)
        : [...prev.routing_categories, cat],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.User.update(user.id, form);
      setSaved(true);
      onSave?.({ ...user, ...form });
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-xl border p-5 space-y-4 transition-all ${form.routing_active ? "border-primary/30 bg-primary/5" : "border-border bg-white"}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{user.full_name || "Unnamed User"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold">
              <Shield className="w-2.5 h-2.5" /> Admin
            </span>
          )}
          <button
            onClick={() => setForm((f) => ({ ...f, routing_active: !f.routing_active }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.routing_active ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.routing_active ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className={`text-xs font-semibold ${form.routing_active ? "text-primary" : "text-muted-foreground"}`}>
            {form.routing_active ? "Active" : "Off"}
          </span>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            <Phone className="inline w-3 h-3 mr-1" />SMS Phone Number
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+16025550100"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">Must include country code (+1…)</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Max Active Leads
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={form.max_active_leads}
            onChange={(e) => setForm((f) => ({ ...f, max_active_leads: Number(e.target.value) }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">New leads won't route here when at cap</p>
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          Lead Categories to Handle
        </label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const active = form.routing_categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {cat}
              </button>
            );
          })}
          <span className="text-xs text-muted-foreground self-center">
            {form.routing_categories.length === 0 ? "(handles all categories)" : ""}
          </span>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
      </div>
    </div>
  );
}

export default function LeadRoutingPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await base44.entities.User.list("-created_date", 100);
      setUsers(data || []);
    } catch (err) {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSaved = (updated) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const activeCount = users.filter((u) => u.routing_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Lead Routing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure which team members receive new leads, their workload cap, and category preferences.
          </p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/80 space-y-1">
        <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
          <Zap className="w-4 h-4 text-primary" />
          How auto-routing works
        </div>
        <p>When a new lead is created, the system automatically picks the team member with the fewest active leads who:</p>
        <ul className="list-disc list-inside space-y-0.5 mt-1 text-xs">
          <li>Has routing turned <strong>Active</strong></li>
          <li>Handles the lead's category (<strong>High-Value</strong> or <strong>Standard</strong>)</li>
          <li>Is under their <strong>Max Active Leads</strong> cap</li>
        </ul>
        <p className="text-xs mt-1.5">The assigned member receives an <strong>SMS notification</strong> with the lead's name, business, phone, score, and problem summary.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-4 h-4" />
          {users.length} total users
        </span>
        <span className={`flex items-center gap-1.5 font-semibold ${activeCount > 0 ? "text-green-700" : "text-amber-600"}`}>
          <div className={`w-2 h-2 rounded-full ${activeCount > 0 ? "bg-green-500" : "bg-amber-400"}`} />
          {activeCount} active in routing
        </span>
      </div>

      {/* User cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading team members…
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No users found.</p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <UserRoutingCard key={user.id} user={user} onSave={handleUserSaved} />
          ))}
        </div>
      )}
    </div>
  );
}