import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import SystemHealthScorePanel from './diagnostics/SystemHealthScorePanel';
import FailureDetectionPanel from './diagnostics/FailureDetectionPanel';
import FailurePatternPanel from './diagnostics/FailurePatternPanel';
import FixRecommendationsPanel from './diagnostics/FixRecommendationsPanel';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function SystemHealthDiagnosticsModule({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const [failedJobs, errorEvents, allEvents, allJobs, rules, simResults] = await Promise.all([
        base44.asServiceRole.entities.AutomationJob.filter({ status: 'failed' }, '-created_date', 50).catch(() => []),
        base44.asServiceRole.entities.CommunicationEvent.filter({ status: 'failed' }, '-created_date', 50).catch(() => []),
        base44.asServiceRole.entities.CommunicationEvent.filter({}, '-created_date', 200).catch(() => []),
        base44.asServiceRole.entities.AutomationJob.filter({}, '-created_date', 200).catch(() => []),
        base44.asServiceRole.entities.AutomationRule.filter({}, '-created_date', 100).catch(() => []),
        base44.asServiceRole.entities.Leads.filter({ import_source: 'simulation' }, '-created_date', 20).catch(() => []),
      ]);

      const totalEvents = allEvents.length || 1;
      const failedEvents = errorEvents.length;
      const totalJobs = allJobs.length || 1;
      const failedJobCount = failedJobs.length;
      const activeRules = (rules || []).filter(r => r.status === 'active').length;
      const totalRules = rules.length || 1;
      const inactiveRules = (rules || []).filter(r => r.status !== 'active');

      // Score components (each out of 100, weighted)
      const messagingScore = Math.round(((totalEvents - failedEvents) / totalEvents) * 100);
      const automationScore = Math.round(((totalJobs - failedJobCount) / totalJobs) * 100);
      const rulesScore = Math.round((activeRules / totalRules) * 100);
      const overallScore = Math.round((messagingScore * 0.4) + (automationScore * 0.4) + (rulesScore * 0.2));

      // Group failure patterns
      const jobFailurePatterns = groupByField(failedJobs, 'event_type');
      const eventFailurePatterns = groupByField(errorEvents, 'event_type');
      const channelFailures = groupByField(errorEvents, 'channel');

      // Generate fix recommendations
      const recommendations = generateRecommendations({
        failedJobs, errorEvents, inactiveRules, messagingScore, automationScore,
      });

      setData({
        scores: { overall: overallScore, messaging: messagingScore, automation: automationScore, rules: rulesScore },
        failedJobs,
        errorEvents,
        inactiveRules,
        jobFailurePatterns,
        eventFailurePatterns,
        channelFailures,
        recommendations,
        simResults,
        totals: { events: totalEvents, jobs: totalJobs, rules: totalRules },
      });
      setLastRefreshed(new Date());
    } catch (e) {
      console.error('Failed to load diagnostics:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDiagnostics(); }, [loadDiagnostics]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-1.5 h-12 bg-primary rounded-sm flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">System Health & Fix Recommendations</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Live diagnostic layer — monitoring failures, patterns, and actionable fixes.
              {lastRefreshed && (
                <span className="ml-2 text-xs opacity-60">Last refreshed {lastRefreshed.toLocaleTimeString()}</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={loadDiagnostics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          <SystemHealthScorePanel scores={data.scores} totals={data.totals} />
          <FailureDetectionPanel
            failedJobs={data.failedJobs}
            errorEvents={data.errorEvents}
            inactiveRules={data.inactiveRules}
            onNavigate={onNavigate}
          />
          <FailurePatternPanel
            jobPatterns={data.jobFailurePatterns}
            eventPatterns={data.eventFailurePatterns}
            channelFailures={data.channelFailures}
          />
          <FixRecommendationsPanel
            recommendations={data.recommendations}
            simResults={data.simResults}
            onNavigate={onNavigate}
          />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Could not load diagnostics.</p>
      )}
    </div>
  );
}

function groupByField(items, field) {
  const map = {};
  (items || []).forEach(item => {
    const key = item[field] || 'unknown';
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count }));
}

function generateRecommendations({ failedJobs, errorEvents, inactiveRules, messagingScore, automationScore }) {
  const recs = [];

  if (messagingScore < 80) {
    recs.push({
      severity: 'high',
      category: 'Messaging',
      issue: `${100 - messagingScore}% of communication events are failing`,
      cause: 'Likely Twilio/Resend credential issues, incorrect phone numbers, or template errors',
      fix: 'Check Twilio credentials in Admin Settings, verify phone number format, review template variables',
      module: 'system-health',
    });
  }

  if (automationScore < 80) {
    recs.push({
      severity: 'high',
      category: 'Automation Jobs',
      issue: `${100 - automationScore}% of automation jobs are failing`,
      cause: 'Automation rules referencing missing leads, incorrect trigger conditions, or processor errors',
      fix: 'Review failed AutomationJob error messages, check rule conditions, verify lead data completeness',
      module: 'automation',
    });
  }

  if (inactiveRules?.length > 0) {
    recs.push({
      severity: 'medium',
      category: 'Automation Rules',
      issue: `${inactiveRules.length} automation rules are inactive`,
      cause: 'Rules may have been manually disabled or failed during validation',
      fix: `Re-enable rules: ${inactiveRules.slice(0, 3).map(r => r.rule_name || 'Unnamed').join(', ')}`,
      module: 'automation',
    });
  }

  const smsFailures = (errorEvents || []).filter(e => e.channel === 'sms').length;
  if (smsFailures > 5) {
    recs.push({
      severity: 'high',
      category: 'SMS Delivery',
      issue: `${smsFailures} SMS messages failed to deliver`,
      cause: 'Twilio number not verified, opt-out issues, or carrier filtering',
      fix: 'Check Twilio Console for error codes, verify TWILIO_FROM_NUMBER, review opt-out list',
      module: 'system-health',
    });
  }

  const emailFailures = (errorEvents || []).filter(e => e.channel === 'email').length;
  if (emailFailures > 3) {
    recs.push({
      severity: 'medium',
      category: 'Email Delivery',
      issue: `${emailFailures} emails failed to send`,
      cause: 'Resend API key invalid or domain not verified',
      fix: 'Verify RESEND_API_KEY is active, check domain verification in Resend dashboard',
      module: 'system-health',
    });
  }

  if (recs.length === 0) {
    recs.push({
      severity: 'info',
      category: 'System',
      issue: 'No critical issues detected',
      cause: 'System is operating normally',
      fix: 'Continue monitoring — run a simulation to validate end-to-end flow',
      module: 'mission-control',
    });
  }

  return recs;
}