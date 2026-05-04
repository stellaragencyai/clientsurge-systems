import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Circle, ChevronDown, ChevronUp,
  Phone, Settings, Zap, TestTube, Rocket, AlertCircle, Copy
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: Phone,
    color: "#7C3AED",
    title: "Client Pays for Missed Call Text-Back",
    time: "0 min (automatic)",
    auto: true,
    desc: "This happens automatically via Stripe.",
    tasks: [
      "Client completes checkout on the store page",
      "Stripe fires checkout.session.completed webhook",
      "System creates an Order with payment_status = \"paid\"",
      "System emails client: \"Complete Your Setup\" with their credentials intake link",
      "System emails you (admin) a purchase notification",
      "✅ Nothing to do — all automatic",
    ],
  },
  {
    id: 2,
    icon: Settings,
    color: "#0088CC",
    title: "Client Submits Setup Credentials",
    time: "~5 min (client does this)",
    auto: false,
    desc: "The client fills out their setup form via the link they received. You don't do this — they do.",
    tasks: [
      "Client clicks the link in their confirmation email: /setup/credentials?order_id=XXX",
      "They fill in: Business name, phone number, business hours",
      "They set their after-hours behavior (send SMS vs hold)",
      "They optionally add their Twilio number if they already have one",
      "They click Submit",
      "System auto-runs a pre-flight check and attempts activation",
      "✅ You receive an admin email confirming credentials were submitted",
    ],
  },
  {
    id: 3,
    icon: Phone,
    color: "#7C3AED",
    title: "Provision a Twilio Phone Number (if needed)",
    time: "~5 min",
    auto: false,
    desc: "If the client doesn't have an existing Twilio number, you provision one for them.",
    tasks: [
      "Go to /admin/onboarding and find the client's card",
      "Click the card to expand it",
      "In the Package Activation Panel, click \"AI Pre-Flight Check\"",
      "If it says \"Missing: Business phone number\" — you need to provision one",
      "Go to twilio.com → Phone Numbers → Buy a Number",
      "Search for a local area code matching the client's city",
      "Purchase the number ($1/month)",
      "Copy the number (e.g. +16025550100)",
      "Go back to the Order in admin and update install_configuration.shared.twilio_business_phone with the number",
      "Run the pre-flight check again — it should now say ✅ Ready",
    ],
  },
  {
    id: 4,
    icon: Settings,
    color: "#059669",
    title: "Configure Twilio Webhook on the Phone Number",
    time: "~5 min",
    auto: false,
    desc: "Tell Twilio to send missed call events to your system.",
    tasks: [
      "Log in to twilio.com",
      "Go to Phone Numbers → Manage → Active Numbers",
      "Click the phone number you just provisioned (or the client's existing number)",
      "Under \"Voice & Fax\" → \"A Call Comes In\":",
      "  → Set to: Webhook",
      "  → URL: https://[your-app].base44.app/functions/receiveTwilioMissedCallWebhook",
      "  → Method: HTTP POST",
      "Under \"Call Status Changes\":",
      "  → URL: https://[your-app].base44.app/functions/receiveTwilioSmsStatusCallback",
      "Click Save",
      "✅ Twilio will now notify your system on every missed call",
    ],
    note: "Find your exact function URL at: Dashboard → Code → Functions → receiveTwilioMissedCallWebhook",
  },
  {
    id: 5,
    icon: Zap,
    color: "#D97706",
    title: "Activate the Service",
    time: "~2 min",
    auto: false,
    desc: "Trigger the automated configuration of the Missed Call Text-Back service.",
    tasks: [
      "Go to /admin/onboarding",
      "Find the client's card and expand it",
      "In the Package Activation Panel, click \"AI Pre-Flight Check\"",
      "Confirm it shows ✅ Ready (no blockers)",
      "Click \"Activate All Services\"",
      "Wait ~10 seconds — the system will:",
      "  → Generate a personalized SMS template for this client",
      "  → Register the service as \"Live\" in their order",
      "  → Send the client a go-live notification email",
      "✅ Service is now active",
    ],
  },
  {
    id: 6,
    icon: TestTube,
    color: "#DC2626",
    title: "Run a Live Test",
    time: "~3 min",
    auto: false,
    desc: "Verify the automation fires correctly before handing off to the client.",
    tasks: [
      "Call the client's Twilio number from your own cell phone",
      "Let it ring — do NOT answer it",
      "Hang up after 3-4 rings",
      "Wait 60 seconds",
      "Check your cell phone — you should receive an SMS from the Twilio number",
      "The message should reference the client's business name",
      "Go to /admin → CommunicationEvent logs — confirm the event was logged",
      "✅ If you got the SMS, the system is working correctly",
    ],
    note: "If no SMS arrives: check Twilio webhook URL is correct, and that TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN secrets are set.",
  },
  {
    id: 7,
    icon: Rocket,
    color: "#16a34a",
    title: "Hand Off to Client",
    time: "~5 min",
    auto: false,
    desc: "Send the client confirmation that their system is live.",
    tasks: [
      "Send the client an email or text confirming their Missed Call Text-Back is live",
      "Tell them: every missed call to [their Twilio number] will now receive an automatic text-back within 60 seconds",
      "Remind them: they should forward their main business number to the Twilio number (or update their Google Business listing to the Twilio number)",
      "Optional: send them a short video walkthrough of what their customers will experience",
      "Log into /admin/onboarding → mark \"Client Portal Delivered\" as complete",
      "✅ Client is fully live",
    ],
    note: "Important: The automation only fires on the Twilio number. The client must route calls to it.",
  },
];

