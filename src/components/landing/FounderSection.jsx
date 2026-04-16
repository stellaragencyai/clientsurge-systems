export default function FounderSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-12 p-12 md:p-16 items-center">
            {/* Left: Photo Placeholder */}
            <div className="flex items-center justify-center">
              <div className="w-64 h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-600/30 to-amber-800/20 border border-amber-500/30 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=85"
                  alt="Neo — Founder of ClientSurge Systems"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right: Message */}
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Built by someone who actually gets it</p>
              <h3 className="font-display text-3xl md:text-4xl font-semibold text-white mb-6 leading-tight">
                I'm Neo — Founder of ClientSurge Systems
              </h3>
              <p className="text-base text-slate-200 leading-relaxed mb-6">
                I built this after watching local businesses spend thousands attracting leads and lose half of them to slow follow-up. Every system is custom, done-for-you, and designed to pay for itself within 30 days.
              </p>
              <div className="pt-6 border-t border-amber-500/20">
                <p className="text-sm text-amber-400 font-semibold">
                  — Neo, Founder · ClientSurge Systems · Phoenix, AZ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}