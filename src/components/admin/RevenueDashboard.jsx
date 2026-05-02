/**
 * RevenueDashboard — MRR, collections, outstanding invoices, upcoming renewals.
 * BUILD #4
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertCircle, CreditCard, DollarSign, RefreshCw,
  TrendingUp, Calendar, AlertTriangle, CheckCircle2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function StatCard({ label, value, sub, icon: Icon, color = "blue", onClick }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <div
      className={`rounded-xl border p-5 ${colors[color]} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
        {Icon && <Icon className="h-4 w-4 opacity-60" />}
      </div>
      <p className="text-3xl font-bold">{value ?? "—"}</p>
      {sub && <p className="mt-1.5 text-xs opacity-70">{sub}</p>}
    </div>
  );
}

function fmt(cents) {
  if (cents == null) return "$0";
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function RevenueDashboard() {
  const [subs, setSubs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [subsData, ordersData, invData] = await Promise.all([
        base44.entities.Subscription.list("-created_date", 200),
        base44.entities.Order.list("-created_date", 200),
        base44.entities.Invoice.list("-created_date", 300),
      ]);
      setSubs(subsData || []);
      setOrders(ordersData || []);
      setInvoices(invData || []);
    } catch (err) {
      setError(err?.message || "Failed to load revenue data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Derived metrics
  const activeSubs = subs.filter(s => s.status === "active");
  const mrr = activeSubs.reduce((sum, s) => sum + (s.monthly_rate || 0) * 100, 0);
  const arr = mrr * 12;

  const totalCollected = invoices
    .filter(i => i.payment_status === "paid")
    .reduce((sum, i) => sum + (i.amount || 0) * 100, 0);

  const totalOutstanding = invoices
    .filter(i => ["unpaid", "partially_paid"].includes(i.payment_status))
    .reduce((sum, i) => sum + (i.amount_outstanding || i.amount || 0) * 100, 0);

  const overdueInvoices = invoices.filter(i =>
    i.payment_status !== "paid" && i.due_date && new Date(i.due_date) < new Date()
  );

  const failedSubs = subs.filter(s => s.status === "past_due" || s.status === "unpaid");

  // Upcoming renewals in next 30 days
  const now = Date.now();
  const in30 = now + 30 * 86400000;
  const upcomingRenewals = activeSubs.filter(s => {
    if (!s.current_period_end) return false;
    const t = new Date(s.current_period_end).getTime();
    return t > now && t < in30;
  }).sort((a, b) => new Date(a.current_period_end) - new Date(b.current_period_end));

  // Revenue by month (last 6 months from paid invoices)
  const monthlyMap = {};
  invoices.filter(i => i.payment_status === "paid" && i.paid_at).forEach(inv => {
    const m = new Date(inv.paid_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthlyMap[m] = (monthlyMap[m] || 0) + (inv.amount || 0);
  });
  const monthlyChart = Object.entries(monthlyMap)
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));

  const filteredInvoices = invoiceFilter === "all" ? invoices
    : invoices.filter(i => i.payment_status === invoiceFilter);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Revenue Dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">MRR, collections, outstanding invoices & renewals.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="MRR" value={fmt(mrr)} sub={`${activeSubs.length} active subscriptions`} icon={TrendingUp} color="green" />
        <StatCard label="ARR" value={fmt(arr)} sub="Annualized recurring revenue" icon={DollarSign} color="blue" />
        <StatCard label="Total Collected" value={fmt(totalCollected)} sub="All-time paid invoices" icon={CheckCircle2} color="emerald" />
        <StatCard label="Outstanding" value={fmt(totalOutstanding)} sub={`${overdueInvoices.length} overdue`} icon={AlertTriangle} color={totalOutstanding > 0 ? "amber" : "green"} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Subscriptions" value={activeSubs.length} icon={CreditCard} color="blue" />
        <StatCard label="Failed / Past Due" value={failedSubs.length} sub="Churn risk" icon={AlertCircle} color={failedSubs.length > 0 ? "red" : "green"} />
        <StatCard label="Upcoming Renewals" value={upcomingRenewals.length} sub="Next 30 days" icon={Calendar} color="purple" />
        <StatCard label="Total Orders" value={orders.length} icon={DollarSign} color="blue" />
      </div>

      {/* Revenue chart */}
      {monthlyChart.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="font-semibold text-foreground mb-1">Monthly Collected Revenue</h3>
          <p className="text-xs text-muted-foreground mb-4">Based on paid invoice records</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyChart} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={v => [`$${v}`, "Collected"]} />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Upcoming renewals */}
      {upcomingRenewals.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Upcoming Renewals (Next 30 Days)
          </h3>
          <div className="space-y-2">
            {upcomingRenewals.map(sub => {
              const daysLeft = Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / 86400000);
              return (
                <div key={sub.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sub.client_email || "Unknown client"}</p>
                    <p className="text-xs text-muted-foreground">{sub.plan_type} · {fmt((sub.monthly_rate || 0) * 100)}/mo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{fmtDate(sub.current_period_end)}</p>
                    <p className={`text-xs font-bold ${daysLeft <= 7 ? "text-red-600" : "text-amber-600"}`}>{daysLeft}d</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Failed subs */}
      {failedSubs.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Churn Risk — Failed / Past Due Subscriptions
          </h3>
          <div className="space-y-2">
            {failedSubs.map(sub => (
              <div key={sub.id} className="flex items-center justify-between rounded-lg bg-white border border-red-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{sub.client_email}</p>
                  <p className="text-xs text-muted-foreground">{sub.plan_type}</p>
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">{sub.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice table */}
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Invoice History</h3>
          <div className="flex gap-1.5">
            {["all", "unpaid", "paid", "overdue"].map(f => (
              <button
                key={f}
                onClick={() => setInvoiceFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${invoiceFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="border-b border-border">
              <tr>
                <th className="py-2 pr-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice</th>
                <th className="py-2 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
                <th className="py-2 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                <th className="py-2 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due</th>
                <th className="py-2 pl-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.slice(0, 50).map(inv => {
                const isOverdue = inv.payment_status !== "paid" && inv.due_date && new Date(inv.due_date) < new Date();
                return (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 pr-4 font-medium text-foreground">{inv.invoice_number || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{inv.client_email || "—"}</td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground">${(inv.amount || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{fmtDate(inv.due_date)}</td>
                    <td className="py-3 pl-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        inv.payment_status === "paid" ? "bg-green-100 text-green-700" :
                        isOverdue ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {isOverdue && inv.payment_status !== "paid" ? "overdue" : inv.payment_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}