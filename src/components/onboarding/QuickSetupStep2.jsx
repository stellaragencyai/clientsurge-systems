import { ChevronRight } from "lucide-react";

const CRM_OPTIONS = [
  { id: "google-calendar", name: "Google Calendar", desc: "Free, easy sync" },
  { id: "acuity", name: "Acuity Scheduling", desc: "Booking platform" },
  { id: "calendly", name: "Calendly", desc: "Simple scheduling" },
  { id: "zapier", name: "Zapier / n8n", desc: "Advanced automation" },
  { id: "manual", name: "Manual / Other", desc: "Tell us your setup" },
];

export default function QuickSetupStep2({ formData, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
          How do you manage bookings?
        </h2>
        <p className="text-muted-foreground">Select your booking system or calendar tool.</p>
      </div>

      <div className="space-y-3">
        {CRM_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange("crm_type", option.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              formData.crm_type === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{option.name}</p>
                <p className="text-sm text-muted-foreground">{option.desc}</p>
              </div>
              {formData.crm_type === option.id && <ChevronRight className="w-5 h-5 text-primary" />}
            </div>
          </button>
        ))}
      </div>

      {formData.crm_type && formData.crm_type !== "manual" && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Booking Link {formData.crm_type === "manual" && "(Optional)"}
          </label>
          <input
            type="url"
            placeholder="https://your-booking-link.com"
            value={formData.booking_link}
            onChange={(e) => onChange("booking_link", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}