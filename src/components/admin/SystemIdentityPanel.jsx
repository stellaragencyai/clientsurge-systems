import { useEffect, useState } from "react";
import { ShieldCheck, Database, Globe, Server, Clock, RefreshCw } from "lucide-react";
import ReleaseProofPanel from './ReleaseProofPanel';

export default function SystemIdentityPanel() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fields = [
    { label: "App Name", value: "ClientSurge Systems", icon: ShieldCheck },
    { label: "Production App ID", value: "69dc4a79656fdba136d413d3", icon: Database },
    { label: "Domain", value: "clientsurgesystems.com", icon: Globe },
    { label: "Environment", value: "Production", icon: Server },
    { label: "Last Verified", value: now.toLocaleString(), icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">System Identity</h2>
          </div>
          <RefreshCw className="w-3 h-3 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Internal system identity reference. Not visible to public visitors.
        </p>
        <div className="space-y-3">
          {fields.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
              </div>
              <span className="text-sm font-medium text-foreground text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <ReleaseProofPanel />
    </div>
  );
}
