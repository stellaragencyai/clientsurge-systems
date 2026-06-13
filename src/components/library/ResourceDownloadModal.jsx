import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Download, CheckCircle2, Loader2, BookOpen } from "lucide-react";

export default function ResourceDownloadModal({ resource, onClose }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    setLoading(true);
    setError("");
    try {
      // Capture as a website lead
      await base44.entities.WebsiteLead.create({
        email: email.trim(),
        full_name: name.trim() || undefined,
        source: "website_form",
        source_page: `/library`,
        service_interest: `Resource: ${resource.title}`,
        lead_status: "new",
      });

      // Increment download count best-effort
      if (resource.download_count !== undefined) {
        await base44.entities.Resource.update(resource.id, {
          download_count: (resource.download_count || 0) + 1,
        }).catch(() => {});
      }

      setSubmitted(true);

      // If direct file URL — open it after a short delay
      if (resource.file_url) {
        setTimeout(() => {
          window.open(resource.file_url, "_blank", "noopener,noreferrer");
        }, 1200);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
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
        {/* Header */}
        <div className="relative p-6 border-b border-border bg-gradient-to-br from-primary/8 to-primary/3">
          <button
            onClick={onClose}
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
          {resource.description && (
            <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">You're all set!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {resource.file_url
                    ? "Your download is opening now. Check your browser for the file."
                    : "We'll email you the resource shortly."}
                </p>
              </div>
              <button onClick={onClose} className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your details below to get free access to this resource.
              </p>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0088CC 0%, #003B8F 100%)" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {loading ? "Processing…" : "Get Free Access"}
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}