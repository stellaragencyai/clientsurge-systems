import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Loader2 } from "lucide-react";
import StatusControl from "../components/dashboard/StatusControl";
import MessagingPanel from "../components/dashboard/MessagingPanel";
import EmailHistoryPanel from "../components/dashboard/EmailHistoryPanel";
import NotesSection from "../components/dashboard/NotesSection";
import LeadTimeline from "../components/dashboard/LeadTimeline";

export default function AdminLeadDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/admin");
      return;
    }
    loadLead();
  }, [leadId]);

  const loadLead = async () => {
    try {
      const data = await base44.entities.Leads.get(leadId);
      setLead(data);
    } catch (err) {
      console.error("Error loading lead:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setLead((prev) => ({ ...prev, status: newStatus }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Lead not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/leads")}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            {lead.full_name}
          </h1>
          <p className="text-muted-foreground">{lead.business_name}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Email
              </p>
              <p className="text-sm text-foreground">{lead.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Phone
              </p>
              <p className="text-sm text-foreground">{lead.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Business Type
              </p>
              <p className="text-sm text-foreground">{lead.business_type}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Problem
              </p>
              <p className="text-sm text-foreground">{lead.problem}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Added
              </p>
              <p className="text-sm text-foreground">
                {formatDate(lead.created_date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Control */}
      <StatusControl
        leadId={leadId}
        currentStatus={lead.status}
        onStatusChange={handleStatusChange}
      />

      {/* Timeline with AI Classification */}
      <LeadTimeline leadId={leadId} lead={lead} />

      {/* Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessagingPanel leadId={leadId} leadPhone={lead.phone} />
        <EmailHistoryPanel leadId={leadId} />
      </div>

      {/* Notes */}
      <NotesSection leadId={leadId} />
    </div>
  );
}