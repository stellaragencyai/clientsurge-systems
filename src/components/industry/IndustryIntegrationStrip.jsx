const INTEGRATIONS = {
  hvac: [
    { name: "ServiceTitan", color: "#FF6B35" },
    { name: "Housecall Pro", color: "#00B4D8" },
    { name: "Jobber", color: "#4CAF50" },
    { name: "FieldEdge", color: "#7B2D8B" },
    { name: "Successware", color: "#E91E63" },
    { name: "Google Calendar", color: "#4285F4" },
  ],
  roofing: [
    { name: "Xactimate", color: "#003087" },
    { name: "RoofSnap", color: "#E74C3C" },
    { name: "AccuLynx", color: "#2E86AB" },
    { name: "JobNimbus", color: "#27AE60" },
    { name: "Leap", color: "#F39C12" },
    { name: "Google Calendar", color: "#4285F4" },
  ],
  contractors: [
    { name: "Buildertrend", color: "#E74C3C" },
    { name: "Procore", color: "#F85220" },
    { name: "CoConstruct", color: "#3498DB" },
    { name: "Housecall Pro", color: "#00B4D8" },
    { name: "Jobber", color: "#4CAF50" },
    { name: "Google Calendar", color: "#4285F4" },
  ],
  "med-spa": [
    { name: "Zenoti", color: "#7C3AED" },
    { name: "Mindbody", color: "#E11D48" },
    { name: "Jane App", color: "#0EA5E9" },
    { name: "Vagaro", color: "#DC2626" },
    { name: "Boulevard", color: "#7C3AED" },
    { name: "Acuity", color: "#4285F4" },
  ],
  dental: [
    { name: "Dentrix", color: "#003087" },
    { name: "Eaglesoft", color: "#E74C3C" },
    { name: "Open Dental", color: "#27AE60" },
    { name: "Carestream", color: "#2E86AB" },
    { name: "Curve Dental", color: "#F39C12" },
    { name: "Google Calendar", color: "#4285F4" },
  ],
  chiropractic: [
    { name: "ChiroTouch", color: "#003087" },
    { name: "Jane App", color: "#0EA5E9" },
    { name: "Genesis", color: "#27AE60" },
    { name: "PrognoCIS", color: "#7B2D8B" },
    { name: "Kareo", color: "#E74C3C" },
    { name: "Google Calendar", color: "#4285F4" },
  ],
};

export default function IndustryIntegrationStrip({ industry }) {
  const integrations = INTEGRATIONS[industry] || INTEGRATIONS.hvac;

  return (
    <div className="px-4 py-8 md:px-6" style={{ background: "#f7fbff", borderTop: "1px solid rgba(0,136,204,0.08)" }}>
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground mb-6">
          Connects with your existing tools
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {integrations.map((int, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(0,136,204,0.15)",
                boxShadow: "0 2px 8px rgba(0,59,143,0.05)",
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: int.color }} />
              <span className="text-xs font-semibold" style={{ color: "rgba(5,19,46,0.75)" }}>{int.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}