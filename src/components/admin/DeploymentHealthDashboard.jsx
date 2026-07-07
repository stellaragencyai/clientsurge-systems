import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Loader2, Activity, Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Healthy' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Warning' },
  critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Critical' },
  unknown: { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Unknown' },
};

const MODULE_LABELS = {
  instant_lead_response: 'Instant Lead Response',
  missed_call_text_back: 'Missed Call Text Back',
  lead_nurture: 'Lead Nurture (14d)',
  ai_booking_agent: 'AI Booking Agent',
  daily_digest: 'Daily Business Digest',
  review_reactivation: 'Review & Reactivation',
};

const INSTALL_STATUS_LABELS = {
  not_started: 'Not Started',
  installing: 'Installing',
  installed: 'Installed',
  verified: 'Verified',
  failed: 'Failed',
};

export default function DeploymentHealthDashboard() {
  const [deployments, setDeployments] = useState([]);
  const [healthResults, setHealthResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchDeployments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.ClientDeployment.list('-created_date', 50);
      setDeployments(res || []);
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const runHealthCheck = async (deploymentId) => {
    setCheckingId(deploymentId);
    try {
      const res = await base44.functions.invoke('calculateDeploymentHealth', { deployment_id: deploymentId });
      setHealthResults(prev => ({ ...prev, [deploymentId]: res.data }));
      // Refresh deployments to pick up cached health_status
      await fetchDeployments();
    } catch (err) {
      console.error('Health check failed:', err);
    } finally {
      setCheckingId(null);
    }
  };

  const runAllHealthChecks = async () => {
    for (const dep of deployments) {
      await runHealthCheck(dep.id);
    }
  };

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
          <p className="text-sm text-muted-foreground">No ClientDeployments found.</p>
          <p className="text-xs text-muted-foreground mt-1">Deployments will appear here once orders are fulfilled.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Deployment Health Manager</h2>
          <p className="text-xs text-muted-foreground">Monitor and validate all ClientDeployment systems</p>
        </div>
        <Button variant="outline" size="sm" onClick={runAllHealthChecks} disabled={!!checkingId}>
          {checkingId ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
          Run All Health Checks
        </Button>
      </div>

      <div className="space-y-3">
        {deployments.map((dep) => {
          const health = healthResults[dep.id];
          const statusKey = health?.health_status || dep.health_status || 'unknown';
          const cfg = getStatusConfig(statusKey);
          const StatusIcon = cfg.icon;
          const isExpanded = expandedId === dep.id;
          const isChecking = checkingId === dep.id;

          return (
            <Card key={dep.id} className={`${cfg.border} ${cfg.bg}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`flex-shrink-0 mt-0.5 ${cfg.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold text-foreground truncate">
                        {dep.industry_slug?.replace(/-/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown Industry'}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">{dep.package_tier_key || '—'}</Badge>
                        <Badge variant="outline" className="text-xs">{dep.deployment_status}</Badge>
                        <span className="text-xs text-muted-foreground">{dep.client_id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runHealthCheck(dep.id)}
                      disabled={isChecking}
                    >
                      {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : dep.id)}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Health Summary */}
                <p className={`text-xs ${cfg.color} font-medium mb-3`}>
                  {health?.health_summary || dep.health_summary || 'Health status not yet computed'}
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <div className="rounded-lg border border-border bg-white/60 p-2">
                    <p className="text-xs text-muted-foreground">Modules Active</p>
                    <p className="text-sm font-bold text-foreground">{dep.activated_modules?.length || 0}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-white/60 p-2">
                    <p className="text-xs text-muted-foreground">Last Check</p>
                    <p className="text-xs font-medium text-foreground">{formatDate(dep.health_checked_at)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-white/60 p-2">
                    <p className="text-xs text-muted-foreground">Automation Runs</p>
                    <p className="text-sm font-bold text-foreground">{dep.analytics?.automation_executions || 0}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-white/60 p-2">
                    <p className="text-xs text-muted-foreground">Leads Generated</p>
                    <p className="text-sm font-bold text-foreground">{dep.analytics?.leads_generated || 0}</p>
                  </div>
                </div>

                {/* Expanded Module Health */}
                {isExpanded && (
                  <div className="space-y-2 mt-3 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Module Health</p>
                    {health?.module_health?.length > 0 ? (
                      health.module_health.map((mh) => {
                        const mCfg = STATUS_CONFIG[mh.execution_status === 'healthy' ? 'healthy' : mh.execution_status === 'critical' ? 'critical' : 'warning'];
                        const MIcon = mCfg.icon;
                        return (
                          <div key={mh.module_key} className="flex items-start gap-2 rounded-lg border border-border bg-white/50 p-2.5">
                            <div className={`flex-shrink-0 mt-0.5 ${mCfg.color}`}>
                              <MIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-foreground">{MODULE_LABELS[mh.module_key] || mh.module_key}</p>
                                <Badge variant="outline" className="text-xs">{INSTALL_STATUS_LABELS[mh.install_status] || mh.install_status}</Badge>
                              </div>
                              {mh.issues?.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">{mh.issues.join('; ')}</p>
                              )}
                              {mh.last_error && (
                                <p className="text-xs text-red-600 mt-0.5">Last error: {mh.last_error}</p>
                              )}
                              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                <span>✓ {mh.recent_successes} ok</span>
                                <span>✗ {mh.recent_failures} failed</span>
                                <span>⊘ {mh.recent_blocked} blocked</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground">No execution history yet. Run a health check to see module status.</p>
                    )}

                    {/* Integration Health */}
                    {health && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Integration Health</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            Twilio: {health.integration_health?.twilio_enabled ? '✓ Enabled' : '✗ Disabled'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Resend: {health.integration_health?.resend_enabled ? '✓ Enabled' : '✗ Disabled'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Blockers & Warnings */}
                    {health?.blockers?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Blockers</p>
                        {health.blockers.map((b, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/50 p-2 mb-1">
                            <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-red-700">{b.message}</p>
                              {b.suggested_action && <p className="text-xs text-red-600 mt-0.5">→ {b.suggested_action}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {health?.warnings?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">Warnings</p>
                        {health.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50/50 p-2 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-yellow-700">{w.message}</p>
                              {w.suggested_action && <p className="text-xs text-yellow-600 mt-0.5">→ {w.suggested_action}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Unresolved Errors from deployment record */}
                    {dep.errors?.filter(e => !e.resolved_at).length > 0 && !health && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Unresolved Errors</p>
                        {dep.errors.filter(e => !e.resolved_at).map((err, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/50 p-2 mb-1">
                            <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-red-700">{err.message}</p>
                              {err.suggested_action && <p className="text-xs text-red-600 mt-0.5">→ {err.suggested_action}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}