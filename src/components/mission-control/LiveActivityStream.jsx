import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, User, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EVENT_ICONS = {
  sms_sent: MessageSquare,
  email_sent: Mail,
  lead_created: User,
  automation_triggered: Zap,
  booking_created: CheckCircle,
};

export default function LiveActivityStream() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const result = await base44.asServiceRole.entities.CommunicationEvent.filter(
          {},
          '-created_date',
          20
        );
        setEvents(result || []);
      } catch (e) {
        console.error('Failed to load events:', e);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();

    // Subscribe to real-time updates
    const unsubscribe = base44.asServiceRole.entities.CommunicationEvent.subscribe((event) => {
      if (event.type === 'create') {
        setEvents((prev) => [event.data, ...prev.slice(0, 19)]);
      }
    });

    return unsubscribe;
  }, []);

  const getEventIcon = (eventType) => {
    const Icon = EVENT_ICONS[eventType] || AlertCircle;
    return Icon;
  };

  const getEventColor = (status) => {
    if (status === 'sent' || status === 'delivered') return 'bg-green-50 text-green-700';
    if (status === 'failed') return 'bg-red-50 text-red-700';
    return 'bg-blue-50 text-blue-700';
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading activity...</div>
      ) : events.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No activity yet</div>
      ) : (
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {events.map((event) => {
            const Icon = getEventIcon(event.event_type);
            return (
              <button
                key={event.id}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 ${getEventColor(event.status)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-75" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">
                      {(event.event_type || 'event').replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.channel === 'email' ? '📧' : event.channel === 'sms' ? '💬' : '📡'}
                      {' '}
                      {event.direction === 'outbound' ? 'Sent' : 'Received'}
                      {' '}•{' '}
                      {new Date(event.created_date).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded flex-shrink-0 ${
                    event.status === 'sent' || event.status === 'delivered'
                      ? 'bg-white/60'
                      : 'bg-white/40'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}