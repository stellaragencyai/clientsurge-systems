import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import SenderReadinessChecklist from "./SenderReadinessChecklist";

/**
 * SmsDiagnosticsPanel: Admin panel for SMS diagnostics, delivery proof, and sender compliance
 */
export default function SmsDiagnosticsPanel() {
  const [deliveryProof, setDeliveryProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fromNumber = import.meta.env.VITE_TWILIO_FROM_NUMBER || "+16025843227";

  const runDeliveryProof = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/delivery-proof-test", { method: "POST" });
      const data = await response.json();
      setDeliveryProof(data);
      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load the last proof on mount
    runDeliveryProof();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">📱 SMS Diagnostics & Delivery Proof</h2>

        {/* Sender Readiness Checklist */}
        <SenderReadinessChecklist
          latestDeliveryProof={deliveryProof}
          twilioFromNumber={fromNumber}
        />

        {/* Run Delivery Proof Button */}
        <button
          onClick={runDeliveryProof}
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Running Delivery Proof..." : "Run Delivery Proof Test"}
        </button>

        {/* Delivery Proof Result */}
        {deliveryProof && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">📊 Latest Delivery Proof Result</h3>

            {/* Diagnostic Alert */}
            {deliveryProof.diagnostic && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-2">
                      🚫 {deliveryProof.diagnostic.title}
                    </h4>
                    <p className="text-red-800 mb-3">{deliveryProof.diagnostic.explanation}</p>
                    <div className="bg-white rounded p-3 mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">NEXT ACTIONS:</p>
                      <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                        {deliveryProof.diagnostic.next_action.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ol>
                    </div>
                    {deliveryProof.diagnostic.is_launch_blocker && (
                      <p className="text-xs font-bold text-red-900 bg-red-100 px-2 py-1 rounded inline-block">
                        ⛔ LAUNCH BLOCKER — Fix before production SMS
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success Alert */}
            {deliveryProof.provider_message_id && !deliveryProof.diagnostic && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">✓ SMS Accepted by Twilio</h4>
                    <p className="text-green-800 text-sm mt-1">Message SID: {deliveryProof.provider_message_id}</p>
                    <p className="text-green-800 text-sm">Status: {deliveryProof.provider_status}</p>
                    <p className="text-green-700 text-xs mt-2">
                      Awaiting delivery confirmation via status callback webhook.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Test Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">TO ADDRESS</p>
                <p className="text-sm font-mono text-gray-900">{deliveryProof.normalized_phone}</p>
                <p className="text-xs text-gray-600 mt-1">Raw: {deliveryProof.raw_phone}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">FROM ADDRESS</p>
                <p className="text-sm font-mono text-gray-900">{deliveryProof.twilio_from}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">DELIVERY STATUS</p>
                <p className="text-sm text-gray-900">{deliveryProof.delivery_status}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">PROVIDER STATUS</p>
                <p className="text-sm text-gray-900">{deliveryProof.provider_status}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">ERROR CODE</p>
                <p className="text-sm font-mono text-gray-900">{deliveryProof.error_code || "None"}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">TIMESTAMP</p>
                <p className="text-sm text-gray-900">{new Date(deliveryProof.timestamp).toLocaleString()}</p>
              </div>
            </div>

            {/* Error Details */}
            {deliveryProof.error && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-yellow-900 mb-2">⚠️ ERROR DETAILS</p>
                <p className="text-sm text-yellow-800 font-mono">{deliveryProof.error}</p>
              </div>
            )}

            {/* CommunicationLog Reference */}
            {deliveryProof.communication_log_id && (
              <div className="mt-4 text-xs text-gray-600">
                <p>
                  Communication Log ID:{" "}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {deliveryProof.communication_log_id}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* No Result Yet */}
        {!deliveryProof && !loading && (
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-700 mb-4">No delivery proof test has been run yet.</p>
            <p className="text-sm text-gray-600">Click "Run Delivery Proof Test" to check SMS sender compliance.</p>
          </div>
        )}
      </div>
    </div>
  );
}