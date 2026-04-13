import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LogOut, Menu, X } from "lucide-react";
import DashboardHome from "../components/dashboard/DashboardHome";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-6">
            You must be an admin to access this dashboard.
          </p>
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <h1 className="font-display text-xl font-semibold text-foreground">
              ApexFlow Admin
            </h1>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-6 space-y-2">
            <button
              onClick={() => {
                navigate("/admin");
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-foreground font-medium hover:bg-muted transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                navigate("/admin/leads");
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-foreground font-medium hover:bg-muted transition-colors"
            >
              Leads
            </button>
          </nav>

          {/* User Info */}
          <div className="p-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Signed in as <strong>{user.full_name}</strong>
            </p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-border p-6 flex items-center justify-between lg:justify-end">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <DashboardHome />
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
        />
      )}
    </div>
  );
}