import LeadCaptureForm from "../components/leads/LeadCaptureForm";

export default function CaptureLeads() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card py-12 px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
            Let's Talk
          </h1>
          <p className="text-muted-foreground">
            Tell us about your business and what you need help with.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          <LeadCaptureForm />
        </div>
      </div>
    </div>
  );
}