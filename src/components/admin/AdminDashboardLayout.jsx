import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import MetricsDashboard from "./MetricsDashboard";
import AutomationRulesPanel from "./AutomationRulesPanel";
import RevenueAttributionDashboard from "./RevenueAttributionDashboard";
import { Settings, BarChart3, Zap, TrendingUp } from "lucide-react";

export default function AdminDashboardLayout() {
  const [projectId, setProjectId] = useState(null);
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState("metrics");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, []);

  const loadProject = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get first project for this user
      const projects = await base44.entities.ClientProject.filter(
        { owner_email: user.email },
        "-created_date",
        1
      );

      if (projects?.length) {
        setProjectId(projects[0].id);
        setProject(projects[0]);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin">⏳</div>
        <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    );

  if (!projectId)
    return (
      <div className="p-8 text-center bg-card border border-border rounded-lg">
        <p className="text-muted-foreground">No project found</p>
      </div>
    );

  const tabs = [
    {
      id: "metrics",
      label: "Metrics",
      icon: BarChart3,
      component: <MetricsDashboard projectId={projectId} />,
    },
    {
      id: "automations",
      label: "Automation Rules",
      icon: Zap,
      component: <AutomationRulesPanel projectId={projectId} />,
    },
    {
      id: "revenue",
      label: "Revenue Attribution",
      icon: TrendingUp,
      component: <RevenueAttributionDashboard projectId={projectId} />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      component: (
        <div className="p-8 text-center text-muted-foreground">
          Settings panel coming soon
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">
            {project?.business_name || "Admin Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {project?.industry || "Service Business"} • Mode:{" "}
            {project?.install_configuration?.mode || "Full Automation"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-1 py-4 font-medium text-sm transition-colors flex items-center gap-2 border-b-2 ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}