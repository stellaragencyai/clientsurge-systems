import AdminShell from "@/components/admin/AdminShell";
import LeadManagementDashboard from "../components/admin/LeadManagementDashboard";

export default function AdminLeads() {
  return (
    <AdminShell title="Leads" activeId="leads">
      <LeadManagementDashboard />
    </AdminShell>
  );
}