import React, { useState, useEffect } from 'react';
import { Zap, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const AUTOMATION_TYPES = [
  { key: 'instant_lead_response', label: 'Instant Lead Response', icon: '⚡' },
  { key: 'missed_call_text_back', label: 'Missed Call Text Back', icon: '📱' },
  { key: 'nurture_sequence', label: 'Nurture Sequence', icon: '🌱' },
  { key: 'ai_booking_agent', label: 'AI Booking Agent', icon: '🤖' },
];

export default function AutomationEngineModule() {
  const [automations, setAutomations] = useState([]);
  const [insights, setInsights] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [autoRules, ruleInsights] = await Promise.all([
          base44.asServiceRole.entities.AutomationRule.filter({}, '-created_date', 20),
          base44.asServiceRole.entities.AutomationRuleInsights.filter({}, '-created_date', 20),
        ]);

        setAutomations(autoRules || []);
        const insightMap = {};
        (ruleInsights || []).forEach((insight) => {
          insightMap[insight.rule_id] = insight;
        });
        setInsights(insightMap);
      } catch (e) {
        console.error('Failed to load automations:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading automation engine...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Automation Engine</h1>
        <p className="text-muted-foreground">Active workflows and performance metrics.</p>
      </div>

      {/* Automation Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AUTOMATION_TYPES.map((type) => {
          const active = automations.find((a) => a.rule_name?.includes(type.label));
          const insight = active ? insights[active.id] : null;

          return (
            <button
              key={type.key}
              className="rounded-xl border-2 border-border hover:border-primary bg-card p-6 text-left transition-all hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{type.icon}</span>
                {active && active.status === 'active' && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{type.label}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                {active ? (
                  <>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={active.status === 'active' ? 'text-green-600' : 'text-yellow-600'}>
                        {active.status}
                      </span>
                    </p>
                    {insight && (
                      <>
                        <p>
                          <strong>Success Rate:</strong> {(insight.success_rate || 0).toFixed(1)}%
                        </p>
                        <p>
                          <strong>Triggered:</strong> {insight.total_executions || 0}x
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-xs">Not configured</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Rules List */}
      {automations.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">All Active Rules</h2>
          <div className="divide-y divide-border">
            {automations.slice(0, 5).map((rule) => (
              <button
                key={rule.id}
                className="w-full py-3 text-left hover:bg-muted/50 transition-colors first:pt-0 last:pb-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{rule.rule_name || 'Unnamed Rule'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rule.condition || 'No condition'} → {rule.action || 'No action'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    rule.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {rule.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}