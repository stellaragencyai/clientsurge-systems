import { Eye, ChevronDown } from "lucide-react";
import { useState } from "react";

const STATES = [
  { key: "paid", label: "Paid — Awaiting Setup", color: "#f59e0b" },
  { key: "ready_for_install", label: "Ready for Install", color: "#0088CC" },
  { key: "configuring", label: "Configuring", color: "#8b5cf6" },
  { key: "testing", label: "Testing", color: "#f59e0b" },
  { key: "live", label: "Live", color: "#22c55e" },
  { key: "error", label: "Error — Needs Attention", color: "#ef4444" },
];

export default function AdminPreviewToggler({ currentState, onStateChange, userEmail }) {
  const [open, setOpen] = useState(false);

  const active = STATES.find((s) => s.key === currentState) || STATES[0];

  return (
    <div className="relative mb-5">
      <div
        className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer select-none transition-all"
        style={{
          background: `linear-gradient(135deg, ${active.color}10, ${active.color}05)`,
          border: `1px solid ${active.color}30`,
        }}
        onClick={() => setOpen(!open)}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${active.color}20`, border: `1px solid ${active.color}35` }}
        >
          <Eye className="w-4 h-4" style={{ color: active.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black uppercase tracking-[0.15em] mb-0.5" style={{ color: active.color }}>
            Admin Preview
          </p>
          <p className="text-[14px] font-bold text-foreground truncate">
            Simulating: {active.label}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Logged in as {userEmail || "admin"} — click to switch states
          </p>
        </div>
        <ChevronDown
          className="w-4 h-4 text-muted-foreground transition-transform flex-shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
        >
          {STATES.map((state) => {
            const isActive = state.key === currentState;
            return (
              <button
                key={state.key}
                onClick={(e) => {
                  e.stopPropagation();
                  onStateChange(state.key);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                style={{
                  background: isActive ? `${state.color}08` : "transparent",
                  borderLeft: isActive ? `3px solid ${state.color}` : "3px solid transparent",
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: state.color, boxShadow: isActive ? `0 0 8px ${state.color}50` : "none" }}
                />
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: isActive ? state.color : "hsl(var(--foreground))" }}
                >
                  {state.label}
                </span>
                {isActive && (
                  <span className="ml-auto text-[11px] font-bold" style={{ color: state.color }}>
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Backdrop to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}