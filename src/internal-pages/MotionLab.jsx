import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  ChevronRight,
  Cpu,
  Gauge,
  MessageSquareText,
  MousePointer2,
  PhoneCall,
  Radar,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  CinematicSectionDivider,
  HomepageMotionShell,
  MotionSection,
  premiumEase,
  revealContainer,
  revealItem,
} from "@/components/landing/PremiumHomepageMotion";
import { setPageMetadata } from "@/lib/seo";

const panels = [
  {
    title: "Hero Reveal",
    subtitle: "Word sequencing with depth and light.",
    icon: Sparkles,
    accent: "#00AEEF",
  },
  {
    title: "Lead Signal",
    subtitle: "Incoming intent gets routed live.",
    icon: Radar,
    accent: "#009DFF",
  },
  {
    title: "CTA Field",
    subtitle: "Glow, pulse, and tactile response.",
    icon: MousePointer2,
    accent: "#003B8F",
  },
  {
    title: "System Card",
    subtitle: "Premium corners and live state.",
    icon: Cpu,
    accent: "#00AEEF",
  },
];

const timeline = [
  { label: "Capture", icon: PhoneCall },
  { label: "Respond", icon: MessageSquareText },
  { label: "Qualify", icon: Bot },
  { label: "Book", icon: CalendarCheck },
];

function MagneticLabButton() {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 22 });
  const springY = useSpring(y, { stiffness: 260, damping: 22 });

  const move = (event) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * 0.14);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.14);
  };

  return (
    <motion.button
      type="button"
      onPointerMove={move}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.98 }}
      style={{ x: springX, y: springY }}
      className="relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full px-7 text-sm font-black text-white shadow-[0_18px_50px_rgba(0,174,239,0.32)]"
    >
      <span className="cinematic-pulse-rings" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #00AEEF 0%, #0088CC 44%, #003B8F 100%)",
        }}
      />
      <motion.span
        aria-hidden="true"
        animate={{ x: ["-130%", "130%"] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.3, ease: "easeInOut" }}
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.36), transparent)",
          transform: "skewX(-18deg)",
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        Book Free Audit <ArrowRight className="h-4 w-4" />
      </span>
    </motion.button>
  );
}

function SignalNode({ index, label, Icon }) {
  return (
    <motion.div
      className="cinematic-data-pulse relative rounded-2xl border border-primary/15 bg-white/86 p-4 shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: premiumEase }}
      whileHover={{ y: -5 }}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
        0{index + 1}
      </p>
      <p className="mt-1 text-base font-black text-foreground">{label}</p>
    </motion.div>
  );
}

function CinematicPanel({ panel, index, active, setActive }) {
  const Icon = panel.icon;

  return (
    <motion.button
      type="button"
      onClick={() => setActive(index)}
      className="cinematic-corner-card group relative min-h-[210px] overflow-hidden rounded-2xl border border-primary/15 bg-white p-5 text-left shadow-sm"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: premiumEase }}
      whileHover={{ y: -8, scale: 1.01 }}
      style={{
        boxShadow: active
          ? "0 24px 70px rgba(0,174,239,0.18), inset 0 1px 0 rgba(255,255,255,0.9)"
          : "0 10px 34px rgba(0,36,86,0.06)",
      }}
    >
      <motion.span
        aria-hidden="true"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "linear", delay: index * 0.2 }}
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "linear-gradient(115deg, transparent, rgba(0,174,239,0.08), transparent, rgba(0,59,143,0.06), transparent)",
          backgroundSize: "240% 240%",
        }}
      />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div
            className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15"
            style={{ background: `${panel.accent}14`, color: panel.accent }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black text-foreground">{panel.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{panel.subtitle}</p>
        </div>
        <div className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-primary">
          Preview <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.button>
  );
}

