import { Plus, Trash2 } from "lucide-react";

const TONE_OPTIONS = [
  { value: "professional", label: "Professional", description: "Formal, trustworthy, business-focused" },
  { value: "friendly", label: "Friendly", description: "Warm, approachable, conversational" },
  { value: "luxury", label: "Luxury", description: "Premium, exclusive, high-end" },
  { value: "casual", label: "Casual", description: "Relaxed, informal, direct" },
];

const BOOKING_MODE_OPTIONS = [
  { value: "external_link", label: "External Booking Link" },
  { value: "internal_placeholder", label: "Internal Placeholder" },
];

const BOOKING_INTAKE_FIELD_OPTIONS = [
  { value: "lead_name", label: "Lead Name" },
  { value: "lead_email", label: "Lead Email" },
  { value: "lead_phone", label: "Lead Phone" },
  { value: "customer_name", label: "Customer Name" },
  { value: "customer_email", label: "Customer Email" },
  { value: "customer_phone", label: "Customer Phone" },
  { value: "preferred_time", label: "Preferred Time" },
  { value: "notes", label: "Notes" },
];

const LEAD_REACTIVATION_SEGMENT_OPTIONS = [
  { value: "all_dormant", label: "All Dormant Leads" },
  { value: "contacted_no_reply", label: "Contacted, No Reply" },
  { value: "qualified_unbooked", label: "Qualified, Not Booked" },
];

const REVIEW_REQUEST_TRIGGER_OPTIONS = [
  { value: "appointment_completed", label: "Appointment Completed" },
  { value: "order_completed", label: "Order Completed" },
  { value: "manual_trigger", label: "Manual Trigger" },
];

const REVIEW_REQUEST_CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
];

