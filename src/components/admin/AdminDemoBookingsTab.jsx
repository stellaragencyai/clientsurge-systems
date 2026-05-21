/**
 * AdminDemoBookingsTab - #531
 * Shows DemoRequest entity records with complete/no-show/reschedule actions.
 */
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, RotateCcw, XCircle } from "lucide-react";
import { DemoRequest } from "@/api/entities";
import {
  DEMO_BOOKING_ACTIONS,
  DEMO_BOOKING_STATUSES,
  filterDemoBookingsByStatus,
  formatDemoBookingDateTime,
  getDemoBookingStatusMeta,
  normalizeDemoBookingStatus,
} from "@/lib/demoBookings";

const ACTION_ICONS = {
  completed: CheckCircle2,
  no_show: XCircle,
  rescheduled: RotateCcw,
};

export default function AdminDemoBookingsTab() {
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadDemos();
  }, []);

  const loadDemos = async () => {
    setLoading(true);
    try {
      const data = await DemoRequest.list("-created_date", 100);
      setDemos(data || []);
    } catch (error) {
      console.error("Failed to load demos:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const normalizedStatus = normalizeDemoBookingStatus(status);
    setUpdating(id);
    try {
      await DemoRequest.update(id, {
        status: normalizedStatus,
        status_updated_at: new Date().toISOString(),
      });
      setDemos((current) =>
        current.map((demo) => demo.id === id ? { ...demo, status: normalizedStatus } : demo)
      );
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filterDemoBookingsByStatus(demos, filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
          Demo Bookings <span style={{ color: "#6B7280", fontSize: 14, fontWeight: 400 }}>({demos.length})</span>
        </h2>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter demo bookings by status"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 13,
          }}
        >
          <option value="all">All Statuses</option>
          {DEMO_BOOKING_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: "#6B7280", padding: 40, textAlign: "center" }}>Loading demos...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#6B7280", padding: 40, textAlign: "center" }}>No demo bookings yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((demo) => {
            const status = getDemoBookingStatusMeta(demo.status);
            return (
              <div
                key={demo.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 220 }}>
                  <p style={{ color: "#fff", fontWeight: 700, margin: "0 0 2px", fontSize: 14 }}>{demo.business_name || demo.full_name || "Unknown"}</p>
                  <p style={{ color: "#9CA3AF", fontSize: 12, margin: 0 }}>{demo.email || "No email"} · {demo.phone || "No phone"}</p>
                </div>
                <div style={{ minWidth: 150 }}>
                  <p style={{ color: "#9CA3AF", fontSize: 11, margin: "0 0 2px", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock3 size={12} /> Scheduled
                  </p>
                  <p style={{ color: "#D1D5DB", fontSize: 13, margin: 0 }}>{formatDemoBookingDateTime(demo)}</p>
                </div>
                <div style={{ minWidth: 92 }}>
                  <span style={{
                    background: `${status.tone}20`,
                    color: status.tone,
                    border: `1px solid ${status.tone}40`,
                    borderRadius: 9999,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}>
                    {status.label}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {DEMO_BOOKING_ACTIONS.map((action) => {
                    const Icon = ACTION_ICONS[action.value];
                    return (
                      <button
                        key={action.value}
                        type="button"
                        onClick={() => updateStatus(demo.id, action.value)}
                        disabled={updating === demo.id}
                        title={`Mark demo ${action.label.toLowerCase()}`}
                        aria-label={`Mark demo ${action.label.toLowerCase()}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#D1D5DB",
                          borderRadius: 8,
                          padding: "5px 8px",
                          fontSize: 12,
                          opacity: updating === demo.id ? 0.5 : 1,
                          cursor: updating === demo.id ? "wait" : "pointer",
                        }}
                      >
                        <Icon size={13} /> {action.label}
                      </button>
                    );
                  })}
                </div>
                <select
                  onChange={(event) => updateStatus(demo.id, event.target.value)}
                  value={normalizeDemoBookingStatus(demo.status)}
                  disabled={updating === demo.id}
                  aria-label="Set demo booking status"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#D1D5DB",
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 12,
                  }}
                >
                  {DEMO_BOOKING_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
