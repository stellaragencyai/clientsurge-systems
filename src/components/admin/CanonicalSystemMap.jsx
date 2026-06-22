/**
 * CanonicalSystemMap — Admin read-only reference page
 * Shows source-of-truth entity mapping and legacy system notice.
 */

import { useState } from 'react';
import { Database, ChevronDown, ChevronUp } from 'lucide-react';

const CANONICAL_MAP = [
  {
    domain: 'Leads & CRM',
    entity: 'Leads',
    description: 'Single source of truth for all lead and contact records. All CRM operations, scoring, segmentation, and lifecycle tracking use this entity.',
    usedFor: ['CRM view', 'Lead scoring', 'Outreach targeting', 'Pipeline segments'],
  },
  {
    domain: 'Event Log',
    entity: 'CommunicationEvent',
    description: 'Immutable audit trail for all communication events — SMS, email, voice, webhooks. All outbound and inbound activity is logged here.',
    usedFor: ['Communication logs', 'Automation audit trail', 'Delivery tracking'],
  },
  {
    domain: 'Event Processing',
    entity: 'EventQueue',
    description: 'Processing queue for all events. Shows pending, in-flight, and failed jobs. Used for automation observability.',
    usedFor: ['Automation pipeline visibility', 'Failed job detection', 'Queue health'],
  },
  {
    domain: 'Funnel Analytics',
    entity: 'ConversionFunnel',
    description: 'Source of truth for funnel stage metrics and conversion tracking across the visitor-to-customer journey.',
    usedFor: ['Funnel breakdown', 'Stage conversion rates', 'Drop-off analysis'],
  },
  {
    domain: 'Landing Page Analytics',
    entity: 'LandingPageAnalytics',
    description: 'Page-level analytics for landing pages. Tracks traffic, bounce rate, scroll depth, and conversion events.',
    usedFor: ['Page performance', 'Traffic source breakdown', 'Bounce rate monitoring'],
  },
  {
    domain: 'Revenue',
    entity: 'RevenueTracking',
    description: 'Authoritative revenue ledger. All revenue attribution, conversion value, and MRR data flows through this entity.',
    usedFor: ['Revenue dashboard', 'MRR calculation', 'Revenue per lead', 'Revenue per customer'],
  },
  {
    domain: 'Onboarding State',
    entity: 'OnboardingOrchestration + ClientInstallationOS',
    description: 'Onboarding state and setup workflow. OnboardingOrchestration tracks stage and status; ClientInstallationOS manages the technical installation workflow.',
    usedFor: ['Onboarding pipeline', 'Setup progress', 'Blocker detection', 'Activation readiness'],
  },
  {
    domain: 'Orders',
    entity: 'Order',
    description: 'Payment and order source of truth. Links paid customers to onboarding and client project records.',
    usedFor: ['Paid customer tracking', 'Package lookup', 'Payment status'],
  },
  {
    domain: 'Client Portal',
    entity: 'ClientExperiencePortal',
    description: 'Client-facing portal state. Tracks portal creation, access enablement, and sync status for each client.',
    usedFor: ['Portal readiness', 'Client access visibility'],
  },
  {
    domain: 'Setup Checklist',
    entity: 'AutomationChecklist',
    description: 'Per-client automation setup checklist. Tracks completion of each service activation step.',
    usedFor: ['Onboarding checklist', 'Setup progress', 'Missing setup items'],
  },
  {
    domain: 'Sales Assets',
    entity: 'Resource',
    description: 'Canonical sales asset library. All guides, templates, scripts, and downloads are stored as Resource records.',
    usedFor: ['Resource Library', 'Sales collateral', 'Client materials'],
  },
  {
    domain: 'Campaigns',
    entity: 'EmailCampaign + EmailCampaignTemplate',
    description: 'Canonical campaign orchestration. EmailCampaign manages campaign runs; EmailCampaignTemplate holds reusable email content.',
    usedFor: ['Campaign management', 'Email template library'],
  },
  {
    domain: 'Messaging Templates',
    entity: 'MessageTemplate',
    description: 'Reusable message templates for SMS, email, and other channels.',
    usedFor: ['Template library', 'Outbound messaging config'],
  },
];

