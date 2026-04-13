import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, MessageSquare, CheckCircle2, Zap, BookOpen } from "lucide-react";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    replied: 0,
    qualified: 0,
    booked: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const leads = await base44.entities.Leads.list("-created_date", 1000);
      
      const statuses = {
        total: leads.length,
        new: leads.filter(l => l.status === "New").length,
        replied: leads.filter(l => l.status === "Replied").length,
        qualified: leads.filter(l => l.status === "Qualified").length,
        booked: leads.filter(l => l.status === "Booked").length,
      };

      setStats(statuses);
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Leads",
      value: stats.total,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "New Leads",
      value: stats.new,
      icon: Zap,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Replied",
      value: stats.replied,
      icon: MessageSquare,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Qualified",
      value: stats.qualified,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Booked",
      value: stats.booked,
      icon: BookOpen,
      color: "bg-pink-100 text-pink-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Welcome Back
        </h2>
        <p className="text-muted-foreground">
          Here's your lead pipeline at a glance.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}