import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const INTEGRATIONS = [
  {
    name: "Calendly",
    logo: "https://images.ctfassets.net/c7lxnbtvjsut/5tL8xOqxKKVs1v4q7U2UBd/24ee4a3eacba1e047e8cbedb42b2cc54/calendly.png",
    description: "Appointment booking",
  },
  {
    name: "Google Calendar",
    logo: "https://www.svgrepo.com/show/303108/google-calendar-logo.svg",
    description: "Calendar sync",
  },
  {
    name: "Zapier",
    logo: "https://www.svgrepo.com/show/376510/zapier.svg",
    description: "Workflow automation",
  },
  {
    name: "HubSpot",
    logo: "https://www.svgrepo.com/show/349346/hubspot.svg",
    description: "CRM & leads",
  },
  {
    name: "Stripe",
    logo: "https://www.svgrepo.com/show/353659/stripe.svg",
    description: "Payments",
  },
  {
    name: "Twilio",
    logo: "https://www.svgrepo.com/show/373595/twilio.svg",
    description: "SMS & voice",
  },
  {
    name: "Acuity Scheduling",
    logo: "https://www.squarespace.com/favicon.ico",
    description: "Appointment management",
  },
];

export default function IntegrationPartners() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const itemsPerView = 5;
  const totalSlides = Math.ceil(INTEGRATIONS.length / itemsPerView);

  const nextSlide = () => {
    setCurrent((current + 1) % totalSlides);
    setAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrent((current - 1 + totalSlides) % totalSlides);
    setAutoPlay(false);
  };

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay, totalSlides]);

  const visibleItems = INTEGRATIONS.slice(current * itemsPerView, (current + 1) * itemsPerView);

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background via-card to-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">Integrations</p>
          <h2 className="font-titles text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            We Easily Integrate With
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Connect your favorite tools directly. Our system works seamlessly with the platforms your business already uses.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Carousel Container */}
          <div
            className="flex gap-6 justify-center items-center transition-all duration-500 ease-out"
            style={{
              transform: `translateX(-${current * (100 / itemsPerView)}%)`,
            }}
          >
            {INTEGRATIONS.map((integration, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-1/5 min-w-[120px]"
                style={{
                  opacity: visibleItems.includes(integration) ? 1 : 0.3,
                  transform: visibleItems.includes(integration) ? "scale(1)" : "scale(0.8)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                }}
              >
                <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-border/50 hover:border-primary/30 bg-white/40 backdrop-blur-sm hover:shadow-md transition-all group">
                  {/* Logo */}
                  <div className="w-16 h-16 rounded-xl bg-white border border-border flex items-center justify-center group-hover:border-primary/40 transition-all">
                    <img
                      src={integration.logo}
                      alt={integration.name}
                      className="w-10 h-10 object-contain"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Text */}
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{integration.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{integration.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            onMouseEnter={() => setAutoPlay(false)}
            onMouseLeave={() => setAutoPlay(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 w-10 h-10 rounded-full border border-border hover:border-primary/40 bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-foreground hover:text-primary transition-all z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={nextSlide}
            onMouseEnter={() => setAutoPlay(false)}
            onMouseLeave={() => setAutoPlay(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 w-10 h-10 rounded-full border border-border hover:border-primary/40 bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-foreground hover:text-primary transition-all z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrent(idx);
                setAutoPlay(false);
              }}
              className={`transition-all rounded-full ${
                idx === current
                  ? "w-8 h-2 bg-primary"
                  : "w-2 h-2 bg-primary/30 hover:bg-primary/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Trust Text */}
        <p className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto">
          Don't see your tool? Contact us — we can integrate with almost any platform through custom APIs and webhooks.
        </p>
      </div>
    </section>
  );
}