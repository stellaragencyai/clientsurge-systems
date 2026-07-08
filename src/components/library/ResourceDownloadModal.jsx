import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Download, CheckCircle2, Loader2, BookOpen } from "lucide-react";
import { isValidEmail, normalizeEmail, hiddenHoneypotFilled, buildSourceAttribution } from "@/lib/formSanitizers";

export default function ResourceDownloadModal({ resource, onClose }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    if (hiddenHoneypotFilled(websiteUrl)) {
      setSubmitted(true);
      return;
    }
    if (!normalizedEmail) { setError("Email is required."); return; }
    if (!isValidEmail(normalizedEmail)) { setError("Enter a valid email address."); return; }

    setLoading(true);
    setError("");
    try {
      const result = await base44.functions.invoke("submitLeadCapture", {
        full_name: name.trim() || "Resource Download",
        business_name: "Resource Download",
        email: normalizedEmail,
        phone: "",
        business_type: "Resource Download",
        problem: `Requested resource: ${resource.title}`,
        service_interest: `Resource: ${resource.title}`,
        source: "resource_download",
        requested_channels: ["email"],
        consent_given: true,
        consent_source: "resource_download_modal",
        consent_text_version: "resource_download_email_consent_v1",
        ...buildSourceAttribution("/library"),
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || "Resource request failed.");
      }

      if (resource.download_count !== undefined) {
        await base44.entities.Resource.update(resource.id, {
          download_count: (resource.download_count || 0) + 1,
        }).catch(() => {});
      }

      setSubmitted(true);

      if (resource.file_url) {
        setTimeout(() => {
          window.open(resource.file_url, "_blank", "noopener,noreferrer");
        }, 1200);
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again or contact support@clientsurgesystems.com.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative p-6 border-b border-border bg-gradient-to-br from-primary/8 to-primary/3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close resource download form"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary/70">{resource.category}</span>
          </div>
          <h2 className="text-lg font-bold text-foreground leading-snug">{resource.title}</h2>
          {resource.description && <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>}
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">You're all set!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {resource.file_url ? "Your download is opening now. Check your browser for the file." : "We'll email you the resource shortly."}
                </p>
              </div>
              <button type="button" onClick={onClose} className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <p className="text-sm text-muted-foreground">Enter your details below to get free access to this resource.</p>

              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Name (optional)</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address *</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com" required aria-invalid={Boolean(error)} autoComplete="email" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>

              {error && <p className="text-xs text-destructive font-medium" role="alert">{error}</p>}

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0088CC 0%, #003B8F 100%)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {loading ? "Processing…" : "Get Free Access"}
              </button>

              <p className="text-center text-[11px] text-muted-foreground">No spam. Unsubscribe anytime.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
