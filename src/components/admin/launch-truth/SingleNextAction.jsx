import { ArrowRight, CreditCard, BarChart3, AlertOctagon, UserPlus, CalendarCheck, Phone, CheckCircle2 } from "lucide-react";

/**
 * Single Next Action Engine — picks the highest-priority next action
 * based on the Launch Truth Sprint report data.
 */
export default function SingleNextAction({ report, onRerun }) {
  if (!report) return null;

  const sp = report.sections?.stripe_payment || {};
  const ga = report.sections?.ga4 || {};
  const dt = report.sections?.dashboard_truth || {};
  const lc = report.sections?.lead_capture || {};
  const bp = report.sections?.booking_proof || {};
  const gates = report.gates || [];

  const hasPaidOrder = Boolean(sp.latest_paid_order);
  const ga4Active = ga.record_exists && ga.measurement_id_valid && ga.tracking_enabled && ga.setup_status === "active";
  const hasConversionEvents = ga.has_real_conversion_events;
  const hasProdFailures = (dt.failed_jobs_production > 0 || dt.stuck_jobs_production > 0 || dt.dead_letter_production > 0);
  const hasLeadProof = Boolean(lc.latest_website_lead) && (lc.linked_comm_logs?.length > 0 || lc.latest_comm_events?.length > 0);
  const hasBookingLink = bp.link_present && bp.link_looks_valid;
  const voiceGate = gates.find(g => g.gate_key === "twilio_voice_gate");
  const voiceFrontlineGate = gates.find(g => g.gate_key === "voice_frontline_gate");
  const voiceBlocked = (voiceGate?.status === "blocked") || (voiceFrontlineGate?.status === "blocked");

  let action = null;
  if (!hasPaidOrder) {
    action = { icon: CreditCard, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Complete Real Stripe Checkout", detail: "No production-trusted paid Order exists. Complete a real checkout with a non-test email and real business name." };
  } else if (!ga4Active || !hasConversionEvents) {
    action = { icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Configure GA4 & Generate Conversion Events", detail: !ga4Active ? "GA4 not configured or not active. Create a GA4 web stream and paste the Measurement ID." : "GA4 configured but no real ConversionTrackingEvent records (page_view + cta_click). Visit the homepage and click a CTA." };
  } else if (hasProdFailures) {
    action = { icon: AlertOctagon, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Resolve Production AutomationJob Failures", detail: `${dt.failed_jobs_production} failed, ${dt.stuck_jobs_production} stuck, ${dt.dead_letter_production} dead letters in production-trusted records.` };
  } else if (!hasLeadProof) {
    action = { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Submit a Real Lead & Verify SMS/Email Logs", detail: !lc.latest_website_lead ? "No production-trusted WebsiteLead found. Submit a real lead through the public form." : "Lead exists but no linked CommunicationLog or CommunicationEvent records found. Verify initial response automation fired." };
  } else if (!hasBookingLink) {
    action = { icon: CalendarCheck, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "Verify Booking Link & Capture Booking Proof", detail: bp.booking_link_default ? `Booking link present (${bp.booking_link_default}) but may not be valid. Verify it loads and complete a test booking.` : "No booking link configured. Set DEFAULT_BOOKING_LINK in Admin Settings." };
  } else if (voiceBlocked) {
    action = { icon: Phone, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "Configure/Verify Twilio Voice & ElevenLabs Live Call", detail: "Voice gates are blocked. Configure Twilio Voice webhook and ElevenLabs agent, then make a real test call." };
  } else {
    action = { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Review Ready-for-Proof Gates & Approve", detail: `${report.gates_ready_for_proof} gate(s) ready for proof. Review evidence and approve verified gates.` };
  }

  const Icon = action.icon;

  return (
    <div className={`rounded-xl border p-5 flex items-start gap-4 ${action.bg}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white`}>
        <Icon className={`w-5 h-5 ${action.color}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Single Next Action</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
        </div>
        <h3 className={`text-base font-bold ${action.color}`}>{action.label}</h3>
        <p className="text-sm text-foreground mt-1">{action.detail}</p>
      </div>
      {onRerun && (
        <button onClick={onRerun} className="flex-shrink-0 text-xs font-semibold text-primary hover:text-primary/80 whitespace-nowrap">
          Re-run Sprint →
        </button>
      )}
    </div>
  );
}