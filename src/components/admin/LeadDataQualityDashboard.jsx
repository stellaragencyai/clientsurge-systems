import AutomationEvidenceCards from './AutomationEvidenceCards';
import CrmCleanupGuide from './CrmCleanupGuide';
import CrmDataQualitySummary from './CrmDataQualitySummary';

export default function LeadDataQualityDashboard() {
  return (
    <div className="space-y-8">
      <CrmCleanupGuide />
      <CrmDataQualitySummary />
      <AutomationEvidenceCards />
    </div>
  );
}
