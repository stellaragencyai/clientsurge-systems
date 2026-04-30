import { useState, useEffect } from "react";
import {
  MessageSquare, Mail, Phone, Send, Bell, Zap, BookOpen,
  Eye, Save, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  Lightbulb, Copy, Check
} from "lucide-react";
import { fetchAdminSettings, getAdminSettingsError, saveAdminSettings } from "@/lib/adminSettingsApi";

// ── Template definitions ──────────────────────────────────────────────────────

const TEMPLATE_GROUPS = [
  {
    id: "lead_response",
    label: "Instant Lead Response",
    icon: Zap,
    description: "Sent within seconds of a new lead arriving — the first touchpoint.",
    templates: [
      {
        key: "sms_template",
        label: "Lead Response SMS",
        type: "sms",
        rows: 4,
        placeholder: "Hi {name}! Thanks for reaching out to {business_name}. We'd love to help — here's your booking link: {booking_link}",
        variables: ["{name}", "{business_name}", "{booking_link}", "{date}"],
        tip: "Keep under 160 chars for a single SMS segment. Use {name} to personalise.",
      },
      {
        key: "email_confirmation_template",
        label: "Lead Response Email",
        type: "email",
        rows: 7,
        placeholder: "Hi {name},\n\nThanks for reaching out! We're excited to help you.\n\nClick here to book: {booking_link}\n\nQuestions? Reply to this email.\n\nBest,\n{business_name}",
        variables: ["{name}", "{business_name}", "{booking_link}", "{date}"],
        tip: "This goes out alongside the SMS. Personalise the sign-off with your business name.",
      },
    ],
  },
  {
    id: "missed_call",
    label: "Missed Call Recovery",
    icon: Phone,
    description: "Fires automatically when a call goes unanswered — recovers the lead instantly.",
    templates: [
      {
        key: "missed_call_sms_template",
        label: "Missed Call SMS",
        type: "sms",
        rows: 4,
        placeholder: "Hey {name}, sorry we missed your call! We'd love to connect — you can book a time here: {booking_link}",
        variables: ["{name}", "{business_name}", "{booking_link}"],
        tip: "Friendly and immediate. Avoid formal language — this replaces a return call.",
      },
    ],
  },
  {
    id: "follow_up",
    label: "Follow-Up Sequence",
    icon: Send,
    description: "Nurtures leads that haven't booked yet over a 14-day window.",
    templates: [
      {
        key: "follow_up_day1_sms",
        label: "Day 1 Follow-Up SMS",
        type: "sms",
        rows: 4,
        placeholder: "Hi {name}, just following up on your inquiry. Still interested? Book here: {booking_link}",
        variables: ["{name}", "{booking_link}"],
        tip: "Sent ~24 hours after the first touch. Keep it short and direct.",
      },
      {
        key: "follow_up_day3_sms",
        label: "Day 3 Follow-Up SMS",
        type: "sms",
        rows: 4,
        placeholder: "Hey {name} — we still have availability this week. Grab a slot before it's gone: {booking_link}",
        variables: ["{name}", "{booking_link}"],
        tip: "Create mild urgency without being pushy.",
      },
      {
        key: "follow_up_day7_sms",
        label: "Day 7 Follow-Up SMS",
        type: "sms",
        rows: 4,
        placeholder: "Hi {name}, we haven't heard back — no worries! Whenever you're ready, your link is here: {booking_link}",
        variables: ["{name}", "{booking_link}"],
        tip: "Softer tone — many leads convert on this message.",
      },
    ],
  },
  {
    id: "qualified_followup",
    label: "Qualified → Booking Prompt (24h)",
    icon: Zap,
    description: "Sent automatically 24h after a lead reaches Qualified status, if they haven't booked yet.",
    templates: [
      {
        key: "follow_up_booking_prompt_sms",
        label: "Qualified Booking Prompt SMS",
        type: "sms",
        rows: 4,
        placeholder: "Hi {name}! You're all set — here's your link to book your free consultation: {booking_link}. We'd love to connect!",
        variables: ["{name}", "{business_name}", "{booking_link}"],
        tip: "This fires 24h after a lead reaches Qualified with no booking. Keep it warm and action-oriented.",
      },
      {
        key: "follow_up_booking_prompt_email",
        label: "Qualified Booking Prompt Email",
        type: "email",
        rows: 6,
        placeholder: "Hi {name},\n\nGreat news — you're qualified and ready to take the next step!\n\nBook your free consultation here: {booking_link}\n\nLooking forward to speaking with you!\n\nBest,\n{business_name}",
        variables: ["{name}", "{business_name}", "{booking_link}"],
        tip: "Sent alongside the SMS. Reinforces the booking CTA with a more detailed message.",
      },
    ],
  },
  {
    id: "nurture",
    label: "30-Day Nurture Email Sequence",
    icon: Mail,
    description: "8-step email sequence sent automatically to leads over 30 days. Leave subject/body blank to use the built-in defaults.",
    templates: [
      { key: "nurture_step1_subject", label: "Step 1 Subject (Day 0 — Welcome)", type: "email", rows: 1, placeholder: "Welcome, {name} — here's what's coming your way", variables: ["{name}", "{business_name}"], tip: "Day 0: sent immediately on enrollment." },
      { key: "nurture_step1_body",    label: "Step 1 Body (Day 0 — Welcome)",   type: "email", rows: 8, placeholder: "Hi {name},\n\nWelcome! Over the next 30 days...", variables: ["{name}", "{business_name}", "{booking_link}"], tip: "Introduce your value prop and set expectations." },
      { key: "nurture_step2_subject", label: "Step 2 Subject (Day 3 — Case Study)", type: "email", rows: 1, placeholder: "{name}, how a med spa went from 14% to 61% lead conversion", variables: ["{name}", "{business_name}"], tip: "Day 3: lead a case study." },
      { key: "nurture_step2_body",    label: "Step 2 Body (Day 3 — Case Study)",   type: "email", rows: 8, placeholder: "Hi {name},\n\nA real result worth sharing...", variables: ["{name}", "{business_name}", "{booking_link}"], tip: "Share a concrete before/after story." },
      { key: "nurture_step3_subject", label: "Step 3 Subject (Day 7 — Testimonial)", type: "email", rows: 1, placeholder: '"I didn\'t realize how many leads I was losing" — {name}, read this', variables: ["{name}"], tip: "Day 7: social proof." },
      { key: "nurture_step3_body",    label: "Step 3 Body (Day 7 — Testimonial)",   type: "email", rows: 8, placeholder: "Hi {name},\n\nA client said it best...", variables: ["{name}", "{business_name}", "{booking_link}"], tip: "Use a direct quote from a real or representative client." },
      { key: "nurture_step4_subject", label: "Step 4 Subject (Day 10 — Tip)", type: "email", rows: 1, placeholder: "The 5-minute rule that recovers 30% more leads — for {name}", variables: ["{name}"], tip: "Day 10: actionable tip." },
      { key: "nurture_step4_body",    label: "Step 4 Body (Day 10 — Tip)",   type: "email", rows: 8, placeholder: "Hi {name},\n\nQuick tip for {business_name}...", variables: ["{name}", "{business_name}", "{booking_link}"], tip: "Give one concrete, easy-to-digest tip." },
      { key: "nurture_step5_subject", label: "Step 5 Subject (Day 14 — Case Study 2)", type: "email", rows: 1, placeholder: "{name} — how a home service company recovered $12k in lost leads", variables: ["{name}"], tip: "Day 14: second case study, different industry." },
      { key: "nurture_step5_body",    label: "Step 5 Body (Day 14 — Case Study 2)",   type: "email", rows: 8, placeholder: "Hi {name},\n\nAnother result worth sharing...", variables: ["{name}", "{business_name}", "{booking_link}"], tip: "Vary the industry to broaden relevance." },
      { key: "nurture_step6_subject", label: "Step 6 Subject (Day 18 — Testimonial 2)", type: "email", rows: 1, placeholder: '{name}, this is what "set it and forget it" actually looks like', variables: ["{name}"], tip: "Day 18: second testimonial." },
      { key: "nurture_step6_body",    label: "Step 6 Body (Day 18 — Testimonial 2)",   type: "email", rows: 8, placeholder: "Hi {name},\n\nAnother client story...", variables: ["{name}", "{business_name}", "{booking_link}"], tip: "Focus on ease-of-use and trust." },
      { key: "nurture_step7_subject", label: "Step 7 Subject (Day 23 — Tip + Offer)", type: "email", rows: 1, placeholder: "{name} — 3 follow-up mistakes that kill conversions (+ a free offer)", variables: ["{name}"], tip: "Day 23: tips + soft offer." },
      { key: "nurture_step7_body",    label: "Step 7 Body (Day 23 — Tip + Offer)",   type: "email", rows: 8, placeholder: "Hi {name},\n\n3 mistakes we see constantly...\n\nFree offer: {booking_link}", variables: ["{name}", "{business_name}", "{booking_link}"], tip: "Combine value with a clear CTA." },
      { key: "nurture_step8_subject", label: "Step 8 Subject (Day 30 — Final CTA)", type: "email", rows: 1, placeholder: "{name} — last message from us (your call)", variables: ["{name}"], tip: "Day 30: final, respectful send." },
      { key: "nurture_step8_body",    label: "Step 8 Body (Day 30 — Final CTA)",   type: "email", rows: 8, placeholder: "Hi {name},\n\nThis is our last scheduled email...\n\nBook here: {booking_link}", variables: ["{name}", "{business_name}", "{booking_link}"], tip: "Give a clear final CTA and an opt-out path." },
    ],
  },
  {
    id: "admin",
    label: "Admin Notifications",
    icon: Bell,
    description: "Internal alerts sent to your team when key lead events occur.",
    templates: [
      {
        key: "admin_notification_template",
        label: "New Lead Notification",
        type: "email",
        rows: 5,
        placeholder: "New lead received!\n\nName: {name}\nPhone: {phone}\nEmail: {email}\nSource: {source}\n\nLog in to review: {dashboard_link}",
        variables: ["{name}", "{phone}", "{email}", "{source}", "{dashboard_link}"],
        tip: "Goes to your admin notification email. Include all details you need to triage quickly.",
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const ICON_MAP = { Zap, Phone, Send, Bell };

function renderTemplate(template, data) {
  let result = template;
  Object.keys(data).forEach((key) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), data[key]);
  });
  return result;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VariablePill({ variable, onClick }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    onClick(variable);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      onClick={handle}
      title="Click to insert"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-primary/8 border border-primary/20 text-primary hover:bg-primary/15 transition-colors"
    >
      {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
      {variable}
    </button>
  );
}

function CharCount({ text, type }) {
  if (type !== "sms") return null;
  const len = text?.length || 0;
  const segments = Math.ceil(len / 160) || 1;
  const color = len > 320 ? "text-red-500" : len > 160 ? "text-amber-500" : "text-muted-foreground";
  return (
    <span className={`text-xs tabular-nums ${color}`}>
      {len} chars · {segments} segment{segments !== 1 ? "s" : ""}
    </span>
  );
}

function TemplateEditor({ template, value, onChange, onPreview }) {
  const [showTip, setShowTip] = useState(false);

  const insertVariable = (variable) => {
    onChange(value + variable);
  };

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          {template.type === "sms" ? (
            <MessageSquare className="w-4 h-4 text-primary" />
          ) : (
            <Mail className="w-4 h-4 text-primary" />
          )}
          <span className="text-sm font-semibold text-foreground">{template.label}</span>
          <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            {template.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTip((v) => !v)}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Show tip"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          </button>
          <button
            onClick={() => onPreview(template, value)}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-border text-xs font-medium hover:bg-muted transition-colors"
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>
      </div>

      {/* Tip */}
      {showTip && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
          <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
          {template.tip}
        </div>
      )}

      {/* Textarea */}
      <div className="p-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={template.rows}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono leading-relaxed resize-y"
          placeholder={template.placeholder}
        />

        {/* Footer row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {template.variables.map((v) => (
              <VariablePill key={v} variable={v} onClick={insertVariable} />
            ))}
          </div>
          <div className="ml-auto">
            <CharCount text={value} type={template.type} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ item, onClose }) {
  const [testData, setTestData] = useState({
    name: "Sarah",
    business_name: "Glow Med Spa",
    booking_link: "example.com/book",
    phone: "(602) 555-0148",
    email: "sarah@email.com",
    source: "Website form",
    dashboard_link: "app.clientsurge.com/admin",
    date: new Date().toLocaleDateString(),
  });

  const rendered = renderTemplate(item.value, testData);
  const isSms = item.template.type === "sms";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">{item.template.label} — Preview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Variables replaced with test values below</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rendered output */}
        <div className="px-6 py-4">
          {isSms ? (
            <div className="flex justify-end mb-4">
              <div className="max-w-[80%] bg-blue-500 text-white px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                {rendered || <span className="opacity-50 italic">Empty template</span>}
              </div>
            </div>
          ) : (
            <div className="bg-muted/40 rounded-xl border border-border px-5 py-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono max-h-48 overflow-y-auto">
              {rendered || <span className="opacity-50 italic">Empty template</span>}
            </div>
          )}
        </div>

        {/* Test variable inputs */}
        <div className="px-6 pb-5 border-t border-border pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Test Variables</p>
          <div className="grid grid-cols-2 gap-2">
            {item.template.variables.map((v) => {
              const key = v.replace(/[{}]/g, "");
              return (
                <div key={key}>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    {key}
                  </label>
                  <input
                    value={testData[key] ?? ""}
                    onChange={(e) => setTestData((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateGroup({ group, values, onChange, onPreview }) {
  const [open, setOpen] = useState(true);
  const Icon = group.icon;

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{group.label}</p>
          <p className="text-xs text-muted-foreground">{group.description}</p>
        </div>
        <span className="text-xs text-muted-foreground mr-1">{group.templates.length} template{group.templates.length !== 1 ? "s" : ""}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {/* Templates */}
      {open && (
        <div className="p-4 space-y-4 bg-white">
          {group.templates.map((template) => (
            <TemplateEditor
              key={template.key}
              template={template}
              value={values[template.key] ?? ""}
              onChange={(val) => onChange(template.key, val)}
              onPreview={(tmpl, val) => onPreview({ template: tmpl, value: val })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CommunicationTemplates() {
  const [values, setValues] = useState({});
  const [preview, setPreview] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const settings = await fetchAdminSettings();
      const loaded = {};
      TEMPLATE_GROUPS.forEach((group) => {
        group.templates.forEach((tmpl) => {
          loaded[tmpl.key] = settings[tmpl.key] ?? "";
        });
      });
      setValues(loaded);
      setError("");
    } catch (err) {
      setError(getAdminSettingsError(err, "Failed to load templates."));
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveAdminSettings(values);
      setError("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(getAdminSettingsError(err, "Failed to save templates."));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Response Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize every AI-powered message sent during lead follow-up and missed call recovery.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving…" : "Save All"}
        </button>
      </div>

      {/* Banners */}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          All templates saved successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-sm text-foreground/75">
        <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <span>
          Click any <span className="font-semibold text-primary font-mono text-xs">{"{variable}"}</span> pill to append it to the template, or type it manually. Use <strong>Preview</strong> to see the rendered output with test data.
        </span>
      </div>

      {/* Template groups */}
      {TEMPLATE_GROUPS.map((group) => (
        <TemplateGroup
          key={group.id}
          group={group}
          values={values}
          onChange={handleChange}
          onPreview={setPreview}
        />
      ))}

      {/* Sticky save footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Changes are saved globally and take effect on the next lead event.</p>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving…" : "Save All Templates"}
        </button>
      </div>

      {/* Preview modal */}
      {preview && <PreviewModal item={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}