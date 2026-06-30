import AutomationEvidenceCards from './AutomationEvidenceCards';
import CrmDataQualitySummary from './CrmDataQualitySummary';

export default function LeadDataQualityDashboard() {
  return (
    <div className="space-y-8">
      <CrmDataQualitySummary />
      <AutomationEvidenceCards />
    </div>
  );
}
