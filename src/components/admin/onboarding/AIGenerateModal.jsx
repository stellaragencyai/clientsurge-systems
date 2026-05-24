import { useState } from "react";
import { X, Sparkles, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEP_PROMPTS = {
  step_twilio: (c) => `You are a setup assistant for ${c.business_name}. Write a brief internal checklist note confirming Twilio SMS is configured for ${c.business_name} (${c.owner_name}). Their phone is ${c.phone}, their Twilio number is ${c.twilio_number || "TBD"}.`,
  step_lead_sources: (c) => `Write a confirmation note that lead sources (${c.lead_sources || "Google, Facebook, Instagram"}) are now connected to the automation system for ${c.business_name}.`,
  step_instant_response: (c) => `Draft an instant SMS response message for ${c.business_name} (${c.industry || "service business"}). Tone: ${c.tone_of_voice}. Services: ${c.services || "their services"}. Booking link: ${c.booking_link || "[BOOKING LINK]"}. Keep it under 160 characters, conversational, no emojis unless tone is Casual/Friendly.`,
  step_followup_sequence: (c) => `Draft a 3-message SMS follow-up sequence (Day 1, Day 3, Day 7) for ${c.business_name}. Tone: ${c.tone_of_voice}. Services: ${c.services}. Booking link: ${c.booking_link || "[BOOKING LINK]"}. Each message under 160 chars. Label them clearly.`,
  step_missed_call: (c) => `Draft a missed-call text-back SMS for ${c.business_name}. Tone: ${c.tone_of_voice}. It should acknowledge the missed call, introduce the business briefly, and send the booking link: ${c.booking_link || "[BOOKING LINK]"}. Under 160 characters.`,
  step_messages_customized: (c) => `Write a summary of all customized messages for ${c.business_name}: instant response, Day 1/3/7 follow-up, and missed call text-back. Tone: ${c.tone_of_voice}. Services: ${c.services}. Booking link: ${c.booking_link || "[BOOKING LINK]"}. Format clearly.`,
  step_tested: (c) => `Write an internal QA test checklist for ${c.business_name}'s automation system. Include: instant SMS response test, follow-up sequence trigger test, missed call text-back test, booking link validity, and CRM pipeline test.`,
  step_dashboard: (c) => `Write a brief client-facing client portal delivery note for ${c.owner_name} at ${c.business_name}. Explain what they can see in their portal: build progress, support chat, and paid-order setup status. Keep it warm and encouraging. Tone: ${c.tone_of_voice}.`,
  step_live: (c) => `Write a "You're Live!" congratulations message for ${c.owner_name} at ${c.business_name}. Their paid setup order has been marked live. Mention their services (${c.services || "services"}), booking link (${c.booking_link || "their booking link"}), and that support remains available. Tone: ${c.tone_of_voice}.`,
};

const STEP_LABELS = {
  step_twilio: "Twilio Configuration Note",
  step_lead_sources: "Lead Sources Confirmation",
  step_instant_response: "Instant Response SMS",
  step_followup_sequence: "Follow-Up Sequence (Day 1/3/7)",
  step_missed_call: "Missed Call Text-Back SMS",
  step_messages_customized: "All Messages Summary",
  step_tested: "QA Test Checklist",
  step_dashboard: "Client Portal Delivery Note",
  step_live: "Go-Live Congratulations",
};

export default function AIGenerateModal({ stepKey, client, onClose }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setContent("");
    const promptFn = STEP_PROMPTS[stepKey];
    if (!promptFn) { setLoading(false); return; }
    const prompt = promptFn(client);
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setContent(res);
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
        <div className="px-7 pt-7 pb-5 border-b border-border">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">AI Generate</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{STEP_LABELS[stepKey]}</span> for <span className="font-semibold text-foreground">{client.business_name}</span>
          </p>
        </div>

        <div className="px-7 py-6 space-y-4">
          {!content && !loading && (
            <p className="text-sm text-muted-foreground">
              Click Generate to draft the <strong>{STEP_LABELS[stepKey]}</strong> using {client.business_name}'s real info — services, tone, booking link, and more.
            </p>
          )}

          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Drafting content...</p>
            </div>
          )}

          {content && !loading && (
            <div className="relative">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={10}
                className="w-full rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={copy}
                className="absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-border hover:bg-muted transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={generate}
              disabled={loading}
              style={{ background: "linear-gradient(135deg,#005B99 0%,#0077B6 40%,#005B99 100%)", borderRadius: "9999px" }}
              className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-bold text-blue-100 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {content ? "Regenerate" : "Generate"}
            </button>
            <button onClick={onClose} className="px-5 h-11 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
