const INTEGRATIONS = [
  "Twilio",
  "Resend",
  "Stripe",
  "Cloudflare",
  "Base44",
  "GitHub",
];

export default function IntegrationCredibilityStrip() {
  return (
    <section
      aria-label="ClientSurge implementation toolchain"
      className="border-y border-sky-100 bg-white px-4 py-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006BB0]">
            Implementation Stack
          </p>
          <p className="mt-1 max-w-xl text-sm font-semibold leading-6 text-slate-500">
            Built around the tools your automation system can run on. These are platform/integration references, not fabricated customer proof.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:w-auto md:grid-cols-6">
          {INTEGRATIONS.map((name) => (
            <div
              key={name}
              className="flex h-14 min-w-[112px] items-center justify-center rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 px-4 text-sm font-black text-slate-700 shadow-[0_12px_32px_rgba(0,107,176,0.06)]"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
