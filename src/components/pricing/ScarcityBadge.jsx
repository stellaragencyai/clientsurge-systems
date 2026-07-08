import { Clock } from "lucide-react";

export default function ScarcityBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
      <Clock className="w-3.5 h-3.5" />
      Setup capacity is checked before checkout is created
    </div>
  );
}
