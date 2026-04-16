export default function MedSpaTransition() {
  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (!el) return;
    const start = window.scrollY;
    const target = el.getBoundingClientRect().top + window.scrollY - 64;
    const distance = target - start;
    const duration = 900;
    let startTime = null;
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      window.scrollTo(0, start + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <section className="py-24 md:py-32 px-6 bg-background border-b border-border">
      <div className="max-w-3xl mx-auto text-center">
        <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-6">
          And this is exactly what our system fixes.
        </h3>
        <button
          onClick={() => scrollTo("#how-it-works-medspa")}
          className="text-primary font-semibold text-base hover:text-primary/80 transition-colors"
        >
          Here's how it works →
        </button>
      </div>
    </section>
  );
}