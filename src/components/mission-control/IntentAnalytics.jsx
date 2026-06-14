import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function IntentAnalytics({ filters, refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [intents, setIntents] = useState({
    lead: 0,
    booking: 0,
    support: 0,
    spam: 0,
  });

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const events = await base44.entities.CommunicationEvent.list('-created_date', 200);
        const counts = { lead: 0, booking: 0, support: 0, spam: 0 };

        (events || []).forEach(event => {
          // Classify by event type or use ai_intent field if available
          const intent = event.event_type || 'lead';
          if (intent.includes('booking')) {
            counts.booking++;
          } else if (intent.includes('support')) {
            counts.support++;
          } else if (intent.includes('spam')) {
            counts.spam++;
          } else {
            counts.lead++;
          }
        });

        setIntents(counts);
        setData([
          { name: 'Lead Inquiry', value: counts.lead, fill: '#3b82f6' },
          { name: 'Booking Request', value: counts.booking, fill: '#10b981' },
          { name: 'Support', value: counts.support, fill: '#f59e0b' },
          { name: 'Spam/Bot', value: counts.spam, fill: '#ef4444' },
        ]);
      } catch (error) {
        console.error('Error loading intent analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [filters, refreshKey]);

  if (loading) {
    return <div className="h-96 bg-muted rounded-lg animate-pulse" />;
  }

  const total = Object.values(intents).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Lead Inquiry', value: intents.lead, color: 'bg-blue-50 text-blue-700' },
          { label: 'Booking Request', value: intents.booking, color: 'bg-green-50 text-green-700' },
          { label: 'Support', value: intents.support, color: 'bg-amber-50 text-amber-700' },
          { label: 'Spam/Bot', value: intents.spam, color: 'bg-red-50 text-red-700' },
        ].map(card => (
          <div
            key={card.label}
            className={`rounded-lg p-4 ${card.color}`}
          >
            <div className="text-sm font-medium opacity-75">{card.label}</div>
            <div className="text-2xl font-bold mt-2">{card.value}</div>
            {total > 0 && (
              <div className="text-xs opacity-75 mt-1">
                {((card.value / total) * 100).toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {total > 0 ? (
        <div className="rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-4">Intent Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) =>
                  `${name}: ${value} (${((value / total) * 100).toFixed(1)}%)`
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
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          No conversation data available
        </div>
      )}
    </div>
  );
}