function StepCard({ step, isOpen, onToggle, completed, onToggleComplete }) {
  const Icon = step.icon;
  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all"
      style={{
        borderColor: completed ? "rgba(34,197,94,0.4)" : isOpen ? `${step.color}40` : "hsl(var(--border))",
        background: completed ? "rgba(34,197,94,0.03)" : "white",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-black"
          style={{ background: completed ? "#16a34a" : `linear-gradient(135deg, ${step.color}, ${step.color}99)` }}
        >
          {completed ? <CheckCircle2 className="w-5 h-5" /> : step.id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-sm ${completed ? "text-green-800 line-through opacity-60" : "text-foreground"}`}>
              {step.title}
            </p>
            {step.auto && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">Auto</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">⏱ {step.time}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onToggleComplete(); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
            style={{
              borderColor: completed ? "rgba(34,197,94,0.4)" : "hsl(var(--border))",
              color: completed ? "#16a34a" : "hsl(var(--muted-foreground))",
              background: completed ? "rgba(34,197,94,0.08)" : "transparent",
            }}
          >
            {completed ? "Done ✓" : "Mark Done"}
          </button>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border px-5 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">{step.desc}</p>
          <div className="space-y-2">
            {step.tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white"
                  style={{ background: task.startsWith("✅") ? "#16a34a" : task.startsWith("  →") ? "#e5e7eb" : step.color }}
                >
                  {task.startsWith("✅") ? "✓" : task.startsWith("  →") ? "" : i + 1}
                </div>
                <p className={`text-sm leading-relaxed ${task.startsWith("✅") ? "text-green-700 font-semibold" : task.startsWith("  →") ? "text-muted-foreground pl-2" : "text-foreground"}`}>
                  {task.replace("✅ ", "").replace("  → ", "→ ")}
                </p>
              </div>
            ))}
          </div>
          {step.note && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{step.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminInstallGuide() {
  const navigate = useNavigate();
  const [openStep, setOpenStep] = useState(1);
  const [completed, setCompleted] = useState(new Set());

  const toggle = (id) => setOpenStep(prev => prev === id ? null : id);
  const toggleComplete = (id) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const doneCount = completed.size;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Admin
            </button>
            <div className="w-px h-5 bg-border" />
            <div>
              <h1 className="font-semibold text-foreground text-lg leading-tight">Installation Guide</h1>
              <p className="text-xs text-muted-foreground">Missed Call Text-Back · Step-by-step</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg,#16a34a,#22c55e)" }}
              />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{doneCount}/{STEPS.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Intro */}
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">Missed Call Text-Back</p>
              <p className="text-xs text-blue-200">Total setup time: ~20 minutes</p>
            </div>
          </div>
          <p className="text-sm text-blue-100 leading-relaxed">
            This guide walks you through everything needed to get a client's Missed Call Text-Back live — from payment to their first real test. Steps 1 and 2 are automatic. You only action Steps 3–7.
          </p>
          <div className="flex gap-4 mt-4">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-lg font-black text-white">2</p>
              <p className="text-[10px] text-blue-200 uppercase tracking-wide">Auto Steps</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-lg font-black text-white">5</p>
              <p className="text-[10px] text-blue-200 uppercase tracking-wide">Manual Steps</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-lg font-black text-white">~20</p>
              <p className="text-[10px] text-blue-200 uppercase tracking-wide">Minutes Total</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map(step => (
            <StepCard
              key={step.id}
              step={step}
              isOpen={openStep === step.id}
              onToggle={() => toggle(step.id)}
              completed={completed.has(step.id)}
              onToggleComplete={() => toggleComplete(step.id)}
            />
          ))}
        </div>

        {/* Done state */}
        {doneCount === STEPS.length && (
          <div className="rounded-2xl border border-green-300 bg-green-50 p-6 text-center space-y-2">
            <div className="text-3xl">🎉</div>
            <p className="font-bold text-green-800 text-lg">Client is fully live!</p>
            <p className="text-sm text-green-700">Missed Call Text-Back is active and tested. Their customers will now receive an automatic text-back within 60 seconds of every missed call.</p>
            <button
              onClick={() => navigate("/admin/onboarding")}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)" }}
            >
              View in Onboarding Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}