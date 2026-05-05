import AdminShell from "@/components/admin/AdminShell";
import AutomationsPanel from "@/components/admin/AutomationsPanel";

export default function AdminAutomation() {
  return (
    <AdminShell title="System Automations" activeId="automations">
      <AutomationsPanel />
    </AdminShell>
  );
}