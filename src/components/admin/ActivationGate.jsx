import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ActivationGate({ installOS, onActivationChange }) {
  const [activatingWithOverride, setActivatingWithOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isEligible = installOS?.activation_eligible === true;
  const isActivated = installOS?.activation_status === "activated";

  const handleActivate = async (useOverride = false) => {
    try {
      setLoading(true);
      const user = await base44.auth.me();

      await base44.asServiceRole.entities.ClientInstallationOS.update(installOS.id, {
        activation_status: "activated",
        activation_approved_at: new Date().toISOString(),
        activation_approved_by: user?.email,
        activation_override: useOverride,
        activation_override_reason: useOverride ? overrideReason : null,
        activation_override_by: useOverride ? user?.email : null,
      });

      onActivationChange?.();
      setActivatingWithOverride(false);
      setOverrideReason("");
    } catch (error) {
      console.error("Activation error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isActivated) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">✓ Client Activated</p>
            <p className="text-sm text-green-700 mt-1">
              Activated {installOS.activation_approved_at && new Date(installOS.activation_approved_at).toLocaleDateString()}
              {installOS.activation_approved_by && ` by ${installOS.activation_approved_by}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      <div
        className={`rounded-lg border p-6 ${
          isEligible
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex items-start gap-3">
          {isEligible ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`font-semibold ${isEligible ? "text-green-900" : "text-amber-900"}`}>
              {isEligible ? "Ready for Activation" : "Not Ready for Activation"}
            </p>
            <p className={`text-sm mt-1 ${isEligible ? "text-green-700" : "text-amber-700"}`}>
              {isEligible
                ? "All required checklist items are complete. Client can be activated."
                : "Complete all checklist items before activation, or use override."}
            </p>
          </div>
        </div>
      </div>

      {/* Activation Button */}
      {isEligible && !activatingWithOverride && (
        <button
          onClick={() => handleActivate(false)}
          disabled={loading}
          className="w-full px-4 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
              Activating...
            </>
          ) : (
            "✓ Activate Client"
          )}
        </button>
      )}

      {/* Override Option */}
      {!isEligible && !activatingWithOverride && (
        <button
          onClick={() => setActivatingWithOverride(true)}
          className="w-full px-4 py-3 rounded-lg border-2 border-amber-600 text-amber-600 font-semibold hover:bg-amber-50 transition-colors"
        >
          Override & Activate
        </button>
      )}

      {/* Override Form */}
      {activatingWithOverride && (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-900">Override Activation</p>
          <textarea
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Reason for override (required)"
            className="w-full px-3 py-2 border border-amber-200 rounded text-sm placeholder-amber-400"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (overrideReason.trim()) {
                  handleActivate(true);
                }
              }}
              disabled={!overrideReason.trim() || loading}
              className="flex-1 px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60"
            >
              {loading ? "Confirming..." : "Confirm Override"}
            </button>
            <button
              onClick={() => {
                setActivatingWithOverride(false);
                setOverrideReason("");
              }}
              className="flex-1 px-4 py-2 rounded-lg border border-amber-300 text-amber-600 font-semibold hover:bg-amber-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}