const LEGACY_SYSTEMS = [
  { name: 'Lead', canonical: 'Leads', reason: 'Superseded by canonical Leads entity' },
  { name: 'LeadAnalytics', canonical: 'ConversionFunnel + LandingPageAnalytics', reason: 'Fragmented — replaced by canonical analytics entities' },
  { name: 'Events', canonical: 'CommunicationEvent + EventQueue', reason: 'Superseded by canonical event log and queue' },
  { name: 'EmailSequence', canonical: 'EmailCampaign', reason: 'Legacy sequence system; replaced by EmailCampaign' },
  { name: 'EmailDripCampaign', canonical: 'EmailCampaign', reason: 'Legacy drip system; replaced by EmailCampaign' },
  { name: 'NurtureCampaign', canonical: 'EmailCampaign', reason: 'Legacy nurture system; replaced by EmailCampaign' },
  { name: 'DripCampaign', canonical: 'EmailCampaign', reason: 'Legacy drip system; replaced by EmailCampaign' },
];

const PACKAGE_NAMING = [
  { canonical: 'Starter System', internalKey: 'starter_system', notes: 'Entry-level package' },
  { canonical: 'Growth System', internalKey: 'growth_system', notes: 'Mid-tier package' },
  { canonical: 'Elite System', internalKey: 'elite_system', notes: 'Full-stack package. Legacy key: pro_system' },
  { canonical: 'Agency System', internalKey: 'agency_system', notes: 'Multi-client agency package' },
];

export default function CanonicalSystemMap() {
  const [showLegacy, setShowLegacy] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Canonical System Map
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Source-of-truth reference for every domain in the ClientSurge platform. Use this map to understand which entities are canonical for each domain.
        </p>
      </div>

      {/* Canonical Map */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
          <p className="text-sm font-bold text-slate-800">Source-of-Truth Entity Map</p>
        </div>
        <div className="divide-y divide-slate-100">
          {CANONICAL_MAP.map((entry) => (
            <div key={entry.domain} className="px-6 py-4 flex flex-col md:flex-row md:items-start gap-4">
              <div className="md:w-48 flex-shrink-0">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">{entry.domain}</p>
                <p className="text-sm font-semibold text-slate-900 mt-1 font-mono">{entry.entity}</p>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-slate-600">{entry.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.usedFor.map(use => (
                    <span key={use} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Package Naming */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
          <p className="text-sm font-bold text-slate-800">Canonical Package Names</p>
        </div>
        <div className="divide-y divide-slate-100">
          {PACKAGE_NAMING.map((pkg) => (
            <div key={pkg.canonical} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">{pkg.canonical}</p>
                <p className="text-xs text-slate-500 mt-0.5">{pkg.notes}</p>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {pkg.internalKey}
              </span>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-200">
          <p className="text-xs text-amber-700">
            ⚠️ <strong>pro_system</strong> is a legacy internal key that maps to Elite System. It remains in Stripe metadata for compatibility — do not rename stored billing records.
          </p>
        </div>
      </div>

      {/* Legacy Systems Notice — Collapsed by Default */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <button
          onClick={() => setShowLegacy(!showLegacy)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-left">
            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">LEGACY</span>
            <p className="text-sm font-semibold text-slate-800">Hidden Legacy Systems</p>
            <p className="text-xs text-slate-500">These are not used in normal operations</p>
          </div>
          {showLegacy ? (
            <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
        </button>
        {showLegacy && (
          <div className="border-t border-slate-200 divide-y divide-slate-100">
            <div className="px-6 py-3 bg-amber-50">
              <p className="text-xs text-amber-800">
                These entities are preserved for backward compatibility. They should not be used for new workflows. No data has been deleted.
              </p>
            </div>
            {LEGACY_SYSTEMS.map((sys) => (
              <div key={sys.name} className="px-6 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-mono font-semibold text-slate-700 line-through">{sys.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{sys.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Use instead:</p>
                  <p className="text-xs font-semibold text-blue-700 font-mono">{sys.canonical}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}