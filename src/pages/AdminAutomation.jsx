import AutomationsPanel from "@/components/admin/AutomationsPanel";

export default function AdminAutomation() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">System Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage all automation services across client orders
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AutomationsPanel />
      </div>
    </div>
  );
}