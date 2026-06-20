import React, { useState } from 'react';
import {
  FlaskConical, Play, RotateCcw, CheckCircle2, XCircle,
  Clock, AlertTriangle, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PIPELINE_STEPS = [
  { id: 'lead_created',          label: 'Lead Created',           icon: '👤' },
  { id: 'lead_processed',        label: 'Lead Processed',          icon: '⚙️' },
  { id: 'automation_evaluated',  label: 'Automation Evaluated',    icon: '🤖' },
  { id: 'messaging_queued',      label: 'Messaging Queued',        icon: '📤' },
  { id: 'event_logged',          label: 'Event Logged',            icon: '📋' },
  { id: 'funnel_updated',        label: 'Funnel Updated',          icon: '📊' },
  { id: 'completed',             label: 'Completed',               icon: '✅' },
];

const INDUSTRIES = ['med-spa', 'dental', 'hvac', 'roofing', 'chiropractic', 'contractors', 'plumbing'];
const INTENT_LEVELS = ['hot', 'warm', 'cold'];
const SOURCE_TYPES = ['website_form', 'landing_page', 'contact_page', 'inbound_call', 'referral'];

const DEFAULT_LEAD = {
  full_name: 'Test User',
  business_name: 'Acme Test Co',
  email: `sim_${Date.now()}@test-simulation.local`,
  phone: '5550001234',
  industry: 'med-spa',
  intent_level: 'warm',
  source: 'website_form',
};

const DEFAULT_TOGGLES = {
  automation_not_triggered: false,
  messaging_not_sent: false,
  missing_lead_data: false,
  funnel_update_delay: false,
};

function StepCard({ step, result }) {
  const [expanded, setExpanded] = useState(false);

  const status = result?.status || 'pending';
  const statusIcon = {
    success: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    failed:  <XCircle className="w-5 h-5 text-red-500" />,
    pending: <Clock className="w-5 h-5 text-slate-400" />,
    running: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
  }[status];

  const statusBg = {
    success: 'border-green-200 bg-green-50',
    failed:  'border-red-200 bg-red-50',
    pending: 'border-slate-200 bg-white',
    running: 'border-primary/30 bg-primary/5',
  }[status];

  return (
    <div className={`rounded-xl border-2 transition-all ${statusBg}`}>
      <button
        onClick={() => result && setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{step.icon}</span>
          <div>
            <p className="font-semibold text-sm text-foreground">{step.label}</p>
            {result?.timestamp && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(result.timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {statusIcon}
          {result?.logs && (
            expanded
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && result?.logs && (
        <div className="px-4 pb-4 pt-0 space-y-2">
          <div className="rounded-lg bg-slate-900 p-3 max-h-32 overflow-y-auto">
            {result.logs.map((log, i) => (
              <p key={i} className={`text-xs font-mono ${log.type === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
                {log.message}
              </p>
            ))}
          </div>
          {result.warning && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {result.warning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SystemSimulationLab() {
  const [lead, setLead] = useState(DEFAULT_LEAD);
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);
  const [running, setRunning] = useState(false);
  const [stepResults, setStepResults] = useState({});
  const [summary, setSummary] = useState(null);
  const [activeStep, setActiveStep] = useState(null);

  const handleLeadChange = (field, value) => {
    setLead(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const reset = () => {
    setStepResults({});
    setSummary(null);
    setActiveStep(null);
    setLead({ ...DEFAULT_LEAD, email: `sim_${Date.now()}@test-simulation.local` });
  };

  const runSimulation = async () => {
    setRunning(true);
    setStepResults({});
    setSummary(null);

    try {
      // Mark each step as running one-by-one for visual effect
      for (const step of PIPELINE_STEPS) {
        setActiveStep(step.id);
        setStepResults(prev => ({ ...prev, [step.id]: { status: 'running' } }));
        await new Promise(r => setTimeout(r, 400));
      }

      // Call the safe simulation backend
      const response = await base44.functions.invoke('runLeadSimulation', {
        lead,
        failure_toggles: toggles,
      });

      const data = response?.data;

      if (data?.steps) {
        setStepResults(data.steps);
      }
      if (data?.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      // Mark all pending steps as failed
      const failedResults = {};
      for (const step of PIPELINE_STEPS) {
        if (!stepResults[step.id] || stepResults[step.id].status === 'running') {
          failedResults[step.id] = {
            status: 'failed',
            timestamp: new Date().toISOString(),
            logs: [{ type: 'error', message: err.message }],
          };
        }
      }
      setStepResults(prev => ({ ...prev, ...failedResults }));
      setSummary({ error: err.message, steps_completed: 0, failed_steps: PIPELINE_STEPS.length });
    } finally {
      setRunning(false);
      setActiveStep(null);
    }
  };

  const completedCount = Object.values(stepResults).filter(r => r.status === 'success').length;
  const failedCount = Object.values(stepResults).filter(r => r.status === 'failed').length;

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-1.5 h-12 bg-primary rounded-sm flex-shrink-0" />
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FlaskConical className="w-7 h-7 text-primary" />
            <h1 className="text-4xl font-black text-foreground tracking-tight">System Simulation Lab</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Admin-only testing interface — simulates the full lead lifecycle without affecting real data or sending real messages.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> TEST DATA ONLY — NO REAL COMMUNICATIONS
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Left: Controls */}
        <div className="xl:col-span-2 space-y-6">
          {/* Test Lead Generator */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Test Lead Generator</h2>

            <div className="space-y-3">
              {[
                { field: 'full_name', label: 'Name', type: 'text', placeholder: 'Test User' },
                { field: 'business_name', label: 'Business Name', type: 'text', placeholder: 'Acme Test Co' },
                { field: 'email', label: 'Email', type: 'email', placeholder: 'sim@test.local' },
                { field: 'phone', label: 'Phone', type: 'text', placeholder: '5550001234' },
              ].map(({ field, label, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</label>
                  <input
                    type={type}
                    value={lead[field]}
                    onChange={e => handleLeadChange(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Industry</label>
                <select
                  value={lead.industry}
                  onChange={e => handleLeadChange('industry', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Intent Level</label>
                <div className="flex gap-2">
                  {INTENT_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => handleLeadChange('intent_level', level)}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-all ${
                        lead.intent_level === level
                          ? level === 'hot' ? 'bg-red-500 text-white'
                            : level === 'warm' ? 'bg-orange-400 text-white'
                            : 'bg-slate-500 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {level === 'hot' ? '🔥' : level === 'warm' ? '🌡️' : '❄️'} {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Source Type</label>
                <select
                  value={lead.source}
                  onChange={e => handleLeadChange('source', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Failure Toggles */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Failure Toggles</h2>
            <div className="space-y-3">
              {Object.entries({
                automation_not_triggered: 'Automation Not Triggered',
                messaging_not_sent: 'Messaging Not Sent',
                missing_lead_data: 'Missing Lead Data',
                funnel_update_delay: 'Funnel Update Delay',
              }).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleToggle(key)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    toggles[key]
                      ? 'border-red-300 bg-red-50 text-red-800'
                      : 'border-border bg-background text-foreground hover:border-muted-foreground'
                  }`}
                >
                  <span>{label}</span>
                  <div className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${
                    toggles[key] ? 'bg-red-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={runSimulation}
              disabled={running}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? 'Running...' : 'Run Simulation'}
            </button>
            <button
              onClick={reset}
              disabled={running}
              className="px-4 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Visualizer + Results */}
        <div className="xl:col-span-3 space-y-6">
          {/* Step Visualizer */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Simulation Pipeline</h2>
            <div className="space-y-3">
              {PIPELINE_STEPS.map((step, idx) => {
                const result = stepResults[step.id];
                const isActive = activeStep === step.id;
                return (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        result?.status === 'success' ? 'bg-green-500 text-white'
                        : result?.status === 'failed' ? 'bg-red-500 text-white'
                        : isActive ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                        {result?.status === 'success' ? '✓' : result?.status === 'failed' ? '✗' : idx + 1}
                      </div>
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <div className={`w-0.5 flex-1 mt-1 min-h-4 ${
                          result?.status === 'success' ? 'bg-green-300' : 'bg-border'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <StepCard
                        step={step}
                        result={isActive ? { status: 'running' } : result}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results Panel */}
          {summary && (
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Simulation Results</h2>

              {summary.error ? (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3 border border-red-200">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{summary.error}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                      <p className="text-2xl font-black text-green-700">{completedCount}</p>
                      <p className="text-xs font-semibold text-green-600 mt-1">Steps Passed</p>
                    </div>
                    <div className={`rounded-lg border p-3 text-center ${failedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                      <p className={`text-2xl font-black ${failedCount > 0 ? 'text-red-700' : 'text-slate-400'}`}>{failedCount}</p>
                      <p className={`text-xs font-semibold mt-1 ${failedCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>Steps Failed</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {summary.bottleneck_stage && (
                      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-amber-800"><strong>Bottleneck:</strong> {summary.bottleneck_stage}</p>
                      </div>
                    )}
                    {summary.funnel_outcome && (
                      <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <span>📊</span>
                        <p className="text-blue-800 text-sm"><strong>Funnel Outcome:</strong> {summary.funnel_outcome}</p>
                      </div>
                    )}
                    {summary.warnings?.length > 0 && (
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Warnings</p>
                        {summary.warnings.map((w, i) => (
                          <p key={i} className="text-xs text-slate-700">• {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}