function LabeledField({ label, children, helper }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function SuggestionCard({ suggestion, actionLabel = "Use suggestion", onApply }) {
  if (!suggestion) return null;
  return (
    <div className={`rounded-xl border p-3 ${suggestion.available ? "border-blue-200 bg-blue-50/60" : "border-blue-200 bg-blue-50/70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{suggestion.label}</p>
          {suggestion.rationale ? <p className="text-xs text-muted-foreground">{suggestion.rationale}</p> : null}
        </div>
        {suggestion.available ? (
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {typeof suggestion.value === "string" && suggestion.value ? (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-white/70 bg-white/80 px-3 py-3 text-xs text-foreground">{suggestion.value}</pre>
      ) : null}
    </div>
  );
}

function getSuggestionField(suggestions, field) {
  return suggestions?.fields?.[field] || null;
}

function ToneSelector({ serviceKey, value, onChange }) {
  return (
    <LabeledField label="AI Response Tone" helper="Sets the communication style for all AI-generated messages for this service.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TONE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(serviceKey, "tone", option.value)}
            className={`rounded-xl border px-3 py-3 text-left transition-all ${
              value === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-white text-foreground hover:border-primary/50"
            }`}
          >
            <p className="text-xs font-bold">{option.label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground leading-snug">{option.description}</p>
          </button>
        ))}
      </div>
    </LabeledField>
  );
}

function NurtureSequenceBuilder({ serviceKey, value, suggestions, onToggleChannel, onAddStep, onRemoveStep, onStepChange, onApplyPreset }) {
  const steps = Array.isArray(value?.steps) ? value.steps : [];
  const starterSmsSuggestion = getSuggestionField(suggestions, "sms_step_template");
  const starterEmailSuggestion = getSuggestionField(suggestions, "email_step_template");
  const starterSequence = suggestions?.presets?.starter_sequence || null;

  return (
    <div className="space-y-4">
      {starterSequence ? (
        <SuggestionCard
          suggestion={{
            label: starterSequence.label,
            value: starterSequence.value?.steps || [],
            source_labels: starterSequence.source_labels,
            rationale: starterSequence.rationale,
            available: starterSequence.available !== false,
          }}
          actionLabel="Use starter sequence"
          onApply={() => onApplyPreset(serviceKey, starterSequence.value)}
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
          <input type="checkbox" checked={Boolean(value?.sms_enabled)} onChange={(e) => onToggleChannel(serviceKey, "sms_enabled", e.target.checked)} className="h-4 w-4" />
          Enable SMS
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
          <input type="checkbox" checked={Boolean(value?.email_enabled)} onChange={(e) => onToggleChannel(serviceKey, "email_enabled", e.target.checked)} className="h-4 w-4" />
          Enable Email
        </label>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={`${serviceKey}:step:${index}`} className="rounded-xl border border-border bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Step {index + 1}</p>
              <button type="button" onClick={() => onRemoveStep(serviceKey, index)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-[120px_160px_minmax(0,1fr)]">
              <LabeledField label="Day">
                <input type="number" min="1" value={step.day ?? ""} onChange={(e) => onStepChange(serviceKey, index, "day", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </LabeledField>
              <LabeledField label="Channel">
                <select value={step.channel || ""} onChange={(e) => onStepChange(serviceKey, index, "channel", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select...</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </LabeledField>
              <LabeledField label="Message Template">
                <textarea value={step.message_template || ""} onChange={(e) => onStepChange(serviceKey, index, "message_template", e.target.value)} rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder={step.channel === "email" ? (starterEmailSuggestion?.value || "Template for this nurture email step...") : (starterSmsSuggestion?.value || "Template for this nurture SMS step...")} />
              </LabeledField>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onAddStep(serviceKey)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary">
        <Plus className="h-3.5 w-3.5" /> Add Sequence Step
      </button>
    </div>
  );
}

function BookingAgentBuilder({ serviceKey, value, suggestions, onChange, onApplySuggestion }) {
  const intakeFields = Array.isArray(value?.intake_fields) ? value.intake_fields : [];
  const bookingModeSuggestion = getSuggestionField(suggestions, "booking_mode");
  const intakeFieldsSuggestion = getSuggestionField(suggestions, "intake_fields");
  const confirmationSuggestion = getSuggestionField(suggestions, "confirmation_template");
  const reminderSuggestion = getSuggestionField(suggestions, "reminder_template");

  return (
    <div className="grid gap-4">
      <LabeledField label="Booking Link" helper="Required. The booking URL the AI Booking Agent will drive leads into.">
        <input type="url" value={value?.booking_link || ""} onChange={(e) => onChange(serviceKey, "booking_link", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="https://calendly.com/your-team/demo" />
      </LabeledField>
      <LabeledField label="Booking Mode" helper="Required.">
        {bookingModeSuggestion ? <div className="mb-2"><SuggestionCard suggestion={bookingModeSuggestion} actionLabel="Use suggestion" onApply={() => onApplySuggestion(serviceKey, "booking_mode", bookingModeSuggestion.value)} /></div> : null}
        <select value={value?.booking_mode || ""} onChange={(e) => onChange(serviceKey, "booking_mode", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">Select mode...</option>
          {BOOKING_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </LabeledField>
      <LabeledField label="Booking Business Hours">
        <input type="text" value={value?.business_hours || ""} onChange={(e) => onChange(serviceKey, "business_hours", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Mon-Fri 8am-5pm" />
      </LabeledField>
      <LabeledField label="Confirmation Template" helper="Required.">
        {confirmationSuggestion ? <div className="mb-2"><SuggestionCard suggestion={confirmationSuggestion} actionLabel="Use suggestion" onApply={() => onApplySuggestion(serviceKey, "confirmation_template", confirmationSuggestion.value)} /></div> : null}
        <textarea value={value?.confirmation_template || ""} onChange={(e) => onChange(serviceKey, "confirmation_template", e.target.value)} rows={4} className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Thanks {{first_name}}. Your booking is confirmed: {{booking_link}}" />
      </LabeledField>
      <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
        <input type="checkbox" checked={Boolean(value?.reminder_enabled)} onChange={(e) => onChange(serviceKey, "reminder_enabled", e.target.checked)} className="h-4 w-4" />
        Enable booking reminder follow-up
      </label>
      {value?.reminder_enabled ? (
        <LabeledField label="Reminder Template" helper="Required when reminders are enabled.">
          {reminderSuggestion ? <div className="mb-2"><SuggestionCard suggestion={reminderSuggestion} actionLabel="Use suggestion" onApply={() => onApplySuggestion(serviceKey, "reminder_template", reminderSuggestion.value)} /></div> : null}
          <textarea value={value?.reminder_template || ""} onChange={(e) => onChange(serviceKey, "reminder_template", e.target.value)} rows={3} className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Reminder: your booking is scheduled for {{scheduled_at}}." />
        </LabeledField>
      ) : null}
      <LabeledField label="Required Intake Fields">
        {intakeFieldsSuggestion ? <div className="mb-2"><SuggestionCard suggestion={intakeFieldsSuggestion} actionLabel="Use suggestion" onApply={() => onApplySuggestion(serviceKey, "intake_fields", intakeFieldsSuggestion.value)} /></div> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {BOOKING_INTAKE_FIELD_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
              <input type="checkbox" checked={intakeFields.includes(option.value)} onChange={(e) => { const next = e.target.checked ? [...intakeFields, option.value] : intakeFields.filter((f) => f !== option.value); onChange(serviceKey, "intake_fields", next); }} className="h-4 w-4" />
              {option.label}
            </label>
          ))}
        </div>
      </LabeledField>
    </div>
  );
}

function LeadReactivationBuilder({ serviceKey, value, suggestions, onChange, onApplySuggestion }) {
  const targetSegmentSuggestion = getSuggestionField(suggestions, "target_segment");
  const messageSuggestion = getSuggestionField(suggestions, "message_template");

  return (
    <div className="grid gap-4">
      <LabeledField label="Target Segment" helper="Required.">
        {targetSegmentSuggestion ? <div className="mb-2"><SuggestionCard suggestion={targetSegmentSuggestion} actionLabel="Use suggestion" onApply={() => onApplySuggestion(serviceKey, "target_segment", targetSegmentSuggestion.value)} /></div> : null}
        <select value={value?.target_segment || ""} onChange={(e) => onChange(serviceKey, "target_segment", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">Select segment...</option>
          {LEAD_REACTIVATION_SEGMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </LabeledField>
      <LabeledField label="Message Template" helper="Required.">
        {messageSuggestion ? <div className="mb-2"><SuggestionCard suggestion={messageSuggestion} actionLabel="Use suggestion" onApply={() => onApplySuggestion(serviceKey, "message_template", messageSuggestion.value)} /></div> : null}
        <textarea value={value?.message_template || ""} onChange={(e) => onChange(serviceKey, "message_template", e.target.value)} rows={4} className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Hi {{first_name}}, checking back in from {{business_name}}..." />
      </LabeledField>
      <LabeledField label="Max Batch Size">
        <input type="number" min="1" max="250" value={value?.max_batch_size ?? 25} onChange={(e) => onChange(serviceKey, "max_batch_size", Number(e.target.value) || 1)} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </LabeledField>
    </div>
  );
}

function ReviewRequestBuilder({ serviceKey, value, suggestions, onChange, onApplySuggestion }) {
  const channelSuggestion = getSuggestionField(suggestions, "channel");
  const messageSuggestion = getSuggestionField(suggestions, "message_template");

  return (
    <div className="grid gap-4">
      <LabeledField label="Review Link" helper="Required.">
        <input type="url" value={value?.review_link || ""} onChange={(e) => onChange(serviceKey, "review_link", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="https://g.page/r/your-review-link" />
      </LabeledField>
      <LabeledField label="Trigger Event" helper="Required.">
        <select value={value?.trigger_event || ""} onChange={(e) => onChange(serviceKey, "trigger_event", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">Select trigger...</option>
          {REVIEW_REQUEST_TRIGGER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </LabeledField>
      <LabeledField label="Message Template" helper="Required.">
        {messageSuggestion ? <div className="mb-2"><SuggestionCard suggestion={messageSuggestion} actionLabel="Use suggestion" onApply={() => onApplySuggestion(serviceKey, "message_template", messageSuggestion.value)} /></div> : null}
        <textarea value={value?.message_template || ""} onChange={(e) => onChange(serviceKey, "message_template", e.target.value)} rows={4} className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Hi {{first_name}}, thanks for visiting. Leave a review: {{review_link}}" />
      </LabeledField>
      <LabeledField label="Channel" helper="Required.">
        {channelSuggestion ? <div className="mb-2"><SuggestionCard suggestion={channelSuggestion} actionLabel="Use suggestion" onApply={() => onApplySuggestion(serviceKey, "channel", channelSuggestion.value)} /></div> : null}
        <select value={value?.channel || ""} onChange={(e) => onChange(serviceKey, "channel", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">Select channel...</option>
          {REVIEW_REQUEST_CHANNEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </LabeledField>
      <LabeledField label="Send Delay (Minutes)">
        <input type="number" min="0" max="43200" value={value?.send_delay_minutes ?? ""} onChange={(e) => onChange(serviceKey, "send_delay_minutes", e.target.value === "" ? "" : Number(e.target.value))} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="0" />
      </LabeledField>
      <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
        <input type="checkbox" checked={Boolean(value?.fallback_internal_feedback_enabled)} onChange={(e) => onChange(serviceKey, "fallback_internal_feedback_enabled", e.target.checked)} className="h-4 w-4" />
        Enable internal feedback fallback
      </label>
    </div>
  );
}

export default function ServiceConfigEditor({ service, value, onChange, onApplySuggestion, onApplyPreset, onToggleChannel, onAddStep, onRemoveStep, onStepChange }) {
  const isNurture = service.service_key === "nurture_sequence_14d";
  const isBooking = service.service_key === "ai_booking_agent";
  const isReactivation = service.service_key === "lead_reactivation";
  const isReview = service.service_key === "review_request";

  return (
    <div className="space-y-5">
      <ToneSelector serviceKey={service.service_key} value={value?.tone} onChange={onChange} />

      {isNurture && (
        <NurtureSequenceBuilder
          serviceKey={service.service_key}
          value={value || {}}
          suggestions={service.config_suggestions}
          onToggleChannel={onToggleChannel}
          onAddStep={onAddStep}
          onRemoveStep={onRemoveStep}
          onStepChange={onStepChange}
          onApplyPreset={onApplyPreset}
        />
      )}
      {isBooking && (
        <BookingAgentBuilder
          serviceKey={service.service_key}
          value={value || {}}
          suggestions={service.config_suggestions}
          onChange={onChange}
          onApplySuggestion={onApplySuggestion}
        />
      )}
      {isReactivation && (
        <LeadReactivationBuilder
          serviceKey={service.service_key}
          value={value || {}}
          suggestions={service.config_suggestions}
          onChange={onChange}
          onApplySuggestion={onApplySuggestion}
        />
      )}
      {isReview && (
        <ReviewRequestBuilder
          serviceKey={service.service_key}
          value={value || {}}
          suggestions={service.config_suggestions}
          onChange={onChange}
          onApplySuggestion={onApplySuggestion}
        />
      )}
      {!isNurture && !isBooking && !isReactivation && !isReview && (
        <LabeledField label="SMS Template">
          {getSuggestionField(service.config_suggestions, "sms_template") ? (
            <div className="mb-2">
              <SuggestionCard
                suggestion={getSuggestionField(service.config_suggestions, "sms_template")}
                actionLabel="Use suggestion"
                onApply={() => onApplySuggestion(service.service_key, "sms_template", getSuggestionField(service.config_suggestions, "sms_template")?.value)}
              />
            </div>
          ) : null}
          <textarea
            value={value?.sms_template || ""}
            onChange={(e) => onChange(service.service_key, "sms_template", e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder={getSuggestionField(service.config_suggestions, "sms_template")?.value || `Enter the ${service.display_name} SMS template...`}
          />
        </LabeledField>
      )}
    </div>
  );
}