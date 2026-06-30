import { AlertTriangle, CheckCircle2, Copy, Crown, Loader2, ShieldCheck } from "lucide-react";
import { buildDuplicateReviewGroups } from "@/lib/duplicateKeeperReview";

function FieldBadge({ ok, children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${ok ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {children}
    </span>
  );
}

function CandidateScore({ candidate, isKeeper }) {
  return (
    <div className={`rounded-lg border p-3 ${isKeeper ? 'border-green-200 bg-green-50' : 'border-border bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">{candidate.lead.business_name || candidate.lead.full_name || candidate.lead.email || candidate.lead.id}</p>
            {isKeeper && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                <Crown className="w-3 h-3" /> Recommended Keeper
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {candidate.lead.email || 'no email'} · {candidate.lead.phone || 'no phone'} · {candidate.lead.city || 'no city'}, {candidate.lead.state || 'no state'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <FieldBadge ok={Boolean(candidate.lead.email || candidate.lead.normalized_email)}>Email</FieldBadge>
            <FieldBadge ok={Boolean(candidate.lead.phone || candidate.lead.normalized_phone)}>Phone</FieldBadge>
            <FieldBadge ok={Boolean(candidate.lead.website || candidate.lead.website_url || candidate.lead.canonical_website_url)}>Website</FieldBadge>
            <FieldBadge ok={Boolean(candidate.lead.city || candidate.lead.state)}>Location</FieldBadge>
            <FieldBadge ok={candidate.reasons.includes('conversion/booking/payment/reply evidence')}>Revenue/Reply/Booking</FieldBadge>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Evidence: {candidate.reasons.length ? candidate.reasons.join('; ') : 'no positive evidence'}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-foreground">{candidate.score}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">score</p>
          <p className="mt-2 text-[10px] text-muted-foreground/70">{candidate.lead.source || '—'}</p>
          <p className="text-[10px] text-muted-foreground/60">{candidate.lead.created_date ? new Date(candidate.lead.created_date).toLocaleDateString() : 'no date'}</p>
        </div>
      </div>
    </div>
  );
}

export default function DuplicateGroups({ leads, loading }) {
  const groups = buildDuplicateReviewGroups(leads || []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Duplicate Keeper Review</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review duplicate groups before any merge/delete decision. The system recommends a keeper using contact completeness, website, location, conversion/reply/payment evidence, and existing quality flags.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 flex gap-3">
        <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">No automatic merge or delete happens here.</p>
          <p className="mt-1 text-xs">Use this review to decide the keeper. Delete only through Lead Quality Control → Delete Verified Junk after CSV backup and blocker review.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Copy className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No duplicate groups detected. Run the audit to check for duplicates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ groupKey, members, review }) => (
            <div key={groupKey} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${review.review_required ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
                {review.review_required ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
                <div>
                  <p className="text-sm font-semibold text-foreground">{groupKey}</p>
                  <p className="text-xs text-muted-foreground">{review.recommendation}</p>
                </div>
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-white/70 text-foreground border border-border">
                  {members.length} records
                </span>
              </div>

              <div className="p-4 space-y-3">
                {review.candidates.map((candidate) => (
                  <CandidateScore
                    key={candidate.lead.id}
                    candidate={candidate}
                    isKeeper={review.keeper?.id === candidate.lead.id && !review.review_required}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
