import { useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, CheckCircle2 } from "lucide-react";
import { getPackageOffer } from "@/lib/salesCatalog";
import { INDUSTRY_SELECTION_STORAGE_KEY } from "@/lib/industryRecommendations";
import { useNavigate } from "react-router-dom";

// ─── Quiz Questions ───────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: "problem",
    step: 1,
    label: "What's your biggest problem right now?",
    helper: "Pick the one that costs you the most money.",
    options: [
      { value: "slow_response", label: "Leads go cold before I can reply", icon: "⚡" },
      { value: "missed_calls", label: "I miss calls and lose jobs", icon: "📞" },
      { value: "no_followup", label: "Follow-up is manual and inconsistent", icon: "🔁" },
      { value: "no_bookings", label: "Interested people never actually book", icon: "📅" },
    ],
  },
  {
    id: "volume",
    step: 2,
    label: "How many new leads or inquiries do you get per month?",
    helper: "Estimate is fine.",
    options: [
      { value: "low", label: "Under 20", icon: "🌱" },
      { value: "medium", label: "20–60", icon: "📈" },
      { value: "high", label: "60–150", icon: "🚀" },
      { value: "very_high", label: "150+", icon: "🔥" },
    ],
  },
  {
    id: "booking",
    step: 3,
    label: "How does your booking process work today?",
    helper: "Be honest — this shapes what we build.",
    options: [
      { value: "none", label: "No real booking system — it's all by text or call", icon: "🤷" },
      { value: "manual", label: "I use a calendar link but follow-up is manual", icon: "🗓️" },
      { value: "partial", label: "I have some automation but big gaps remain", icon: "⚙️" },
      { value: "solid", label: "Booking is fine — I need better lead response", icon: "✅" },
    ],
  },
];

// ─── Scoring Logic ────────────────────────────────────────────────────────────

function scoreAnswers(answers) {
  let score = 0;

  // Problem weight
  if (answers.problem === "slow_response") score += 1;
  if (answers.problem === "missed_calls") score += 2;
  if (answers.problem === "no_followup") score += 2;
  if (answers.problem === "no_bookings") score += 1;

  // Volume weight
  if (answers.volume === "low") score += 0;
  if (answers.volume === "medium") score += 1;
  if (answers.volume === "high") score += 2;
  if (answers.volume === "very_high") score += 3;

  // Booking weight
  if (answers.booking === "none") score += 3;
  if (answers.booking === "manual") score += 2;
  if (answers.booking === "partial") score += 1;
  if (answers.booking === "solid") score += 0;

  if (score <= 3) return "starter_system";
  if (score <= 6) return "growth_system";
  return "pro_system";
}

function getRecommendationReason(answers) {
  const reasons = [];
  if (answers.problem === "missed_calls" || answers.problem === "no_followup") {
    reasons.push("Your biggest gap is response and follow-up — exactly what this system handles automatically.");
  } else if (answers.problem === "no_bookings") {
    reasons.push("The booking flow and guided handoff systems are built for your exact situation.");
  } else {
    reasons.push("Fast lead response is your highest-leverage starting point.");
  }
  if (answers.volume === "high" || answers.volume === "very_high") {
    reasons.push("Your lead volume means manual follow-up is costing you real bookings every week.");
  }
  if (answers.booking === "none" || answers.booking === "manual") {
    reasons.push("We'll include a booking flow setup so inquiries have somewhere to land.");
  }
  return reasons;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ currentStep, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1.5 rounded-full transition-all duration-500"
          style={{
            background: i < currentStep
              ? "linear-gradient(90deg,#7a4825,#c8965c)"
              : "rgba(154,92,46,0.15)",
          }}
        />
      ))}
    </div>
  );
}

