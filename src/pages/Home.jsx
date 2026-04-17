import { useState } from "react";
import { ChevronRight } from "lucide-react";
import DemoBookingModal from "../components/forms/DemoBookingModal";

const NEURAL_IMAGE = "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/65296e94d_generated_image.png";
const BG_IMAGE = "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/4c711bf35_generated_image.png";

const navLinks = ["Services", "Integrations", "About Us", "Blog", "FAQ"];

const features = [
  {
    icon: "🧠",
    title: "Intelligent Automation",
    desc: "Streamline workflows with advanced AI.",
  },
  {
    icon: "⚙️",
    title: "Seamless Integrations",
    desc: "Connect effortlessly with your existing tools.",
  },
  {
    icon: "🔍",
    title: "Data-Driven Insights",
    desc: "Unlock actionable insights with your existing tools.",
  },
];

const testimonials = [
  {
    quote: "\u201cRevolutionized our operations!\u201d",
    author: "\u2013 CEO, TechCorp",
  },
  {
    quote: "Indispensable for growth.",
    author: "For growth \u2013 Founder AI Solutions",
  },
];

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div
      className="min-h-screen font-inter"
      style={{
        backgroundImage: `url('${BG_IMAGE}')`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        backgroundColor: "#f0ede8",
      }}
    >
      {/* Navbar */}
      <nav
        className="w-full flex items-center justify-between px-10 py-4 border-b"
        style={{ borderColor: "rgba(154,92,46,0.15)", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)" }}
      >
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm font-medium transition-colors"
              style={{ color: "#5a4a35" }}
              onMouseEnter={e => e.currentTarget.style.color = "#9a5c2e"}
              onMouseLeave={e => e.currentTarget.style.color = "#5a4a35"}
            >
              {link}
            </a>
          ))}
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowDemo(true)}
            className="px-5 py-2 text-sm font-semibold rounded border transition-all"
            style={{ borderColor: "#9a5c2e", color: "#9a5c2e", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#9a5c2e"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9a5c2e"; }}
          >
            Book a Demo
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <h1
            className="font-display text-5xl md:text-6xl font-bold leading-tight mb-4"
            style={{ color: "#3a2e1e" }}
          >
            Unlock the Power of AI
          </h1>
          <p className="text-xl font-medium mb-8" style={{ color: "#9a5c2e" }}>
            Automate, Innovate, Accelerate
          </p>
          <button
            onClick={() => setShowDemo(true)}
            className="px-7 py-3 text-sm font-semibold transition-all"
            style={{ background: "#8a6a30", color: "#fff", borderRadius: "4px" }}
            onMouseEnter={e => e.currentTarget.style.background = "#6b4f22"}
            onMouseLeave={e => e.currentTarget.style.background = "#8a6a30"}
          >
            Discover More
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <img
            src={NEURAL_IMAGE}
            alt="AI Neural Network"
            className="w-full max-w-md rounded-lg shadow-lg"
            style={{ opacity: 0.92 }}
          />
        </div>
      </section>

      {/* Platform Features */}
      <section className="max-w-6xl mx-auto px-8 pb-20">
        <h2 className="text-2xl font-semibold mb-8" style={{ color: "#3a2e1e", fontFamily: "var(--font-display)" }}>
          Platform Features
        </h2>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 flex flex-col gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(154,92,46,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="font-semibold mb-1" style={{ color: "#3a2e1e" }}>{f.title}:</p>
                  <p className="text-sm" style={{ color: "#7a6a55" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src={NEURAL_IMAGE}
              alt="AI Network"
              className="w-full max-w-sm rounded-lg shadow-md"
              style={{ opacity: 0.88 }}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-8 pb-24">
        <h2 className="text-2xl font-semibold mb-8" style={{ color: "#3a2e1e", fontFamily: "var(--font-display)" }}>
          Testimonials
        </h2>
        <div className="flex flex-col gap-5 max-w-md">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(154,92,46,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span className="text-2xl flex-shrink-0" style={{ color: "#9a5c2e" }}>"</span>
              <div>
                <p className="font-semibold mb-1" style={{ color: "#3a2e1e" }}>{t.quote}</p>
                <p className="text-sm" style={{ color: "#9a5c2e" }}>{t.author}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="w-full px-10 py-5 flex flex-col md:flex-row items-center justify-between text-xs gap-3"
        style={{ background: "rgba(230,220,205,0.85)", borderTop: "1px solid rgba(154,92,46,0.15)", color: "#7a6a55" }}
      >
        <span>© 2024 AI Innovate Inc.</span>
        <div className="flex items-center gap-4">
          <a href="/legal/privacy" className="hover:underline">Privacy Policy</a>
          <span>|</span>
          <a href="/legal/terms" className="hover:underline">Terms of Service</a>
        </div>
        <ChevronRight className="w-4 h-4 opacity-40" />
      </footer>

      {showDemo && <DemoBookingModal onClose={() => setShowDemo(false)} />}
    </div>
  );
}