import { useState, useEffect } from 'react';

const demoMessages = [
  { from: 'system', text: 'New inquiry: Sarah M. — Interested in Botox consultation', time: '2:14 PM' },
  { from: 'bot', text: "Hi Sarah! Thanks for your interest in our Botox services. I'd love to help you get scheduled. Do you prefer morning or afternoon?", time: '2:14 PM', label: 'Instant Auto-Response' },
  { from: 'lead', text: 'Afternoon works best!', time: '2:16 PM' },
  { from: 'bot', text: 'Perfect! Here are some available slots this week → [Book Now]', time: '2:16 PM', label: 'Smart Booking Flow' },
  { from: 'system', text: '✓ Appointment booked: Thursday, 3:00 PM — Botox Consultation', time: '2:18 PM' },
];

export default function DemoSection() {
  const [displayedMessages, setDisplayedMessages] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const handleAdvance = () => {
    if (displayedMessages < demoMessages.length) {
      setDisplayedMessages(displayedMessages + 1);
      setAutoPlay(false);
    }
  };

  // Auto-play logic
  useEffect(() => {
    if (!autoPlay || displayedMessages >= demoMessages.length) return;
    const timer = setTimeout(() => {
      setDisplayedMessages(displayedMessages + 1);
    }, 2500);
    return () => clearTimeout(timer);
  }, [displayedMessages, autoPlay]);

  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-center mb-4">
          From Lead to Booked
        </h2>
        <p className="text-center text-muted-foreground text-lg mb-16">
          Here's what the system looks like in action. Watch a lead convert in real time.
        </p>

        {/* Chat Demo */}
        <div className="max-w-lg mx-auto bg-foreground rounded-2xl border border-border overflow-hidden shadow-lg">
          <div className="px-5 py-3 border-b border-border/30 bg-muted flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-foreground">Live Demo</span>
          </div>

          <div className="p-5 space-y-4 h-96 overflow-y-auto bg-background">
            {demoMessages.slice(0, displayedMessages).map((msg, i) => {
              if (msg.from === 'system') {
                return (
                  <div key={i} className="text-center">
                    <span className="inline-block text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isBot = msg.from === 'bot';
              return (
                <div key={i} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                  {msg.label && <span className="text-xs text-primary font-semibold mb-1 px-1">{msg.label}</span>}
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-lg text-sm leading-relaxed ${
                      isBot
                        ? 'bg-primary/10 text-foreground rounded-bl-none'
                        : 'bg-foreground text-background rounded-br-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 px-1">{msg.time}</span>
                </div>
              );
            })}
          </div>

          {displayedMessages < demoMessages.length && (
            <div className="px-5 py-4 border-t border-border/30 flex gap-3 bg-card">
              <button
                onClick={handleAdvance}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className="flex-1 px-4 py-2 bg-muted text-foreground text-sm font-semibold rounded-lg hover:bg-muted/80 transition-colors"
              >
                {autoPlay ? 'Pause' : 'Auto'}
              </button>
            </div>
          )}

          {displayedMessages >= demoMessages.length && (
            <div className="px-5 py-4 border-t border-border/30 bg-primary/5 text-center">
              <p className="text-sm text-foreground font-semibold">Booking confirmed. Appointment scheduled.</p>
              <p className="text-xs text-muted-foreground mt-1">All without manual intervention.</p>
            </div>
          )}
        </div>

        <p className="text-center text-muted-foreground text-sm mt-8">
          This entire interaction happens automatically. Zero manual work.
        </p>
      </div>
    </section>
  );
}