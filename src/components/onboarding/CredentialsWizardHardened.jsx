import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Rocket, Shield, Building2, Globe, Plug, Palette } from "lucide-react";
import SetupAuthorizationStep from "@/components/onboarding/SetupAuthorizationStep";
import IntegrationStatusStep from "@/components/onboarding/IntegrationStatusStep";

const STORAGE_KEY_PREFIX = "clientsurge:credentials-wizard:";

const STEPS = [
  { id: "authorization", icon: Shield, title: "Setup Authorization", desc: "Accept the authorization agreement" },
  { id: "business", icon: Building2, title: "Business Info", desc: "Basic details about your business" },
  { id: "brand", icon: Palette, title: "Brand & Design", desc: "Colors and logo for your system" },
  { id: "messaging", icon: Globe, title: "Messaging Setup", desc: "Phone number, booking link & hours" },
  { id: "integrations", icon: Plug, title: "Integrations", desc: "Connect your lead sources" },
  { id: "connection", icon: Plug, title: "Connection Check", desc: "Verify your integrations are live" },
  { id: "review", icon: Rocket, title: "Review & Submit", desc: "Confirm everything looks good" },
];

function trim(value) { return String(value || "").trim(); }
function normalizePhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return trim(value);
}
function isValidUSPhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}
function isValidEmail(value = "") { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(value)); }
function normalizeUrl(value = "") {
  const raw = trim(value);
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}
function isValidUrl(value = "") {
  const raw = trim(value);
  if (!raw) return true;
  try { const url = new URL(normalizeUrl(raw)); return ["http:", "https:"].includes(url.protocol) && url.hostname.includes("."); } catch { return false; }
}
function readPayload(result) { return result?.data || result || {}; }
function parseSaveError(err) {
  const data = err?.data || err?.response?.data || err || {};
  const validationErrors = Array.isArray(data.validation_errors) ? data.validation_errors : [];
  const fieldErrors = validationErrors.reduce((acc, item) => {
    if (item?.field) acc[item.field] = item.message || `${item.field} is required`;
    return acc;
  }, {});
  return {
    message: validationErrors.length ? validationErrors.map((item) => item.message || item.field).filter(Boolean).join(" ") : data.error || data.message || err?.message || "Failed to save. Please try again.",
    fieldErrors,
    requestId: data.request_id || err?.request_id || "",
  };
}

