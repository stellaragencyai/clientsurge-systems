import { CalendarCheck, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

const CHECKLIST = [
  { step: 1, text: "Booking link is set in Admin Settings (booking_link_default)" },
  { step: 2, text: "Link opens without error" },
  { step: 3, text: "Correct calendar / booking page loads" },
  { step: 4, text: "Test booking or booking click is captured" },
  { step: 5, text: "Confirmation path exists (confirmation page or email)" },
];

export default function BookingProofCard({ bookingData, onRerun, loading }) {
  const link = bookingData?.booking_link_default;
  const linkPresent = bookingData?.link_present;
  const linkValid = bookingData?.link_looks_valid;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">E. Booking Flow Proof</h3>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${linkPresent && linkValid ? "bg-green-100 text-green-700" : linkPresent ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
          {linkPresent && linkValid ? "Ready for Proof" : linkPresent ? "Link May Be Invalid" : "Blocked"}
        </span>
      </div>

      {/* Booking link status */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Booking Link Status</p>
        <div className="flex items-start justify-between gap-2 text-xs">
          <span className="text-muted-foreground font-medium flex-shrink-0">booking_link_default</span>
          <span className="text-foreground text-right flex items-center gap-1">
            {linkPresent ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-500" />}
            {link || "Not configured"}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2 text-xs">
          <span className="text-muted-foreground font-medium flex-shrink-0">Link Present</span>
          <span className="text-foreground">{linkPresent ? "✓ Yes" : "✗ No"}</span>
        </div>
        <div className="flex items-start justify-between gap-2 text-xs">
          <span className="text-muted-foreground font-medium flex-shrink-0">Link Looks Valid</span>
          <span className="text-foreground">{linkValid ? "✓ Yes (starts with http)" : "✗ No"}</span>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {CHECKLIST.map(item => {
          let done = null;
          if (item.step === 1) done = linkPresent;
          return (
            <div key={item.step} className="flex items-start gap-2 text-xs">
              {done === true ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                : done === false ? <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />}
              <span className={done === true ? "text-green-700" : "text-muted-foreground"}>
                <span className="font-semibold">{item.step}.</span> {item.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Proof notes */}
      <div className="rounded-lg border border-border bg-muted/10 p-3">
        <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Proof Checklist (manual verification)</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>○ Open the booking link — does it load without error?</p>
          <p>○ Does the correct calendar / booking page appear?</p>
          <p>○ Can you complete a test booking or is a booking click captured?</p>
          <p>○ Is there a confirmation page or confirmation email after booking?</p>
        </div>
        <p className="text-xs text-muted-foreground mt-2 italic">
          Record screenshot filenames or notes here. Booking click/booking proof must exist before marking this gate as proof_passed.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80">
            <ExternalLink className="w-3.5 h-3.5" /> Open Booking Link
          </a>
        )}
        <button onClick={onRerun} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50">
          Re-run Proof
        </button>
      </div>

      <p className="text-xs text-primary font-semibold">{bookingData?.next_action}</p>
    </div>
  );
}