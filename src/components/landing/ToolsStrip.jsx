const tools = [
  "Twilio",
  "Google Calendar",
  "Google",
  "Resend",
  "Base44",
];

export default function ToolsStrip() {
  return (
    <section className="px-6 py-8 bg-background">
      <div className="max-w-6xl mx-auto rounded-3xl border border-border bg-card/70 px-6 py-6">
        <div className="text-center mb-4">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
            Powered By Trusted Tools
          </p>
          <p className="text-sm text-muted-foreground">
            We build your automation around tools businesses already know and use.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {tools.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground/80"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
