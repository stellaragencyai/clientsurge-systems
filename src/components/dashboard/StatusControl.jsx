import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const STATUSES = ["New", "Contacted", "Replied", "Qualified", "Booked", "Closed"];

const STATUS_COLORS = {
  "New": "bg-blue-100 text-blue-800 border-blue-300",
  "Contacted": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Replied": "bg-purple-100 text-purple-800 border-purple-300",
  "Qualified": "bg-green-100 text-green-800 border-green-300",
  "Booked": "bg-pink-100 text-pink-800 border-pink-300",
  "Closed": "bg-gray-100 text-gray-800 border-gray-300",
};

export default function StatusControl({ leadId, currentStatus, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus) return;

    setLoading(true);
    try {
      await base44.entities.Leads.update(leadId, { status: newStatus });
      onStatusChange?.(newStatus);
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Status</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={loading}
            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
              currentStatus === status
                ? `${STATUS_COLORS[status]} border-current`
                : "bg-muted text-muted-foreground border-muted hover:border-border"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {currentStatus === status && <Check className="w-4 h-4 inline mr-1" />}
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}