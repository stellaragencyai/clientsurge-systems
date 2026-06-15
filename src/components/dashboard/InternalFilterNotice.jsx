import { Shield } from "lucide-react";

export default function InternalFilterNotice({ isAdmin = false }) {
  if (!isAdmin) return null;

  return (
    <div
      className="rounded-xl p-3.5 mb-4 flex items-center gap-2.5"
      style={{
        background: "rgba(139,92,246,0.06)",
        border: "1px solid rgba(139,92,246,0.15)",
      }}
    >
      <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#8b5cf6" }} />
      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
        Internal/test records (QA, Smoke, Proof, Runtime, Test, ClientSurge, example.com, handoff-smoke, stripe-webhook-proof, live-proof, Codex, ignore) are excluded from client-facing metrics below.
      </p>
    </div>
  );
}