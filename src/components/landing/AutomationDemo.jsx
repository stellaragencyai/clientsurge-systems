import { useState, useEffect } from "react";
import { CheckCircle2, MessageSquare, Clock } from "lucide-react";

const demoFlow = [
  {
    type: "lead",
    text: "Hi, I'm interested in your Botox services",
    time: "2:14 PM",
  },
  {
    type: "system",
    text: "Lead received",
    icon: "📥",
  },
  {
    type: "bot",
    text: "Thanks for reaching out! I'd love to help you book a consultation. What day works best for you?",
    time: "2:14 PM",
    label: "Instant Auto-Response",
  },
  {
    type: "lead",
    text: "Thursday afternoon?",
    time: "2:16 PM",
  },
  {
    type: "bot",
    text: "Perfect! I have 3pm and 4pm available. Click here to confirm: [Book Now]",
    time: "2:16 PM",
    label: "Automated Follow-Up",
  },
  {
    type: "system",
    text: "Appointment booked",
    icon: "✅",
  },
];

export default function AutomationDemo() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % (demoFlow.length + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
            Automation in Action
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Lead to Booked in Minutes
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Here's exactly how our system captures leads and converts them to customers — automatically.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Timeline */}
          <div className="space-y-4">
            {[
              { step: 1, label: "Lead Arrives", desc: "A prospect contacts you" },
              { step: 2, label: "Instant Response", desc: "System replies in <60 seconds" },
              { step: 3, label: "Follow-Up", desc: "Smart sequences nurture them" },
              { step: 4, label: "Booking", desc: "Lead schedules appointment" },
              { step: 5, label: "Closed", desc: "Customer arrives & pays" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  activeStep === idx
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    activeStep === idx
                      ? "bg-primary text-primary-foreground"
                      : "bg-border text-foreground"
                  }`}>
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.label}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Mockup */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-lg">
            <div className="px-5 py-3 border-b border-border bg-muted/50 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-muted-foreground">Live Demo</span>
            </div>

            <div className="p-5 space-y-4 h-80 overflow-y-auto">
              {demoFlow.map((msg, idx) => {
                if (msg.type === "system") {
                  return (
                    <div key={idx} className="text-center py-2">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full inline-block">
                        {msg.icon} {msg.text}
                      </span>
                    </div>
                  );
                }

                const isBot = msg.type === "bot";
                const isActive = idx <= activeStep;

                return (
                  <div
                    key={idx}
                    className={`flex ${isBot ? "justify-start" : "justify-end"} transition-opacity duration-500 ${
                      isActive ? "opacity-100" : "opacity-40"
                    }`}
                  >
                    <div>
                      {msg.label && (
                        <span className="text-[10px] text-primary font-semibold mb-1 px-1 block">
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
                      {msg.time && (
                        <span className="text-[10px] text-muted-foreground mt-1 px-1 block">
                          {msg.time}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}