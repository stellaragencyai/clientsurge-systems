import AdminShell from "@/components/admin/AdminShell";
import AutomationActivityPanel from "@/components/admin/AutomationActivityPanel";

export default function AutomationActivity() {
  return (
    <AdminShell title="Automation Activity" activeId="automation-activity">
      <AutomationActivityPanel />
    </AdminShell>
  );
}