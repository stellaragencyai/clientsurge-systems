/**
 * CampaignMetricsBar — shows open rate, CTR, unsubscribe rate for a campaign.
 */
export default function CampaignMetricsBar({ campaign }) {
  const sent = campaign.total_sent || 0;
  const openRate = sent > 0 ? Math.round((campaign.total_opened / sent) * 100) : 0;
  const ctr = sent > 0 ? Math.round((campaign.total_clicked / sent) * 100) : 0;
  const unsubRate = sent > 0 ? Math.round((campaign.total_unsubscribed / sent) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
      <div className="rounded-lg bg-muted/60 px-3 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Sent</p>
        <p className="text-lg font-bold text-foreground">{sent}</p>
      </div>
      <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Open Rate</p>
        <p className="text-lg font-bold text-blue-700">{openRate}%</p>
        <p className="text-[10px] text-blue-500">{campaign.total_opened || 0} opens</p>
      </div>
      <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-green-600">Click Rate</p>
        <p className="text-lg font-bold text-green-700">{ctr}%</p>
        <p className="text-[10px] text-green-500">{campaign.total_clicked || 0} clicks</p>
      </div>
      <div className="rounded-lg bg-red-50 px-3 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">Unsubscribed</p>
        <p className="text-lg font-bold text-red-600">{unsubRate}%</p>
        <p className="text-[10px] text-red-400">{campaign.total_unsubscribed || 0}</p>
      </div>
    </div>
  );
}