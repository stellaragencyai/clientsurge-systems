import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Eye } from "lucide-react";

export default function EmailHistoryPanel({ leadId }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    loadEmails();
  }, [leadId]);

  const loadEmails = async () => {
    try {
      const data = await base44.entities.Emails.filter(
        { lead_id: leadId },
        "-created_date",
        50
      );
      setEmails(data);
    } catch (err) {
      console.error("Error loading emails:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      opened: "bg-purple-100 text-purple-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Emails</h3>

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
              className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <h4 className="font-medium text-foreground truncate">
                      {email.subject}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {email.body}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(email.status)}`}>
                      {email.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(email.created_date)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)}
                  className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Expanded View */}
              {selectedEmail?.id === email.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {email.body}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}