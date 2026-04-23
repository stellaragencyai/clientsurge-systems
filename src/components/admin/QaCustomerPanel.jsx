import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Loader2, ShieldCheck, UserRoundPlus } from "lucide-react";
import { PACKAGE_OFFERS } from "@/lib/aiProducts";
import { createQaCustomerFixture, getAdminQaError } from "@/lib/adminQaApi";

function copyText(value) {
  if (!value || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return;
  }

  navigator.clipboard.writeText(value).catch(() => {});
}

export default function QaCustomerPanel() {
  const packageOptions = useMemo(
    () =>
      PACKAGE_OFFERS.map((offer) => ({
        key: offer.package_key,
        label: offer.name,
        helper: `${offer.included_service_keys.length} services · $${offer.monthly_total}/mo`,
      })),
    []
  );

  const [form, setForm] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    website: "",
    package_key: packageOptions[1]?.key || packageOptions[0]?.key || "growth_system",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copyNotice, setCopyNotice] = useState("");

  const selectedPackage = packageOptions.find((offer) => offer.key === form.package_key) || packageOptions[0];

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCopy = (value, label) => {
    copyText(value);
    setCopyNotice(`${label} copied.`);
    window.setTimeout(() => setCopyNotice(""), 1500);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    setResult(null);
    setCopyNotice("");

    try {
      const nextResult = await createQaCustomerFixture(form);
      setResult(nextResult);
    } catch (requestError) {
      setError(getAdminQaError(requestError, "Unable to create a canonical QA customer fixture."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <UserRoundPlus className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Create QA Customer</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              Admin-only
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Creates a canonical paid test customer, active subscription state, portal links, and audit trail so you can log in yourself and experience the client flow firsthand.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        This does not auto-go-live anything. It creates a paid QA client state only. You still activate your own password from the Base44 invite and then sign in through the normal client portal.
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {copyNotice ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {copyNotice}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Full Name"
            value={form.full_name}
            onChange={(value) => setField("full_name", value)}
            placeholder="Jane Doe"
            required
          />
          <Field
            label="Business Name"
            value={form.business_name}
            onChange={(value) => setField("business_name", value)}
            placeholder="Signal Med Spa"
            required
          />
          <Field
            label="QA Email"
            value={form.email}
            onChange={(value) => setField("email", value)}
            placeholder="qa+medspa@example.com"
            required
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(value) => setField("phone", value)}
            placeholder="+1 602 555 0123"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr,1fr]">
          <Field
            label="Website"
            value={form.website}
            onChange={(value) => setField("website", value)}
            placeholder="https://example.com"
          />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Package</label>
            <select
              value={form.package_key}
              onChange={(event) => setField("package_key", event.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {packageOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label} · {option.helper}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedPackage ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
            <p className="font-semibold text-foreground">Fixture Package</p>
            <p className="mt-1 text-muted-foreground">
              {selectedPackage.label} will create the paid order and portal context for this QA customer.
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={creating}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Create QA Customer
        </button>
      </form>

      {result ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Canonical QA customer ready</p>
                <p className="mt-1 text-sm text-emerald-800">
                  Order <span className="font-semibold">{result.order_id}</span> was created with plan <span className="font-semibold">{result.plan_type}</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ResultRow
                  label="Portal URL"
                  value={result.portal_url}
                  onCopy={() => handleCopy(result.portal_url, "Portal URL")}
                />
                <ResultRow
                  label="Login Email"
                  value={form.email}
                  onCopy={() => handleCopy(form.email, "Login email")}
                />
              </div>

              <div className="rounded-lg border border-emerald-200 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Next Steps</p>
                <ol className="mt-2 space-y-2 text-sm text-emerald-900">
                  {(result.login_steps || []).map((step, index) => (
                    <li key={`${result.order_id}-step-${index}`} className="flex gap-2">
                      <span className="font-semibold">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="text-xs text-emerald-900/80">
                Invite status: <span className="font-semibold">{result.invite_status}</span>
                {result.invite_sent ? " · Activation email sent." : " · If you do not receive an activation invite, use manual auth setup or forgot-password after account creation."}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-foreground">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function ResultRow({ label, value, onCopy }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
    </div>
  );
}
