/**
 * IframeCheckoutGuard — detects iframe context and blocks checkout redirect.
 * Per Stripe best practices and the platform's own iframe detection requirement.
 * Usage: call isInIframe() before any window.location redirect to Stripe.
 */
export function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin iframe
  }
}

export default function IframeCheckoutGuard({ onDismiss }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="iframe-guard-title"
    >
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4 text-2xl">
          🔒
        </div>
        <h2 id="iframe-guard-title" className="text-lg font-bold text-foreground mb-2">
          Checkout Requires a New Tab
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          For your security, Stripe checkout must be completed in a dedicated browser tab — not inside an embedded
          preview.
        </p>
        <a
          href={window.location.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-bold text-white mb-3"
          style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
        >
          Open in New Tab →
        </a>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}