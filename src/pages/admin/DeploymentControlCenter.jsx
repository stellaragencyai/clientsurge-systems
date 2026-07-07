import AdminShell from "@/components/admin/AdminShell";
import DeploymentControlCenterPanel from "@/components/admin/DeploymentControlCenterPanel";

export default function DeploymentControlCenter() {
  return (
    <AdminShell title="Deployment Control Center" activeId="deployment-control">
      <DeploymentControlCenterPanel />
    </AdminShell>
  );
}