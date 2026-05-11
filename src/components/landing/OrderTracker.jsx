export default function OrderTracker() {
  return (
    <div
      className="rounded-3xl px-6 py-6 text-center"
      style={{
        background: "rgba(255,255,255,0.92)",
        border: "1.5px solid rgba(154,92,46,0.12)",
        boxShadow: "0 8px 32px rgba(111,67,31,0.08)",
      }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
        Setup Updates
      </p>
      <p className="text-sm font-semibold text-foreground mb-2">
        Live order status now appears only inside the protected client portal.
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        We removed the public tracker to prevent unauthenticated access to customer order data.
        Watch for your confirmation email and portal invite for secure progress visibility.
      </p>
    </div>
  );
}
