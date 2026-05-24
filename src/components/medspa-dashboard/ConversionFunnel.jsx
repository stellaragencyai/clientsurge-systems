import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stages = [
  { key: "New", label: "New Leads", color: "bg-slate-400" },
  { key: "Qualified", label: "Qualified", color: "bg-blue-400" },
  { key: "Contacted", label: "Contacted", color: "bg-sky-400" },
  { key: "Responded", label: "Responded", color: "bg-cyan-400" },
  { key: "Booked", label: "Booked", color: "bg-green-500" },
  { key: "Closed", label: "Closed", color: "bg-emerald-600" },
];

export default function ConversionFunnel({ leads }) {
  const total = leads.length || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage) => {
          const count = leads.filter(l => l.status === stage.key).length;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={stage.key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground font-medium">{stage.label}</span>
                <span className="text-muted-foreground">{count} <span className="text-xs">({pct}%)</span></span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${stage.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}