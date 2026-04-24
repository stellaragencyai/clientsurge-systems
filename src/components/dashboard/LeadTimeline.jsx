/**
 * LeadTimeline — wrapper used on AdminLeadDetail page.
 * Delegates to the canonical ActivityTimeline component.
 */
import ActivityTimeline from "../admin/ActivityTimeline";

export default function LeadTimeline({ leadId }) {
  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <ActivityTimeline leadId={leadId} />
    </div>
  );
}