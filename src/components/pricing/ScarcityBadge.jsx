/**
 * Finding #93: Urgency/scarcity trigger for pricing page.
 * Shows "Only X setup slots left this month" to motivate purchase.
 */
import { Clock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScarcityBadge() {
  const [slotsLeft, setSlotsLeft] = useState(5);

  useEffect(() => {
    // Use current day of month to deterministically show fewer slots later in month
    const dayOfMonth = new Date().getDate();
    const remaining = Math.max(2, 8 - Math.floor(dayOfMonth / 4));
    setSlotsLeft(remaining);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
      <Clock className="w-3.5 h-3.5" />
      Only {slotsLeft} setup slots left this month
    </div>
  );
}