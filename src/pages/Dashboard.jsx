import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Search, Filter, LogOut, Plus, Edit, Trash2, Eye } from "lucide-react";
import EmailHistoryPanel from "../components/dashboard/EmailHistoryPanel";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [demoRequests, setDemoRequests] = useState([]);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadEmails, setLeadEmails] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsData, clientsData, demosData, emailsData] = await Promise.all([
        base44.entities.Lead.list("-created_date", 100),
        base44.entities.Client.list("-created_date", 100),
        base44.entities.DemoRequest.list("-created_date", 100),
        base44.entities.CommunicationEvent.filter({ channel: 'email' }, '-created_date', 100),
      ]);
      setLeads(leadsData);
      setClients(clientsData);
      setDemoRequests(demosData);
      setEmails(emailsData);
    } catch (err) {
      console.error("Error loading data:", err);
    }
    setLoading(false);
  };

  const loadLeadEmails = async (leadId) => {
    try {
      const emailsData = await base44.entities.CommunicationEvent.filter(
        { lead_id: leadId, channel: 'email' },
        '-created_date',
        50
      );
      setLeadEmails(emailsData);
    } catch (err) {
      console.error("Error loading lead emails:", err);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground mb-3">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-6">
            This dashboard is admin-only.
          </p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Legacy Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.full_name}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {[
            { id: "leads", label: "Leads", count: leads.length },
            { id: "clients", label: "Clients", count: clients.length },
            { id: "demos", label: "Demo Requests", count: demoRequests.length },
            { id: "emails", label: "Emails", count: emails.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="booked">Booked</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : filteredLeads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No leads found</p>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 bg-white rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedLead(lead.id === selectedLead ? null : lead.id);
                      if (lead.id !== selectedLead) loadLeadEmails(lead.id);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{lead.name}</h3>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {lead.status}
                          </span>
                          {lead.niche && (
                            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {lead.niche}
                            </span>
                          )}
                        </div>
                        {selectedLead === lead.id && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs font-semibold text-foreground mb-3">Email History</p>
                            <EmailHistoryPanel emails={leadEmails} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                          <Edit className="w-4 h-4 text-foreground" />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : clients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No clients yet</p>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="p-4 bg-white rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{client.business_name}</h3>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {client.status || "Active"}
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Demos Tab */}
        {activeTab === "demos" && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : demoRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No demo requests</p>
            ) : (
              <div className="space-y-3">
                {demoRequests.map((demo) => (
                  <div
                    key={demo.id}
                    className="p-4 bg-white rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Demo Request</h3>
                        {demo.scheduled_date && (
                          <p className="text-sm text-muted-foreground">
                            {demo.scheduled_date} at {demo.scheduled_time}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {demo.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === "emails" && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : emails.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No emails sent</p>
            ) : (
              <div className="space-y-3">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="p-4 bg-white rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{email.subject}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{email.message_body}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {email.status}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(email.created_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
