import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle, Clock, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import MetricCard from '@/components/design-system/MetricCard';
import StatusBadge from '@/components/design-system/StatusBadge';
import PanelContainer from '@/components/design-system/PanelContainer';

export default function LaunchCommandCenter() {
  const [launchState, setLaunchState] = useState(null);
  const [checks, setChecks] = useState([]);
  const [gtmOverview, setGtmOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLaunchData();
  }, []);

  const loadLaunchData = async () => {
    try {
      // Fetch the active launch readiness state
      const launches = await base44.entities.LaunchReadinessState.filter({ system_status: { $ne: 'live' } });
      if (launches.length > 0) {
        setLaunchState(launches[0]);

        // Fetch checks for this launch
        const checkList = await base44.entities.LaunchChecklistStatus.filter({
          launch_id: launches[0].launch_id,
        });
        setChecks(checkList);

        // Fetch GTM overview
        const gtm = await base44.entities.GTMLaunchOverview.filter({
          launch_id: launches[0].launch_id,
        });
        if (gtm.length > 0) {
          setGtmOverview(gtm[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load launch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading launch data...</div>;

  if (!launchState) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No launch readiness state found.</p>
      </div>
    );
  }

  // Categorize checks
  const checksByStatus = {
    pass: checks.filter(c => c.status === 'pass'),
    warning: checks.filter(c => c.status === 'warning'),
    fail: checks.filter(c => c.status === 'fail'),
    pending: checks.filter(c => c.status === 'pending'),
  };

  const blockers = checks.filter(c => c.blocker && c.status !== 'pass');
  const readyToLaunch = launchState.overall_readiness_score >= 85 && blockers.length === 0;

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Launch Command Center</h1>
        <p className="text-muted-foreground">Real-time system readiness and go-to-market status</p>
      </div>

      {/* CRITICAL ALERT BANNER */}
      {blockers.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Critical Blockers</h3>
              <p className="text-sm text-red-800 mt-1">{blockers.length} critical issue(s) preventing launch:</p>
              <ul className="mt-2 space-y-1">
                {blockers.map(b => (
                  <li key={b.check_id} className="text-sm text-red-800 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    {b.check_name}: {b.detected_issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* GO/NO-GO STATUS */}
      <PanelContainer title="Launch Status" icon={<Zap className="w-4 h-4" />}>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Readiness Score</p>
            <p className="text-3xl font-bold text-foreground">{launchState.overall_readiness_score}</p>
            <p className="text-xs text-muted-foreground mt-1">/100</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Status</p>
            <StatusBadge status={launchState.system_status} label={launchState.system_status.toUpperCase()} size="md" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Decision</p>
            <div className={`px-3 py-2 rounded-lg text-sm font-semibold inline-block ${
              readyToLaunch
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {readyToLaunch ? '✓ GO' : 'NOT READY'}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Approved</p>
            <p className="text-sm font-semibold">
              {launchState.approved_by ? '✓ Yes' : 'Pending'}
            </p>
            {launchState.approved_at && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(launchState.approved_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </PanelContainer>

      {/* HEALTH SCORE BREAKDOWN */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="System Health"
          value={launchState.system_health_score}
          unit="%"
          status={launchState.system_health_score >= 80 ? 'healthy' : launchState.system_health_score >= 60 ? 'degraded' : 'failed'}
          size="md"
        />
        <MetricCard
          title="GTM Health"
          value={launchState.gtm_health_score}
          unit="%"
          status={launchState.gtm_health_score >= 75 ? 'healthy' : launchState.gtm_health_score >= 50 ? 'degraded' : 'failed'}
          size="md"
        />
        <MetricCard
          title="Funnel Health"
          value={launchState.funnel_health_score}
          unit="%"
          status={launchState.funnel_health_score >= 70 ? 'healthy' : launchState.funnel_health_score >= 45 ? 'degraded' : 'failed'}
          size="md"
        />
        <MetricCard
          title="Ops Health"
          value={launchState.ops_health_score}
          unit="%"
          status={launchState.ops_health_score >= 80 ? 'healthy' : launchState.ops_health_score >= 60 ? 'degraded' : 'failed'}
          size="md"
        />
      </div>

      {/* SYSTEM CHECKS */}
      <PanelContainer title="Core System Checks" icon={<CheckCircle className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(launchState.system_checks).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 p-3 rounded-lg border border-border">
              {value ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
              <span className={`ml-auto text-xs font-semibold ${value ? 'text-green-600' : 'text-red-600'}`}>
                {value ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>
      </PanelContainer>

      {/* READINESS CHECKLIST SUMMARY */}
      <PanelContainer title="Launch Readiness Checklist" icon={<Clock className="w-4 h-4" />}>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pass</span>
            <span className="font-semibold">{checksByStatus.pass.length}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${(checksByStatus.pass.length / checks.length) * 100}%` }}
            />
          </div>

          {checksByStatus.fail.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-red-600 mb-2">Failed Checks ({checksByStatus.fail.length})</p>
              <ul className="space-y-2">
                {checksByStatus.fail.map(check => (
                  <li key={check.check_id} className="text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{check.check_name}</p>
                      {check.detected_issue && (
                        <p className="text-xs text-muted-foreground mt-1">{check.detected_issue}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {checksByStatus.warning.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-yellow-600 mb-2">Warnings ({checksByStatus.warning.length})</p>
              <ul className="space-y-2">
                {checksByStatus.warning.map(check => (
                  <li key={check.check_id} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{check.check_name}</p>
                      {check.detected_issue && (
                        <p className="text-xs text-muted-foreground mt-1">{check.detected_issue}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PanelContainer>

      {/* GTM PERFORMANCE */}
      {gtmOverview && (
        <PanelContainer title="Go-To-Market Performance" icon={<TrendingUp className="w-4 h-4" />}>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              title="Active Campaigns"
              value={gtmOverview.total_campaigns_active}
              status="healthy"
              size="md"
            />
            <MetricCard
              title="Conversion Rate"
              value={gtmOverview.overall_conversion_rate}
              unit="%"
              status={gtmOverview.overall_conversion_rate >= 2 ? 'healthy' : 'degraded'}
              size="md"
            />
            <MetricCard
              title="Revenue/Lead"
              value={`$${gtmOverview.revenue_per_lead.toFixed(0)}`}
              status="healthy"
              size="md"
            />
            <MetricCard
              title="Health Score"
              value={gtmOverview.acquisition_health_score}
              unit="%"
              status={gtmOverview.acquisition_health_score >= 75 ? 'healthy' : 'degraded'}
              size="md"
            />
          </div>

          {gtmOverview.top_industry_by_conversion && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Top Industry</p>
                  <p className="font-semibold text-foreground capitalize">{gtmOverview.top_industry_by_conversion}</p>
                  <p className="text-xs text-green-600 mt-1">{gtmOverview.top_industry_conversion_rate}% conversion</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Optimization Opportunity</p>
                  <p className="font-semibold text-foreground">{gtmOverview.opportunity_identified}</p>
                  <p className="text-xs text-yellow-600 mt-1">${gtmOverview.estimated_opportunity_value.toLocaleString()} potential</p>
                </div>
              </div>
            </div>
          )}
        </PanelContainer>
      )}

      {/* WARNINGS */}
      {launchState.warning_items && launchState.warning_items.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Warnings</h3>
              <ul className="mt-2 space-y-1">
                {launchState.warning_items.map((w, i) => (
                  <li key={i} className="text-sm text-yellow-800">• {w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* LAST EVALUATION */}
      <div className="text-xs text-muted-foreground text-center">
        Last evaluated: {launchState.last_evaluated_at ? new Date(launchState.last_evaluated_at).toLocaleString() : 'Never'}
      </div>
    </div>
  );
}