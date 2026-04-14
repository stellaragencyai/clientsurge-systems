export default function AIClassificationBadge({ intent, confidence }) {
  if (!intent) return null;

  const intentConfig = {
    question: { label: 'Question', color: 'bg-blue-100 text-blue-800' },
    pricing_interest: { label: 'Pricing Interest', color: 'bg-purple-100 text-purple-800' },
    availability_interest: { label: 'Availability Interest', color: 'bg-green-100 text-green-800' },
    booking_ready: { label: 'Booking Ready', color: 'bg-emerald-100 text-emerald-800' },
    unsure: { label: 'Unsure', color: 'bg-yellow-100 text-yellow-800' },
    not_interested: { label: 'Not Interested', color: 'bg-red-100 text-red-800' },
    stop: { label: 'Stop', color: 'bg-red-200 text-red-900' },
    other: { label: 'Other', color: 'bg-gray-100 text-gray-800' },
  };

  const config = intentConfig[intent] || intentConfig.other;

  return (
    <div className="flex items-center gap-2">
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
      {confidence && (
        <span className="text-xs text-muted-foreground">
          {Math.round(confidence * 100)}% confidence
        </span>
      )}
    </div>
  );
}