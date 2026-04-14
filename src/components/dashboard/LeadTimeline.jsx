import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AIClassificationBadge from './AIClassificationBadge';

export default function LeadTimeline({ leadId, lead }) {
  const [messages, setMessages] = useState([]);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [leadId]);

  const loadTimeline = async () => {
    try {
      const msgs = await base44.entities.Messages.filter({ lead_id: leadId });
      const emls = await base44.entities.Emails.filter({ lead_id: leadId });
      setMessages(msgs || []);
      setEmails(emls || []);
    } catch (err) {
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allEvents = [
    ...messages.map((m) => ({
      type: 'message',
      timestamp: m.created_date,
      data: m,
    })),
    ...emails.map((e) => ({
      type: 'email',
      timestamp: e.created_date,
      data: e,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Timeline</h3>

      {/* AI Classification Display */}
      {lead?.ai_intent && (
        <div className="mb-6 pb-6 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
            Latest AI Classification
          </p>
          <AIClassificationBadge intent={lead.ai_intent} confidence={lead.ai_confidence} />
          {lead.ai_last_classification && (
            <p className="text-xs text-muted-foreground mt-2">
              Suggested Action: <span className="font-semibold">{lead.ai_last_classification}</span>
            </p>
          )}
        </div>
      )}

      {/* Key Timestamps */}
      <div className="space-y-2 mb-6 pb-6 border-b border-border text-sm">
        {lead?.last_contacted_at && (
          <div>
            <span className="text-muted-foreground">Last Contacted:</span>{' '}
            <span className="font-semibold">{formatDate(lead.last_contacted_at)}</span>
          </div>
        )}
        {lead?.booking_link_sent_at && (
          <div>
            <span className="text-muted-foreground">Booking Link Sent:</span>{' '}
            <span className="font-semibold">{formatDate(lead.booking_link_sent_at)}</span>
          </div>
        )}
        {lead?.booked_at && (
          <div>
            <span className="text-muted-foreground">Booked:</span>{' '}
            <span className="font-semibold text-green-600">{formatDate(lead.booked_at)}</span>
          </div>
        )}
      </div>

      {/* Message & Email Timeline */}
      {allEvents.length === 0 ? (
        <p className="text-muted-foreground text-sm">No messages or emails yet</p>
      ) : (
        <div className="space-y-4">
          {allEvents.map((event, idx) => {
            const isMessage = event.type === 'message';
            const item = event.data;

            return (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      isMessage
                        ? item.direction === 'inbound'
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                  />
                </div>
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {isMessage
                        ? item.direction === 'inbound'
                          ? 'Inbound SMS'
                          : 'Outbound SMS'
                        : 'Email'}
                    </span>
                    {isMessage && item.ai_generated && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        AI Generated
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-1">{formatDate(event.timestamp)}</p>
                  <div className="bg-gray-50 rounded p-3 text-foreground">
                    {isMessage ? item.message_text : `${item.subject}\n\n${item.body}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}