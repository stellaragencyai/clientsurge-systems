import { useEffect, useState } from "react";
import { ShieldCheck, Database, Globe, Server, Clock, RefreshCw, GitBranch, AlertTriangle, BadgeCheck } from "lucide-react";
import ReleaseProofPanel from './ReleaseProofPanel';

const RELEASE_PROOF_MARKER = "release-proof-2026-07-01.1";
const RELEASE_PROOF_COMMIT = "25b0d5a91b1a8eb8af5ce8de1fb8026cbdcf24e4";
const RELEASE_PROOF_VERIFIED_AT = "2026-07-01 18:05:27 MST";

export default function SystemIdentityPanel() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fields = [
    { label: "App Name", value: "ClientSurge Systems", icon: ShieldCheck },
    { label: "Production App ID", value: "69dc4a79656fdba136d413d3", icon: Database },
    { label: "Production Repo", value: "stellaragencyai/clientsurge-systems", icon: GitBranch },
    { label: "Release Proof Marker", value: RELEASE_PROOF_MARKER, icon: BadgeCheck },
    { label: "Verified Commit", value: RELEASE_PROOF_COMMIT.slice(0, 12), icon: BadgeCheck },
    { label: "Verified At", value: RELEASE_PROOF_VERIFIED_AT, icon: Clock },
    { label: "Deployment Status", value: "Verified: GitHub → Base44 → Live Admin", icon: BadgeCheck },
    { label: "Base44 Reported Source", value: "s3 — internal Base44 storage; live GitHub marker verified", icon: AlertTriangle },
    { label: "Retired Export Repo", value: "stellaragencyai/clientsurgesystems-refined-export", icon: AlertTriangle },
    { label: "Domain", value: "clientsurgesystems.com", icon: Globe },
    { label: "Environment", value: "Production", icon: Server },
    { label: "Last Refreshed", value: now.toLocaleString(), icon: Clock },
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
        <div className="mb-4 rounded-lg border border-emerald-300/50 bg-emerald-50 p-3 text-xs text-emerald-900">
          <div className="flex items-start gap-2">
            <BadgeCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <p>
              Release chain verified: GitHub commit <strong>{RELEASE_PROOF_COMMIT.slice(0, 12)}</strong> introduced marker <strong>{RELEASE_PROOF_MARKER}</strong>, and that marker appeared in the live Base44 admin dashboard. Production work belongs in <strong>stellaragencyai/clientsurge-systems</strong>; the refined-export repo remains archive-only.
            </p>
          </div>
        </div>
        <div className="mb-4 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <p>
              Base44 still reports <strong>s3</strong> as its internal source/storage value. Treat that as an implementation detail unless a future GitHub marker fails to appear live. Every future production fix still needs GitHub commit, workflow/build proof, Base44 sync/publish proof, and live-site smoke proof.
            </p>
          </div>
        </div>
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
