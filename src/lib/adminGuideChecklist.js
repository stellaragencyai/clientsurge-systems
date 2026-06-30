export const CRM_GUIDE_PHASES = [
  {
    id: 'prove-release',
    title: '1. Prove the release is live',
    goal: 'Confirm the code you are using is actually published and visible in production.',
    tab: 'System Health → Launch Proof',
    checks: [
      'Confirm ClientSurge Release Gate is green for the target commit.',
      'Confirm Base44 publish or sync happened after that commit.',
      'Open the live admin dashboard and verify the Release Proof Panel is visible.',
      'Open System Health → Data Quality and confirm CRM Data Quality plus Automation Evidence Cards render.',
    ],
  },
  {
    id: 'snapshot-first',
    title: '2. Snapshot before changing records',
    goal: 'Capture the current truth state before running any quality action.',
    tab: 'System Health → Data Quality',
    checks: [
      'Record raw Leads, trusted Leads, hidden Leads, duplicate candidates, and archived WebsiteLeads.',
      'Record outbound held/suppressed event counts.',
      'Export flagged rows from Lead Quality Control when reviewing anything that could be removed later.',
    ],
  },
  {
    id: 'dry-run',
    title: '3. Dry-run existing-record review',
    goal: 'Preview what the system would mark before applying non-destructive changes.',
    tab: 'Leads & Intelligence → Lead Quality Control',
    checks: [
      'Click Dry-Run Existing Backfill.',
      'Review scanned counts, eligible counts, and sample records.',
      'Do not apply if samples include real booked, replied, paid, or active client records.',
    ],
  },
  {
    id: 'apply-safe-review',
    title: '4. Apply only non-destructive review labels',
    goal: 'Archive or mark obvious internal/test/duplicate/no-contact records without erasing useful data.',
    tab: 'Leads & Intelligence → Lead Quality Control',
    checks: [
      'Click Apply Non-Destructive Backfill only after dry-run looks correct.',
      'Use the exact confirmation phrase shown in the panel.',
      'Re-open Data Quality and compare before/after trusted and hidden counts.',
    ],
  },
  {
    id: 'review-groups',
    title: '5. Review grouped records before removal',
    goal: 'Choose the correct keeper before touching duplicate candidates.',
    tab: 'Lead Quality Control → Duplicate Keeper Review',
    checks: [
      'Open Duplicate Keeper Review.',
      'Use evidence score, phone, email, website, location, booking, reply, and payment evidence to choose the keeper.',
      'Do not remove a record if the keeper is unclear or if the candidate has unique useful data.',
    ],
  },
  {
    id: 'outreach-readiness',
    title: '6. Verify outreach readiness',
    goal: 'Separate safe-to-contact records from records that need verification or must be held.',
    tab: 'Leads & Intelligence → Priority Queue',
    checks: [
      'Open Safe Outreach Queue.',
      'Use only Ready records for manual or automated outreach.',
      'Fix Verify First records before outreach.',
      'Do not contact Hold records.',
    ],
  },
  {
    id: 'qa-proof',
    title: '7. Run controlled QA proof when needed',
    goal: 'Generate repeatable internal/test records to prove filters and guards without sending messages.',
    tab: 'Tools → QA Tools',
    checks: [
      'Run QA Lead Proof Generator dry-run first.',
      'Create proof records only with the exact confirmation phrase.',
      'Verify proof records appear hidden, archived, held, or grouped as expected.',
      'Confirm Automation Evidence Cards show guarded or held events when applicable.',
    ],
  },
  {
    id: 'guarded-removal',
    title: '8. Use guarded removal only after proof',
    goal: 'Only remove verified junk after backup, blocker review, and explicit confirmation.',
    tab: 'Lead Quality Control → Export Review',
    checks: [
      'Export selected records to CSV first.',
      'Use Delete Verified Junk only for records that pass the guard rules.',
      'Review blocked reasons; do not bypass them.',
      'Re-check Data Quality counts after each small batch.',
    ],
  },
];

export function getCrmGuideSummary(phases = CRM_GUIDE_PHASES) {
  return {
    phase_count: phases.length,
    check_count: phases.reduce((total, phase) => total + phase.checks.length, 0),
    tabs: [...new Set(phases.map((phase) => phase.tab))],
  };
}

export function getCrmGuidePhase(id, phases = CRM_GUIDE_PHASES) {
  return phases.find((phase) => phase.id === id) || null;
}
