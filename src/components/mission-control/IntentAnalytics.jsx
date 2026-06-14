import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useRealTimePolling } from '@/hooks/useRealTimePolling';
import { deltaFetchHelpers } from './DeltaFetchHelper';

export default function IntentAnalytics({ filters, refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [intents, setIntents] = useState({
    lead: 0,
    booking: 0,
    support: 0,
    spam: 0,
  });
  const [lastUpdatedTime, setLastUpdatedTime] = useState(Date.now());

  // Helper to classify intent
  const classifyIntent = (event) => {
    const intent = (event.event_type || 'lead').toLowerCase();
    if (intent.includes('booking')) return 'booking';
    if (intent.includes('support')) return 'support';
    if (intent.includes('spam')) return 'spam';
    return 'lead';
  };

  // Real-time delta fetch
  const fetchDeltaAnalytics = async (lastTimestamp) => {
    try {
      const newEvents = await deltaFetchHelpers.fetchNewCommunicationEvents(lastTimestamp);
      if (newEvents.length > 0) {
        setIntents(prevIntents => {
          const updated = { ...prevIntents };
          newEvents.forEach(event => {
            const intent = classifyIntent(event);
            updated[intent]++;
          });
          return updated;
        });
        setLastUpdatedTime(Date.now());
      }
      return newEvents;
    } catch (error) {
      console.error('Error fetching delta analytics:', error);
      throw error;
    }
  };

  // Real-time polling
  useRealTimePolling(fetchDeltaAnalytics, 3000, null, null, true);

  // Initial load
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const events = await base44.entities.CommunicationEvent.list('-created_date', 200);
        const counts = { lead: 0, booking: 0, support: 0, spam: 0 };

        (events || []).forEach(event => {
          const intent = classifyIntent(event);
          counts[intent]++;
        });

        setIntents(counts);
        setLastUpdatedTime(Date.now());
      } catch (error) {
        console.error('Error loading intent analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [refreshKey]);

  // Update chart data whenever intents change
  useEffect(() => {
    setData([
      { name: 'Lead Inquiry', value: intents.lead, fill: '#3b82f6' },
      { name: 'Booking Request', value: intents.booking, fill: '#10b981' },
      { name: 'Support', value: intents.support, fill: '#f59e0b' },
      { name: 'Spam/Bot', value: intents.spam, fill: '#ef4444' },
    ]);
  }, [intents]);

  const total = intents.lead + intents.booking + intents.support + intents.spam;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-80 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Intent Classification</h2>
        <span className="text-sm text-muted-foreground">
          Updated {Math.round((Date.now() - lastUpdatedTime) / 1000)}s ago
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'Lead Inquiry', value: intents.lead, color: '#3b82f6' },
          { label: 'Booking Request', value: intents.booking, color: '#10b981' },
          { label: 'Support', value: intents.support, color: '#f59e0b' },
          { label: 'Spam/Bot', value: intents.spam, color: '#ef4444' },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-lg border border-border p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: stat.color }}
              />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {total > 0 ? `${((stat.value / total) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
        ))}
      </div>

      {total > 0 ? (
        <div className="rounded-lg border border-border p-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">No intent data available</p>
        </div>
      )}
    </div>
  );
}