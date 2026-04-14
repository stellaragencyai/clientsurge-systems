import { Users, TrendingUp, CalendarCheck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsCards({ leads }) {
  const total = leads.length;
  const newLeads = leads.filter(l => l.status === "New").length;
  const booked = leads.filter(l => l.status === "Booked" || l.status === "Closed").length;
  const contacted = leads.filter(l => l.status === "Contacted" || l.status === "Responded").length;
  const conversionRate = total > 0 ? Math.round((booked / total) * 100) : 0;
  const responseRate = total > 0 ? Math.round(((total - newLeads) / total) * 100) : 0;

  const stats = [
    {
      icon: Users,
      label: "Total Leads",
      value: total,
      sub: `${newLeads} new`,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: CalendarCheck,
      label: "Booked / Closed",
      value: booked,
      sub: `${conversionRate}% conversion`,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: TrendingUp,
      label: "In Conversation",
      value: contacted,
      sub: "Contacted + Responded",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Clock,
      label: "Response Rate",
      value: `${responseRate}%`,
      sub: "Leads actioned",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <Card key={i}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}