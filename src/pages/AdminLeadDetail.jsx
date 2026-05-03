import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { AlertTriangle, ArrowLeft, Loader2, Mail, Zap } from "lucide-react";
import StatusControl from "../components/dashboard/StatusControl";
import MessagingPanel from "../components/dashboard/MessagingPanel";
import EmailHistoryPanel from "../components/dashboard/EmailHistoryPanel";
import NotesSection from "../components/dashboard/NotesSection";
import LeadTimeline from "../components/dashboard/LeadTimeline";
import AILeadInsightPanel from "../components/admin/AILeadInsightPanel";

const intakeTypeLabels = {
  lead_capture: "Lead Capture",
  contact_inquiry: "Contact Inquiry",
  demo_booking: "Demo Booking",
};

const sourceLabels = {
  website: "Website",
};

export default function AdminLeadDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [failedEvents, setFailedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/admin");
      return;
    }
    loadLead();
  }, [leadId]);

  const loadLead = async () => {
    try {
      const [data, events, seqs] = await Promise.all([
        base44.entities.Leads.get(leadId),
        base44.entities.CommunicationEvent.filter({ lead_id: leadId, status: "failed" }, "-created_date", 20),
        base44.entities.EmailSequence.filter({ active: true }, "-created_date", 20),
      ]);
      setLead(data);
      setFailedEvents(events || []);
      setCampaigns(seqs || []);
    } catch (err) {
      console.error("Error loading lead:", err);
    } finally {
      setLoading(false);
    }
  };

  const enrollInCampaign = async (sequenceId) => {
    setEnrolling(true);
    setEnrollSuccess("");
    try {
      await base44.functions.invoke("startNurtureCampaign", { lead_id: leadId, sequence_id: sequenceId });
      setEnrollSuccess("Lead enrolled in campaign successfully!");
      setTimeout(() => setEnrollSuccess(""), 3000);
    } catch (err) {
      console.error("Enroll error:", err);
    } finally {
      setEnrolling(false);
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

  const formatIntakeType = (value) => intakeTypeLabels[value] || value || "Unknown";
  const formatSource = (value) => sourceLabels[value] || value || "Unknown";

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
          <p className="text-xs text-muted-foreground mt-1">Canonical Customer Lead record</p>
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
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Intake Type
              </p>
              <p className="text-sm text-foreground">{formatIntakeType(lead.intake_type)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Source
              </p>
              <p className="text-sm text-foreground">{formatSource(lead.source)}</p>
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

      {failedEvents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Manual follow-up may be needed</p>
            <p className="text-sm text-amber-800 mt-1">
              This lead has {failedEvents.length} failed notification or workflow event{failedEvents.length === 1 ? "" : "s"}.
              Review the timeline below and follow up manually if needed.
            </p>
          </div>
        </div>
      )}

      {failedEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {failedEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="rounded-lg border border-amber-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-2">
                {event.channel || "workflow"} failure
              </p>
              <p className="text-sm font-medium text-foreground mb-2">
                {event.subject || event.event_type || "Follow-up event failed"}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {event.error_message || "Review this lead and follow up manually if needed."}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* AI Lead Qualification Panel */}
      <AILeadInsightPanel lead={lead} onLeadUpdated={loadLead} />

      {/* Timeline with AI Classification */}
      <LeadTimeline leadId={leadId} lead={lead} />

      {/* Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessagingPanel leadId={leadId} leadPhone={lead.phone} />
        <EmailHistoryPanel leadId={leadId} />
      </div>

      {/* Campaign Enrollment */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Enroll in Email Campaign</h3>
          </div>
          {enrollSuccess && (
            <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">{enrollSuccess}</div>
          )}
          <div className="flex flex-wrap gap-2">
            {campaigns.map(c => (
              <button
                key={c.id}
                onClick={() => enrollInCampaign(c.id)}
                disabled={enrolling}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                {enrolling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <NotesSection leadId={leadId} />
    </div>
  );
}