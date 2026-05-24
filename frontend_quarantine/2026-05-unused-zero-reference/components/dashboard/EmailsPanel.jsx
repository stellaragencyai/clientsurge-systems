import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function EmailsPanel({ leadId }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadEmails();
  }, [leadId]);

  const loadEmails = async () => {
    try {
      const data = await base44.entities.Emails.filter(
        { lead_id: leadId },
        "-created_date",
        100
      );
      setEmails(data);
    } catch (err) {
      console.error("Error loading emails:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    if (status === "sent" || status === "delivered" || status === "opened") {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusColor = (status) => {
    if (status === "sent" || status === "delivered" || status === "opened") {
      return "bg-green-50 border-green-200";
    }
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Mail className="w-5 h-5" />
        Emails
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      ) : emails.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No emails sent yet</p>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`p-4 rounded-lg border-2 ${getStatusColor(email.status)} cursor-pointer hover:shadow-sm transition-shadow`}
              onClick={() =>
                setExpandedId(expandedId === email.id ? null : email.id)
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(email.status)}
                    <h4 className="font-medium text-foreground truncate">
                      {email.subject}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(email.created_date)}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-white border border-current">
                  {email.status}
                </span>
              </div>

              {/* Expanded View */}
              {expandedId === email.id && (
                <div className="mt-4 pt-4 border-t border-current/20">
                  <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {email.body}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}