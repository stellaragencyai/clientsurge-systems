import { CheckCircle2 } from "lucide-react";

const TEMPLATES = [
  {
    id: "fast-responder",
    name: "Fast Responder",
    desc: "Instant SMS replies to new leads",
    services: ["instant_lead_response"],
    setup: "$297",
    monthly: "$97/mo",
  },
  {
    id: "nurture-master",
    name: "Nurture Master",
    desc: "Instant reply + 14-day email follow-up",
    services: ["instant_lead_response", "nurture_sequence_14d"],
    setup: "$694",
    monthly: "$224/mo",
  },
  {
    id: "full-stack",
    name: "Full Stack",
    desc: "Complete automation: reply, follow-up, booking, missed calls",
    services: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ],
    setup: "$1,188",
    monthly: "$369/mo",
    popular: true,
  },
];

export default function QuickSetupStep3({ value, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
          Choose your automation level
        </h2>
        <p className="text-muted-foreground">
          Pick a starter template or customize below. Upgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onChange(template.id)}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              value === template.id
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-border hover:border-primary/30"
            }`}
          >
            {template.popular && (
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                Popular
              </div>
            )}

            <h3 className="font-semibold text-foreground mb-1 text-lg">{template.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{template.desc}</p>

            <div className="space-y-2 mb-4">
              {template.services.map((service) => (
                <div key={service} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs text-foreground/70">
                    {service.replace(/_/g, " ").replace("instant_lead_response", "Instant Response")}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground mb-1">Setup</p>
              <p className="font-bold text-foreground text-lg">{template.setup}</p>
              <p className="text-xs text-muted-foreground mt-2">{template.monthly}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">💡 Tip:</span> All plans include setup by our team and
          24/7 support. Cancel anytime, no contracts.
        </p>
      </div>
    </div>
  );
}