function QuestionStep({ question, onSelect }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
        Step {question.step} of {QUESTIONS.length}
      </p>
      <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1 leading-snug">
        {question.label}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">{question.helper}</p>
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-200 hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{
              background: "rgba(255,255,255,0.85)",
              border: "1.5px solid rgba(154,92,46,0.18)",
              boxShadow: "0 2px 10px rgba(111,67,31,0.06)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(154,92,46,0.5)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(111,67,31,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(154,92,46,0.18)";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(111,67,31,0.06)";
            }}
          >
            <span className="text-2xl flex-shrink-0">{opt.icon}</span>
            <span className="text-sm font-semibold text-foreground">{opt.label}</span>
            <ArrowRight className="w-4 h-4 text-primary/40 ml-auto flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultStep({ packageKey, answers, onGoToStore, onBookDemo }) {
  const pkg = getPackageOffer(packageKey);
  const reasons = getRecommendationReason(answers);

  if (!pkg) return null;

  return (
    <div>
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-[0.18em]"
          style={{ background: "rgba(154,92,46,0.08)", border: "1px solid rgba(154,92,46,0.18)", color: "#9a5c2e" }}
        >
          ✦ Your Recommended System
        </div>
        <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {pkg.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
          {pkg.fit}
        </p>
      </div>

      {/* Pricing summary */}
      <div
        className="rounded-2xl px-5 py-5 mb-5"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,245,239,0.94) 100%)",
          border: "1.5px solid rgba(154,92,46,0.22)",
          boxShadow: "0 8px 24px rgba(111,67,31,0.09)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-foreground">${pkg.monthly_total}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <p className="text-xs text-muted-foreground">${pkg.setup_total} one-time setup</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-green-600">Save ${pkg.setup_savings + pkg.monthly_savings}/mo vs. à la carte</p>
            <p className="text-xs text-muted-foreground">No contracts · Cancel anytime</p>
          </div>
        </div>
        <div className="space-y-2">
          {pkg.included_services.map((svc) => (
            <div key={svc.product_id} className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-foreground/80">{svc.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why this fits */}
      <div className="space-y-2 mb-6">
        {reasons.map((reason, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: "rgba(154,92,46,0.05)", border: "1px solid rgba(154,92,46,0.1)" }}>
            <span className="text-primary mt-0.5 flex-shrink-0">→</span>
            <p className="text-sm text-foreground/75 leading-relaxed">{reason}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onGoToStore}
          style={{
            borderRadius: "9999px",
            padding: "2px",
            background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
            boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.95rem" }}>
            Build My System in the Store
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
        <button
          type="button"
          onClick={onBookDemo}
          className="w-full h-12 rounded-full border border-primary/25 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          Start a Free Automation Audit Instead
        </button>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function SystemQuiz({ onClose, onBookDemo }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const currentQuestion = QUESTIONS[stepIndex];
  const totalSteps = QUESTIONS.length;

  const handleSelect = (value) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (stepIndex < QUESTIONS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      const packageKey = scoreAnswers(newAnswers);
      setResult(packageKey);
    }
  };

  const handleGoToStore = () => {
    // Store the result so the Store page picks it up
    if (result) {
      try {
        window.sessionStorage.setItem("clientsurge:quiz-package", result);
        window.sessionStorage.setItem(INDUSTRY_SELECTION_STORAGE_KEY, "");
        window.dispatchEvent(new CustomEvent("clientsurge:industry-selected"));
      } catch {}
    }
    onClose();
    navigate("/store");
  };

  const handleBookDemo = () => {
    onClose();
    onBookDemo?.();
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
    } else {
      setStepIndex((i) => Math.max(0, i - 1));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-50"
          style={{ background: "linear-gradient(180deg, #fdfbf8 0%, #f8f3eb 100%)" }}
        >
          {/* Header */}
          <div
            className="px-7 pt-7 pb-5 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(154,92,46,0.12)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-black text-xs">CS</span>
              </div>
              <span className="text-sm font-bold text-foreground">Find My System</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="px-7 py-6">
            <ProgressBar currentStep={result ? totalSteps : stepIndex} total={totalSteps} />

            {result ? (
              <ResultStep
                packageKey={result}
                answers={answers}
                onGoToStore={handleGoToStore}
                onBookDemo={handleBookDemo}
              />
            ) : (
              <QuestionStep question={currentQuestion} onSelect={handleSelect} />
            )}

            {/* Back button */}
            {(stepIndex > 0 || result) && (
              <button
                type="button"
                onClick={handleBack}
                className="mt-4 w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