function Field({ label, required, hint, error, children }) {
  return <div className="space-y-1.5"><label className="block text-sm font-semibold text-foreground">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}{children}{error && <p className="text-xs font-semibold text-red-600">{error}</p>}</div>;
}
function TextInput({ value, onChange, onBlur, placeholder, type = "text", autoComplete }) {
  return <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} autoComplete={autoComplete} className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />;
}
function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />;
}
function ChipSelect({ options, value, onChange }) {
  return <div className="flex flex-wrap gap-2">{options.map((opt) => <button key={opt} type="button" onClick={() => onChange(opt)} className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${value === opt ? "border-primary bg-primary/8 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{opt}</button>)}</div>;
}
function ColorPicker({ label, value, onChange }) {
  return <div className="flex items-center gap-3"><input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-white" /><div className="flex-1"><p className="text-sm font-medium text-foreground">{label}</p><input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="mt-1 w-full px-3 py-1.5 rounded-lg border border-border bg-white text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono" /></div></div>;
}

function BusinessStep({ data, onChange, errors }) {
  return <div className="space-y-5"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label="Business Name" required error={errors.business_name}><TextInput value={data.business_name} onChange={(v) => onChange("business_name", v)} placeholder="Acme Med Spa" autoComplete="organization" /></Field><Field label="Industry / Niche" required error={errors.industry}><TextInput value={data.industry} onChange={(v) => onChange("industry", v)} placeholder="Med Spa, HVAC, Dental…" /></Field><Field label="Owner / Contact Name"><TextInput value={data.contact_name} onChange={(v) => onChange("contact_name", v)} placeholder="Jane Smith" autoComplete="name" /></Field><Field label="Business Phone" required error={errors.business_phone}><TextInput value={data.business_phone} onChange={(v) => onChange("business_phone", v)} onBlur={() => onChange("business_phone", normalizePhone(data.business_phone))} placeholder="+1 (602) 555-0100" type="tel" autoComplete="tel" /></Field><Field label="Business Email" error={errors.business_email}><TextInput value={data.business_email} onChange={(v) => onChange("business_email", v)} placeholder="hello@yourbusiness.com" type="email" autoComplete="email" /></Field><Field label="Website URL" error={errors.website}><TextInput value={data.website} onChange={(v) => onChange("website", v)} onBlur={() => onChange("website", normalizeUrl(data.website))} placeholder="https://yourbusiness.com" type="url" autoComplete="url" /></Field></div><Field label="Business Address" hint="Used for local SEO and lead routing"><TextInput value={data.address} onChange={(v) => onChange("address", v)} placeholder="123 Main St, Phoenix, AZ 85001" autoComplete="street-address" /></Field><Field label="Brand Voice / Tone"><ChipSelect options={["Professional", "Friendly", "Luxury", "Casual", "Energetic"]} value={data.brand_voice} onChange={(v) => onChange("brand_voice", v)} /></Field><Field label="Business Hours" hint="When are you open?"><TextInput value={data.business_hours} onChange={(v) => onChange("business_hours", v)} placeholder="Mon–Fri 9am–6pm, Sat 10am–3pm" /></Field></div>;
}
function BrandStep({ data, onChange, onLogoUpload, logoUploading }) {
  return <div className="space-y-6"><Field label="Logo Upload"><label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">{logoUploading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : data.logo_url ? <img src={data.logo_url} alt="Logo" width="128" height="128" className="w-full h-full object-contain rounded-xl p-2" /> : <><div className="text-2xl">🖼️</div><span className="text-xs text-muted-foreground mt-1 text-center">Click to upload</span></>}<input type="file" accept="image/*" onChange={onLogoUpload} className="hidden" /></label></Field><div className="space-y-4"><h3 className="text-sm font-semibold text-foreground">Brand Colors</h3><ColorPicker label="Primary Brand Color" value={data.primary_color} onChange={(v) => onChange("primary_color", v)} /><ColorPicker label="Secondary / Accent Color" value={data.secondary_color} onChange={(v) => onChange("secondary_color", v)} /></div><Field label="Tagline / Slogan"><TextInput value={data.tagline} onChange={(v) => onChange("tagline", v)} placeholder="e.g. Your Beauty, Our Priority" /></Field></div>;
}
function MessagingStep({ data, onChange, errors }) {
  return <div className="space-y-5"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label="Twilio Business Phone" hint="Leave blank if you don't have one yet; we will use the business phone for setup checks." error={errors.twilio_business_phone}><TextInput value={data.twilio_business_phone} onChange={(v) => onChange("twilio_business_phone", v)} onBlur={() => onChange("twilio_business_phone", normalizePhone(data.twilio_business_phone))} placeholder="+1 (602) 555-0200" type="tel" autoComplete="tel" /></Field><Field label="Booking / Scheduling Link" required error={errors.booking_link}><TextInput value={data.booking_link} onChange={(v) => onChange("booking_link", v)} onBlur={() => onChange("booking_link", normalizeUrl(data.booking_link))} placeholder="https://calendly.com/yourbusiness" type="url" /></Field></div><Field label="Lead Notification Email" required error={errors.lead_notification_email}><TextInput value={data.lead_notification_email} onChange={(v) => onChange("lead_notification_email", v)} placeholder="you@yourbusiness.com" type="email" autoComplete="email" /></Field><Field label="After-Hours Behavior"><ChipSelect options={["Send after-hours SMS", "Hold until we open"]} value={data.after_hours_behavior} onChange={(v) => onChange("after_hours_behavior", v)} /></Field><Field label="Most Common Customer Questions"><TextArea value={data.customer_questions} onChange={(v) => onChange("customer_questions", v)} placeholder="e.g. What are your prices? Do you offer free consultations?" rows={3} /></Field></div>;
}
function IntegrationsStep({ data, onChange, errors }) {
  return <div className="space-y-5"><Field label="CRM or Scheduling Software"><ChipSelect options={["Calendly", "Acuity", "Jane App", "MindBody", "GoHighLevel", "HubSpot", "None / Other"]} value={data.crm_system} onChange={(v) => onChange("crm_system", v)} /></Field><Field label="Google Review Link" error={errors.google_review_link}><TextInput value={data.google_review_link} onChange={(v) => onChange("google_review_link", v)} onBlur={() => onChange("google_review_link", normalizeUrl(data.google_review_link))} placeholder="https://g.page/r/yourbusiness/review" type="url" /></Field><Field label="Other Lead Sources" hint="Angi, Thumbtack, Yelp, etc."><TextInput value={data.other_lead_sources} onChange={(v) => onChange("other_lead_sources", v)} placeholder="e.g. Angi, Thumbtack, HomeAdvisor" /></Field><Field label="Anything Else We Should Know"><TextArea value={data.special_notes} onChange={(v) => onChange("special_notes", v)} placeholder="Special instructions, existing automations, custom needs…" rows={4} /></Field></div>;
}
function ReviewStep({ data }) {
  const sections = [{ title: "Business Info", fields: [{ label: "Business Name", value: data.business_name }, { label: "Industry", value: data.industry }, { label: "Phone", value: normalizePhone(data.business_phone) }, { label: "Email", value: data.business_email }, { label: "Website", value: data.website }] }, { title: "Brand & Design", fields: [{ label: "Logo", value: data.logo_url ? "✓ Uploaded" : "Not uploaded" }, { label: "Primary Color", value: data.primary_color }, { label: "Tagline", value: data.tagline }, { label: "Brand Voice", value: data.brand_voice }] }, { title: "Messaging", fields: [{ label: "Twilio Phone", value: normalizePhone(data.twilio_business_phone || data.business_phone) || "To be provisioned" }, { label: "Booking Link", value: data.booking_link }, { label: "Notification Email", value: data.lead_notification_email }] }, { title: "Integrations", fields: [{ label: "CRM System", value: data.crm_system || "None / Other" }, { label: "Review Link", value: data.google_review_link }, { label: "Lead Sources", value: data.other_lead_sources }] }];
  return <div className="space-y-6"><div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><strong>Almost done.</strong> Review your information, then click Submit to send it to our team.</div>{sections.map((section) => <div key={section.title} className="rounded-xl border border-border bg-white overflow-hidden"><div className="bg-muted/40 px-4 py-2.5 border-b border-border"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{section.title}</p></div><div className="divide-y divide-border">{section.fields.filter((f) => f.value).map((f) => <div key={f.label} className="flex items-start justify-between px-4 py-2.5 gap-4"><p className="text-xs font-semibold text-muted-foreground w-32 flex-shrink-0">{f.label}</p><p className="text-sm text-foreground text-right break-all">{f.value}</p></div>)}</div></div>)}</div>;
}
function ErrorPanel({ error, fieldErrors, requestId }) {
  const items = Object.values(fieldErrors || {}).filter(Boolean);
  if (!error && items.length === 0) return null;
  return <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error && <p className="font-semibold">{error}</p>}{items.length > 0 && <ul className="mt-2 list-disc pl-5 space-y-1">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>}{requestId && <p className="mt-2 text-xs text-red-600/80">Reference: {requestId}</p>}</div>;
}
function defaultsForOrder(order) {
  return { business_name: order?.business_name || "", industry: "", contact_name: order?.customer_name || "", business_phone: normalizePhone(order?.customer_phone || ""), business_email: order?.customer_email || "", website: "", address: "", brand_voice: "", business_hours: "", logo_url: "", primary_color: "#00AEEF", secondary_color: "#003B8F", tagline: "", twilio_business_phone: "", booking_link: "", lead_notification_email: order?.customer_email || "", after_hours_behavior: "", customer_questions: "", crm_system: "None / Other", google_review_link: "", other_lead_sources: "", special_notes: "" };
}
function buildInstallConfig(data) {
  const businessPhone = normalizePhone(data.business_phone);
  const twilioPhone = normalizePhone(data.twilio_business_phone || data.business_phone);
  const websiteUrl = normalizeUrl(data.website);
  const bookingLink = normalizeUrl(data.booking_link);
  const googleReviewLink = normalizeUrl(data.google_review_link);
  return { shared: { business_phone: businessPhone, twilio_business_phone: twilioPhone, business_hours: trim(data.business_hours), after_hours_behavior: data.after_hours_behavior === "Hold until we open" ? "hold_until_open" : "send_after_hours_sms", consent_behavior: "include_opt_out_language" }, brand: { business_name: trim(data.business_name), industry: trim(data.industry), contact_name: trim(data.contact_name), business_phone: businessPhone, business_email: trim(data.business_email).toLowerCase(), website: websiteUrl, website_url: websiteUrl, address: trim(data.address), logo_url: trim(data.logo_url), primary_color: trim(data.primary_color) || "#00AEEF", secondary_color: trim(data.secondary_color) || "#003B8F", tagline: trim(data.tagline), brand_voice: trim(data.brand_voice), tone_of_voice: trim(data.brand_voice), google_business_url: googleReviewLink }, messaging: { booking_link: bookingLink, lead_notification_email: trim(data.lead_notification_email).toLowerCase(), customer_questions: trim(data.customer_questions) }, services: { ai_booking_agent: { booking_link: bookingLink, booking_mode: "external_link" }, review_request: { review_link: googleReviewLink } }, integrations: { crm_system: data.crm_system || "None / Other", google_review_link: googleReviewLink, google_business_url: googleReviewLink, other_lead_sources: trim(data.other_lead_sources), special_notes: trim(data.special_notes) } };
}

export default function CredentialsWizardHardened({ order, setupToken = "", onComplete }) {
  const effectiveSetupToken = setupToken || order?.setup_token || "";
  const storageKey = STORAGE_KEY_PREFIX + (order?.id || "anon");
  const serverDraft = order?.credentials_draft?.data || null;
  const serverDraftStep = order?.credentials_draft?.current_step;
  const initialData = useMemo(() => { const defaults = defaultsForOrder(order); try { const saved = sessionStorage.getItem(storageKey); if (saved) return { ...defaults, ...(serverDraft || {}), ...JSON.parse(saved) }; } catch {} return { ...defaults, ...(serverDraft || {}) }; }, [order, serverDraft, storageKey]);
  const [authorized, setAuthorized] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => Math.max(0, Number(serverDraftStep) || 0));
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [requestId, setRequestId] = useState("");
  const [draftStatus, setDraftStatus] = useState(serverDraft?.updated_at ? `Draft restored from ${new Date(serverDraft.updated_at).toLocaleString()}` : "");
  const onChange = (field, value) => { setFieldErrors((prev) => ({ ...prev, [field]: "" })); setData((prev) => ({ ...prev, [field]: value })); };

  useEffect(() => { const checkAuth = async () => { try { const result = await base44.functions.invoke("checkSetupAuthorization", { order_id: order?.id, token: effectiveSetupToken }); const payload = readPayload(result); if (payload?.authorized) { setAuthorized(true); setCurrentStep((step) => Math.max(1, Number(serverDraftStep) || step || 1)); } } catch {} }; if (order?.id) checkAuth(); }, [order?.id, serverDraftStep, effectiveSetupToken]);
  useEffect(() => { try { sessionStorage.setItem(storageKey, JSON.stringify(data)); } catch {} }, [data, storageKey]);
  useEffect(() => { if (!authorized || !order?.id || currentStep === 0 || saving) return; const timer = setTimeout(async () => { try { const result = await base44.functions.invoke("saveClientCredentialsDraft", { order_id: order.id, token: effectiveSetupToken, draft: data, current_step: currentStep }); const payload = readPayload(result); setDraftStatus(`Draft saved ${new Date(payload.saved_at || Date.now()).toLocaleTimeString()}`); } catch (err) { const parsed = parseSaveError(err); setDraftStatus(`Draft not saved${parsed.requestId ? ` · ${parsed.requestId}` : ""}`); } }, 900); return () => clearTimeout(timer); }, [authorized, currentStep, data, order?.id, saving, effectiveSetupToken]);

  const handleLogoUpload = async (e) => { const file = e.target.files?.[0]; if (!file) return; if (!file.type?.startsWith("image/")) { setError("Please upload an image file for the logo."); return; } if (file.size > 5 * 1024 * 1024) { setError("Logo file is too large. Please upload an image under 5MB."); return; } setLogoUploading(true); try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); onChange("logo_url", file_url); } catch { setError("Logo upload failed. Please try a smaller PNG or JPG."); } finally { setLogoUploading(false); } };
  const validateStep = () => { if (STEPS[currentStep].id === "business") { if (!trim(data.business_name)) return { field: "business_name", message: "Business name is required." }; if (!trim(data.industry)) return { field: "industry", message: "Industry / niche is required." }; if (!trim(data.business_phone)) return { field: "business_phone", message: "Business phone is required." }; if (!isValidUSPhone(data.business_phone)) return { field: "business_phone", message: "Enter a valid US business phone number." }; if (trim(data.business_email) && !isValidEmail(data.business_email)) return { field: "business_email", message: "Enter a valid business email address." }; if (!isValidUrl(data.website)) return { field: "website", message: "Enter a valid website URL or leave it blank." }; } if (STEPS[currentStep].id === "messaging") { if (trim(data.twilio_business_phone) && !isValidUSPhone(data.twilio_business_phone)) return { field: "twilio_business_phone", message: "Enter a valid Twilio/business SMS phone number or leave it blank." }; if (!trim(data.booking_link)) return { field: "booking_link", message: "Booking link is required." }; if (!isValidUrl(data.booking_link)) return { field: "booking_link", message: "Enter a valid booking link." }; if (!trim(data.lead_notification_email)) return { field: "lead_notification_email", message: "Lead notification email is required." }; if (!isValidEmail(data.lead_notification_email)) return { field: "lead_notification_email", message: "Enter a valid lead notification email." }; } if (STEPS[currentStep].id === "integrations" && !isValidUrl(data.google_review_link)) return { field: "google_review_link", message: "Enter a valid Google review link or leave it blank." }; return null; };
  const submit = async () => { setSaving(true); setError(""); setFieldErrors({}); setRequestId(""); try { const result = await base44.functions.invoke("saveClientCredentials", { order_id: order.id, token: effectiveSetupToken, install_configuration: buildInstallConfig(data) }); const payload = readPayload(result); if (payload?.success === false || payload?.error) throw payload; try { sessionStorage.removeItem(storageKey); } catch {} onComplete?.(payload); } catch (err) { const parsed = parseSaveError(err); setFieldErrors(parsed.fieldErrors); setError(parsed.message); setRequestId(parsed.requestId); } finally { setSaving(false); } };
  const handleNext = async () => { setError(""); setFieldErrors({}); const validationError = validateStep(); if (validationError) { setFieldErrors({ [validationError.field]: validationError.message }); setError(validationError.message); return; } if (currentStep === STEPS.length - 1) await submit(); else setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1)); };

  if (!authorized) return <div className="min-h-screen flex flex-col"><div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)" }}><div><p className="text-xs font-bold text-blue-300/70 uppercase tracking-widest">Activation Wizard — Step 1 of {STEPS.length}</p><p className="text-white font-semibold mt-0.5 text-lg">{order?.business_name || "Your Business"}</p></div><img src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png" alt="ClientSurge" width="200" height="50" style={{ height: 50, objectFit: "contain", mixBlendMode: "luminosity", opacity: 0.85 }} /></div><div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8"><div className="bg-white rounded-2xl border border-border p-6 shadow-sm"><SetupAuthorizationStep order={order} setupToken={effectiveSetupToken} onAuthorized={() => { setAuthorized(true); setCurrentStep((step) => Math.max(1, step)); }} /></div></div></div>;

  const step = STEPS[currentStep]; const Icon = step.icon; const isLast = currentStep === STEPS.length - 1;
  return <div className="min-h-screen flex flex-col"><div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)" }}><div><p className="text-xs font-bold text-blue-300/70 uppercase tracking-widest">Activation Wizard — Step {currentStep + 1} of {STEPS.length}</p><p className="text-white font-semibold mt-0.5 text-lg">{order?.business_name || "Your Business"}</p></div><img src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png" alt="ClientSurge" width="200" height="50" style={{ height: 50, objectFit: "contain", mixBlendMode: "luminosity", opacity: 0.85 }} /></div><div className="h-1 bg-gray-100 flex-shrink-0"><div className="h-full transition-all duration-500" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%`, background: "linear-gradient(90deg,#00AEEF,#003B8F)" }} /></div><div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-primary" /></div><div><h2 className="text-xl font-semibold text-foreground">{step.title}</h2><p className="text-sm text-muted-foreground">{step.desc}</p></div></div><div className="bg-white rounded-2xl border border-border p-6 shadow-sm">{step.id === "business" && <BusinessStep data={data} onChange={onChange} errors={fieldErrors} />}{step.id === "brand" && <BrandStep data={data} onChange={onChange} onLogoUpload={handleLogoUpload} logoUploading={logoUploading} />}{step.id === "messaging" && <MessagingStep data={data} onChange={onChange} errors={fieldErrors} />}{step.id === "integrations" && <IntegrationsStep data={data} onChange={onChange} errors={fieldErrors} />}{step.id === "connection" && <IntegrationStatusStep data={data} />}{step.id === "review" && <ReviewStep data={data} />}<ErrorPanel error={error} fieldErrors={fieldErrors} requestId={requestId} /></div><div className="flex items-center justify-between gap-4 mt-6"><button onClick={() => { setError(""); setFieldErrors({}); setCurrentStep((s) => Math.max(1, s - 1)); }} disabled={currentStep === 1 || saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-30"><ArrowLeft className="w-4 h-4" /> Back</button><div className="flex flex-col items-end gap-2">{draftStatus && <p className="flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="w-3.5 h-3.5" /> {draftStatus}</p>}<button onClick={handleNext} disabled={saving || logoUploading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ background: isLast ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#00AEEF,#003B8F)" }}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isLast ? <><Rocket className="w-4 h-4" /> Submit Setup Info</> : <>Next <ArrowRight className="w-4 h-4" /></>}</button></div></div></div></div>;
}
