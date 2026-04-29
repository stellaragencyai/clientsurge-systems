import { AlertCircle, Clock, ShieldCheck } from "lucide-react";

export default function AutomatedResponsesLog({ services = [], subscription = null }) {
  const liveServices = services.filter((service) => service.install_status === "Live");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div>
            <h3 className="font-semibold text-amber-900">Runtime activity is operator-managed for now</h3>
            <p className="mt-1 text-sm text-amber-800">
              This portal no longer shows sample sends or simulated activity. Detailed CommunicationEvent timelines stay in the operator workspace until a customer-safe event feed is wired.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Services</p>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{liveServices.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">eligible to run real automations when their trigger fires</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Billing Status</p>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{subscription?.billing_status || subscription?.status || "Unknown"}</p>
          <p className="mt-1 text-xs text-muted-foreground">service access follows your subscription state</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Event Feed</p>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-foreground">Manual</p>
          <p className="mt-1 text-xs text-muted-foreground">contact support if you need a detailed send audit during pilot</p>
        </div>
      </div>
    </div>
  );
}
