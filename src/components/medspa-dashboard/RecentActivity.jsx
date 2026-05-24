import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

const statusColors = {
  New: "bg-slate-100 text-slate-700",
  Qualified: "bg-blue-100 text-blue-700",
  Contacted: "bg-sky-100 text-sky-700",
  Responded: "bg-cyan-100 text-cyan-700",
  Booked: "bg-green-100 text-green-700",
  Closed: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function RecentActivity({ leads }) {
  const recent = [...leads]
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recent.map((lead, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {lead.business_name?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{lead.business_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.city}, {lead.state} · {lead.niche}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[lead.status] || statusColors.New}`}>
                    {lead.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {lead.updated_date ? formatDistanceToNow(new Date(lead.updated_date), { addSuffix: true }) : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}