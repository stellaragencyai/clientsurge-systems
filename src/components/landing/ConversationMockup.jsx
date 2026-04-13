export default function ConversationMockup() {
  const messages = [
    {
      from: "system",
      text: "New lead received: Sarah M. — Interested in Botox consultation",
      time: "2:14 PM",
    },
    {
      from: "bot",
      text: "Hi Sarah! Thanks for your interest in our Botox services. I'd love to help you get scheduled. Would you prefer morning or afternoon for your consultation?",
      time: "2:14 PM",
      label: "Instant Auto-Response",
    },
    {
      from: "lead",
      text: "Afternoon works best!",
      time: "2:16 PM",
    },
    {
      from: "bot",
      text: "Great! I have a few openings this week. Here's a link to book your preferred time: [Book Now] — Looking forward to seeing you!",
      time: "2:16 PM",
      label: "Smart Booking Flow",
    },
    {
      from: "system",
      text: "✓ Appointment booked: Thursday, 3:00 PM — Botox Consultation",
      time: "2:18 PM",
    },
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-card via-background to-card">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">
            See It In Action
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            From Lead to Booked — In Minutes
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Here's what automated follow-up looks like in practice.
          </p>
        </div>

        <div className="max-w-lg mx-auto bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-border bg-muted/50 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-muted-foreground">Live Automation Preview</span>
          </div>

          <div className="p-5 space-y-4">
            {messages.map((msg, i) => {
              if (msg.from === "system") {
                return (
                  <div key={i} className="text-center">
                    <span className="inline-block text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isBot = msg.from === "bot";
              return (
                <div key={i} className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}>
                  {msg.label && (
                    <span className="text-[10px] text-primary font-medium mb-1 px-1">
                      {msg.label}
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isBot
                        ? "bg-primary/10 text-foreground rounded-bl-md"
                        : "bg-foreground text-background rounded-br-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}