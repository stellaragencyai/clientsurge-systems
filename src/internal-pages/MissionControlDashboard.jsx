import { useAuth } from '@/lib/AuthContext';
import MissionControlRouter from '../components/mission-control/MissionControlRouter';

export default function MissionControlDashboardPage() {
  const { user } = useAuth();

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Mission Control is available to admins only.</p>
        </div>
      </div>
    );
  }

  return <MissionControlRouter />;
}