/**
 * VoiceAgentUpsell — one-click AI Voice Receptionist add-on banner.
 * Shown in CartSidebar when the user has a system package but no voice add-on.
 * Dramatically increases AOV by surfacing the highest-value add-on at decision point.
 */
import { Phone, Mic, X } from "lucide-react";
import { useState } from "react";

const VOICE_PRODUCT = {
  product_id: "voice_receptionist_addon",
  product_name: "AI Voice Receptionist",
  service_key: "ai_voice_receptionist",
  setup_fee: 500,
  monthly_fee: 200,
  icon: "🎙️",
  description: "ElevenLabs-powered inbound receptionist answers every call, qualifies the lead, and books appointments — 24/7.",
};

export default function VoiceAgentUpsell({ cartItems = [], onAdd }) {
  const [dismissed, setDismissed] = useState(false);

  const hasPackage = cartItems.some((i) =>
    ["starter_system", "growth_system", "elite_system"].includes(i.source_package_key)
  );
  const hasVoice = cartItems.some((i) => i.service_key === "ai_voice_receptionist");

  if (!hasPackage || hasVoice || dismissed) return null;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg,rgba(0,59,143,0.05),rgba(0,174,239,0.05))",
        borderColor: "rgba(0,174,239,0.25)",
      }}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: "rgba(0,174,239,0.1)", border: "1.5px solid rgba(0,174,239,0.2)" }}
        >
          🎙️
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-bold text-foreground">Add AI Voice Receptionist</p>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
              style={{ background: "rgba(0,174,239,0.12)", color: "#0088CC" }}
            >
              Popular
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">{VOICE_PRODUCT.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-bold text-foreground">
              $500 setup · <span className="text-primary">$200/mo</span>
            </span>
            <button
              onClick={() => onAdd?.(VOICE_PRODUCT)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
            >
              <Mic className="w-3 h-3" /> Add to Cart
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Dismiss voice upsell"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}