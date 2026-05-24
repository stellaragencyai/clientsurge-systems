import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Link2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TONE_OPTIONS = ["Professional", "Friendly", "Luxury", "Casual"];

export default function AddClientModal({ onClose, onSaved }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [form, setForm] = useState({
    order_id: "",
    website: "", instagram: "", industry: "", services: "",
    tone_of_voice: "Professional", booking_platform: "", booking_link: "",
    lead_sources: "",
    start_date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await base44.functions.invoke("listInstallQueue", {
        include_live: true,
      });
      const nextOrders = response.data?.orders || [];
      setOrders(nextOrders);
      setForm((current) => ({
        ...current,
        order_id:
          current.order_id && nextOrders.some((order) => order.id === current.order_id)
            ? current.order_id
            : nextOrders.find((order) => needsManualAttach(order))?.id || "",
      }));
    } catch (err) {
      setError(err?.message || "Unable to load paid orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const attachableOrders = useMemo(
    () => orders.filter((order) => needsManualAttach(order)),
    [orders]
  );
  const selectedOrder = attachableOrders.find((order) => order.id === form.order_id) || null;

  const US_PHONE_REGEX = /^\+?1?\s*[\(\-\.]?\d{3}[\)\-\.\s]?\s*\d{3}[\-\.\s]?\d{4}$/;

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (selectedOrder?.customer_phone && !US_PHONE_REGEX.test(selectedOrder.customer_phone.replace(/\s/g, ""))) {
      setError("Customer phone number appears to be invalid. Please verify it before continuing.");
      return;
    }

    setSaving(true);
    try {
      await base44.functions.invoke("attachAdminOnboardingOrder", form);
      setSuccess(true);
      onSaved();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Unable to attach paid order.");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, k, type = "text", placeholder = "" }) => (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
      <input
        type={type}
        value={form[k]}
        onChange={e => set(k, e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white px-8 pt-7 pb-5 border-b border-border rounded-t-3xl z-10">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Attach Paid Order</span>
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground">Attach Paid Order To Canonical Onboarding</h2>
        </div>

        <form onSubmit={handleSave} className="px-8 py-6 space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            This flow no longer creates standalone onboarding records. Admin onboarding must attach to an existing paid order so ownership stays canonical.
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Paid order attached to canonical onboarding.</span>
            </div>
          )}

          <p className="text-xs font-bold text-primary uppercase tracking-widest">Select Paid Order</p>
          {loadingOrders ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : attachableOrders.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
              No paid orders currently need manual onboarding attachment. Use the paid install queue for linked accounts, or wait for checkout to complete first.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Paid Order *</label>
                <select
                  value={form.order_id}
                  onChange={(e) => set("order_id", e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select a paid order...</option>
                  {attachableOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.business_name} - {order.customer_email}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder && (
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Link2 className="w-4 h-4 text-primary" />
                    {selectedOrder.business_name}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedOrder.customer_name} - {selectedOrder.customer_email} - {selectedOrder.customer_phone || "No phone"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pipeline: {selectedOrder.pipeline_status}
                    {selectedOrder.pipeline_error ? ` - ${selectedOrder.pipeline_error}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Existing links: client {selectedOrder.client_id || "pending"} - project {selectedOrder.client_project_id || "pending"} - onboarding {selectedOrder.onboarding_client_id || "pending"}
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs font-bold text-primary uppercase tracking-widest pt-1">Supplemental Profile Details</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Website" k="website" placeholder="https://" />
            <Field label="Instagram" k="instagram" placeholder="@handle" />
            <Field label="Industry" k="industry" placeholder="e.g. Med Spa" />
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Tone of Voice</label>
              <select
                value={form.tone_of_voice}
                onChange={e => set("tone_of_voice", e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TONE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Services Offered</label>
            <textarea
              value={form.services}
              onChange={e => set("services", e.target.value)}
              rows={2}
              placeholder="e.g. Botox, fillers, hydrafacials..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Booking */}
          <p className="text-xs font-bold text-primary uppercase tracking-widest pt-1">Booking & Leads</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Booking Platform" k="booking_platform" placeholder="e.g. scheduler, Acuity" />
            <Field label="Booking Link" k="booking_link" placeholder="https://" />
            <Field label="Lead Sources" k="lead_sources" placeholder="Google, Facebook, Instagram" />
            <Field label="Start Date" k="start_date" type="date" />
          </div>

          <button
            type="submit"
            disabled={saving || loadingOrders || !form.order_id || attachableOrders.length === 0}
            style={{ background: "linear-gradient(135deg,#005B99 0%,#0077B6 40%,#005B99 100%)", borderRadius: "9999px" }}
            className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold text-blue-100 transition hover:opacity-90 disabled:opacity-50 mt-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Attaching...</> : "Attach Paid Order"}
          </button>
        </form>
      </div>
    </div>
  );
}

function needsManualAttach(order) {
  return (
    !order.onboarding_client_id ||
    !order.client_id ||
    !order.client_project_id ||
    Boolean(order.pipeline_error) ||
    order.pipeline_status === "Paid"
  );
}