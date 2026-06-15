import { Eye } from "lucide-react";

export default function AdminPreviewBanner({ userEmail, linkStatus }) {
  return (
    <div
      className="rounded-2xl p-5 mb-5 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))",
        border: "1px solid rgba(212,175,55,0.25)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}
      >
        <Eye className="w-4 h-4" style={{ color: "#B8941F" }} />
      </div>
      <div>
        <p className="text-[13px] font-bold mb-1" style={{ color: "#B8941F" }}>
          Admin Preview Mode — no client selected
        </p>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          You're logged in as an admin ({userEmail || "unknown"}). No paid client order resolved for this account.
          What you see below is a preview — not a live client dashboard.
        </p>
        {linkStatus && (
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            Link status: {linkStatus}
          </p>
        )}
      </div>
    </div>
  );
}