export default function MotionLab() {
  const [active, setActive] = useState(0);
  const activePanel = panels[active];
  const activeIcon = useMemo(() => activePanel.icon, [activePanel]);
  const ActiveIcon = activeIcon;

  useEffect(() => {
    return setPageMetadata({
      title: "Motion Lab | ClientSurge Systems",
      description:
        "Internal cinematic animation preview board for ClientSurge Systems.",
      canonicalPath: "/motion-lab",
    });
  }, []);

  return (
    <HomepageMotionShell>
      <div className="min-h-screen bg-white text-foreground">
        <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/82 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <Link to="/" className="text-sm font-black text-foreground no-underline">
              ClientSurge Systems
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex h-10 items-center justify-center rounded-full border border-primary/20 px-4 text-xs font-black text-primary no-underline"
              >
                Home
              </Link>
              <MagneticLabButton />
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden px-4 pb-14 pt-16 md:px-6 md:pb-24 md:pt-24">
          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-16 h-[420px] w-[420px] -translate-x-1/2 rounded-full"
            animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.32, 0.18] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(circle, rgba(0,174,239,0.28) 0%, rgba(0,157,255,0.08) 38%, transparent 72%)",
              filter: "blur(24px)",
            }}
          />
          <motion.div
            className="relative z-10 mx-auto max-w-5xl text-center"
            variants={revealContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.p variants={revealItem} className="text-xs font-black uppercase tracking-[0.32em] text-primary">
              Motion Lab
            </motion.p>
            <motion.h1
              variants={revealItem}
              className="mt-5 text-5xl font-black leading-[0.98] tracking-tight text-foreground md:text-7xl"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Cinematic Components For The Lead Conversion System
            </motion.h1>
            <motion.p variants={revealItem} className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              A live preview board for premium motion, futuristic cards, tactile CTAs, signal routing, and mobile-safe animation behavior.
            </motion.p>
          </motion.div>
        </section>

        <CinematicSectionDivider />

        <MotionSection>
          <section className="px-4 py-14 md:px-6 md:py-20">
            <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="rounded-3xl border border-primary/15 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ActiveIcon className="h-7 w-7" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
                  Active Preview
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
                  {activePanel.title}
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                  {activePanel.subtitle} Built as real React and Framer Motion behavior, not a static mockup.
                </p>
                <div className="mt-8">
                  <MagneticLabButton />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {panels.map((panel, index) => (
                  <CinematicPanel
                    key={panel.title}
                    panel={panel}
                    index={index}
                    active={active === index}
                    setActive={setActive}
                  />
                ))}
              </div>
            </div>
          </section>
        </MotionSection>

        <MotionSection>
          <section className="px-4 py-14 md:px-6 md:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
                  Signal Sequence
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
                  A scroll-triggered routing path for the homepage story.
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                {timeline.map((item, index) => (
                  <SignalNode key={item.label} index={index} label={item.label} Icon={item.icon} />
                ))}
              </div>
            </div>
          </section>
        </MotionSection>

        <MotionSection>
          <section className="px-4 pb-24 pt-14 md:px-6 md:pb-32 md:pt-20">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-primary/15 bg-[#06152e] p-6 text-white shadow-[0_30px_100px_rgba(0,23,56,0.22)] md:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200">
                    Cinematic Dashboard
                  </p>
                  <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                    Revenue motion without visual chaos.
                  </h2>
                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/68 md:text-base">
                    These elements are tuned for calm premium motion: steady rhythm, soft light, clear hierarchy, and reduced-motion support.
                  </p>
                </div>
                <div className="relative min-h-[330px] rounded-3xl border border-white/10 bg-white/8 p-5">
                  <span className="cinematic-orbit-ring" aria-hidden="true" />
                  <span className="cinematic-orbit-ring cinematic-orbit-ring--two" aria-hidden="true" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Response", value: "38s", icon: Zap },
                      { label: "Bookings", value: "3x", icon: Gauge },
                      { label: "Flows", value: "6", icon: Workflow },
                      { label: "Live", value: "24/7", icon: Bot },
                    ].map(({ label, value, icon: Icon }, index) => (
                      <motion.div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl"
                        animate={{ y: [0, index % 2 ? -8 : -5, 0] }}
                        transition={{ duration: 4.8 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Icon className="mb-6 h-6 w-6 text-cyan-200" />
                        <p className="text-4xl font-black">{value}</p>
                        <p className="mt-1 text-xs font-black uppercase tracking-[0.24em] text-white/50">
                          {label}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </MotionSection>
      </div>
    </HomepageMotionShell>
  );
}
