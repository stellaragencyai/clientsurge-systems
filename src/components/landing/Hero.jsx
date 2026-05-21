import { lazy, Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useDemoBooking } from "./DemoBookingContext";
import CascadingChecklistItem from "@/components/visual-effects/CascadingChecklistItem";
import { BUTTON_TEXT } from "@/lib/constants";
import {
  premiumEase,
  revealContainer,
  revealItem,
  useMagneticMotion,
} from "./PremiumHomepageMotion";


const HeroDashboardScreen = lazy(() => import("./HeroDashboardScreen"));

const checklist = [
"Recover missed calls and after-hours leads",
"Automatically follow up with every inquiry",
"Book more appointments without hiring extra staff"];

const MotionLink = motion(Link);
const headlineWords = ["AI", "Automation", "Systems", "That", "Turn", "More", "Local", "Leads", "Into"];

export default function Hero() {
  const demoBooking = useDemoBooking();
  const primaryCta = useMagneticMotion(0.14);
  const secondaryCta = useMagneticMotion(0.1);
  const { scrollYProgress } = useScroll();
  const gridY = useTransform(scrollYProgress, [0, 0.35], [0, 120]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.22], [0.55, 0.08]);

  return (
    <section
      className="landing-hero"
      style={{
        position: "relative",
        overflow: "visible",
        background: "#ffffff",
        paddingBottom: "clamp(5rem, 8vw, 7rem)"
      }}>

      <div
        aria-hidden="true"
        className="landing-hero__ambient"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none"
        }}>
        
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
            "radial-gradient(circle at 18% 20%, rgba(0,174,239,0.08) 0%, transparent 30%), radial-gradient(circle at 72% 22%, rgba(0,157,255,0.08) 0%, transparent 24%), radial-gradient(circle at 78% 56%, rgba(0,59,143,0.06) 0%, transparent 32%)"
          }} />
        
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
            "linear-gradient(to right, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 40%, rgba(255,255,255,0.68) 60%, rgba(255,255,255,0.2) 100%)"
          }} />
        
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
            "linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, transparent 28%, rgba(255,255,255,0.34) 100%)"
          }} />
        
      </div>

      <motion.div
        aria-hidden="true"
        className="landing-hero__motionGrid"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          y: gridY,
          opacity: gridOpacity,
          backgroundImage:
            "linear-gradient(rgba(0,174,239,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,174,239,0.1) 1px, transparent 1px), radial-gradient(circle at 72% 30%, rgba(0,174,239,0.12), transparent 30%)",
          backgroundSize: "56px 56px, 56px 56px, 100% 100%",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 72%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 72%, transparent 100%)",
          zIndex: 1,
        }}
      />

      <div
        className="landing-hero__inner"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "clamp(7rem, 12vw, 10rem) clamp(1.5rem, 5vw, 4rem) clamp(3rem, 6vw, 5rem)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(32px, 5vw, 64px)",
          alignItems: "center",
          minHeight: "100svh"
        }}>
        
        <motion.div
          className="landing-hero__copy"
          variants={revealContainer}
          initial="hidden"
          animate="visible"
          style={{ gridColumn: "1", marginBottom: "0px", textAlign: "left", maxWidth: "100%", position: "relative", zIndex: 10 }}
        >


          <motion.h1
            variants={revealItem}
            className="landing-hero__headline"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "clamp(2rem, 5.2vw, 3.8rem)",
              fontWeight: "700",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#1b140d",
              marginBottom: "16px"
            }}>
            
            {headlineWords.map((word) => (
              <motion.span
                key={word}
                variants={revealItem}
                style={{ display: "inline-block", marginRight: "0.32em" }}
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              variants={revealItem}
              className="cinematic-text-sheen"
              style={{
                display: "inline-block",
                filter: "drop-shadow(0 10px 22px rgba(0,174,239,0.22))"
              }}>
              
              Booked Jobs
            </motion.span>
          </motion.h1>

          {/* Visual enhancement: shimmer divider under headline */}


          <motion.p
            variants={revealItem}
            className="landing-hero__body"
            style={{
              fontSize: "clamp(0.95rem, 2.2vw, 1.05rem)",
              color: "rgba(27,20,13,0.74)",
              lineHeight: 1.65,
              maxWidth: "560px",
              margin: "0 0 18px"
            }}>
            
            ClientSurge Systems builds AI-powered websites, voice agents, and lead automation systems for local service businesses. Recover missed calls, respond instantly, nurture leads automatically, and book more appointments without adding staff.
          </motion.p>

          <motion.div
            variants={revealContainer}
            className="landing-hero__checklist hero-checklist"
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", maxWidth: "640px", margin: "0 0 32px" }}>
            
            {checklist.map((item, i) =>
            <CascadingChecklistItem key={item} item={item} index={i} />
            )}
          </motion.div>

          <motion.div
            variants={revealItem}
            className="landing-hero__actions"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              justifyContent: "flex-start",
              WebkitTapHighlightColor: "transparent",
              marginTop: "32px"
            }}>
            
            <motion.button
              ref={primaryCta.ref}
              type="button"
              onClick={demoBooking?.openDemoBooking}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...primaryCta.motionStyle,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                minHeight: "58px",
                padding: "0 32px",
                borderRadius: "9999px",
                border: "none",
                background:
                "linear-gradient(135deg, #0088CC 0%, #006BB0 46%, #00AEEF 100%)",
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: "700",
                boxShadow: "0 4px 18px rgba(0,174,239,0.4)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}
              {...primaryCta.magneticHandlers}>
              <span className="cinematic-pulse-rings" aria-hidden="true" />
              <motion.span
                aria-hidden="true"
                animate={{ x: ["-140%", "140%"] }}
                transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent)",
                  transform: "skewX(-18deg)",
                }}
              />
              <span style={{ position: "relative", zIndex: 1 }}>{BUTTON_TEXT.BOOK_DEMO}</span>
              <ArrowRight style={{ width: "18px", height: "18px", position: "relative", zIndex: 1 }} />
            </motion.button>
            <MotionLink
              ref={secondaryCta.ref}
              to="/automations"
              className="inline-flex items-center justify-center"
              whileHover={{ scale: 1.035, borderColor: "rgba(0,136,204,0.46)" }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...secondaryCta.motionStyle,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "58px",
                padding: "0 28px",
                borderRadius: "9999px",
                border: "1.5px solid rgba(0,136,204,0.28)",
                background: "rgba(255,255,255,0.86)",
                color: "#0050A0",
                fontSize: "0.95rem",
                fontWeight: "700",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,80,160,0.08)"
              }}
              {...secondaryCta.magneticHandlers}
            >
              View AI Automations
            </MotionLink>
          </motion.div>

          <motion.p
            variants={revealItem}
            style={{
              marginTop: "18px",
              fontSize: "12px",
              color: "rgba(27,20,13,0.48)",
              letterSpacing: "0.04em"
            }}>
            No contracts · Most clients go live in 24–48 hours
          </motion.p>
        </motion.div>

        <motion.div
          className="landing-hero__visualWrap"
          initial={{ opacity: 0, y: 36, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, delay: 0.28, ease: premiumEase }}
          style={{
            position: "relative",
            minHeight: "520px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gridColumn: "2",
            perspective: "1200px"
          }}>
          
          <div
            aria-hidden="true"
            className="landing-hero__visualGlow"
            style={{
              position: "absolute",
              width: "90%",
              height: "72%",
              borderRadius: "36px",
              background:
              "radial-gradient(circle at center, rgba(0,174,239,0.18) 0%, rgba(0,157,255,0.08) 38%, transparent 72%)",
              filter: "blur(36px)",
              transform: "translateY(6%)"
            }} />
          



          {/* Dashboard visual */}
          <motion.div
            animate={{ y: [0, -12, 0], rotateZ: [0, 0.35, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "100%", transformStyle: "preserve-3d", position: "relative" }}
          >
            <span className="cinematic-orbit-ring" aria-hidden="true" />
            <span className="cinematic-orbit-ring cinematic-orbit-ring--two" aria-hidden="true" />
            <Suspense fallback={null}>
              <HeroDashboardScreen />
            </Suspense>
          </motion.div>
















































          
        </motion.div>
      </div>

      <style>{`
        /* Tablet and below — single column, centered */
        @media (max-width: 1024px) {
          .landing-hero__inner {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            min-height: auto !important;
            padding-top: clamp(5rem, 12vw, 7rem) !important;
          }
          .landing-hero__visualWrap {
            display: flex !important;
            grid-column: 1 !important;
            min-height: 360px !important;
          }
          .landing-hero__copy {
            max-width: 100% !important;
            text-align: center !important;
            grid-column: 1 !important;
          }
          .landing-hero__checklist {
            margin: 0 auto 32px !important;
          }
          .landing-hero__actions {
            justify-content: center !important;
          }
        }

        /* Hide tablet mock on small screens */
        @media (max-width: 720px) {
          .landing-hero__visualWrap {
            display: none !important;
          }
          .landing-hero__headline {
            font-size: clamp(2rem, 8.5vw, 3.4rem) !important;
            line-height: 1.05 !important;
            letter-spacing: -0.025em !important;
          }
          .landing-hero__body {
            font-size: 1rem !important;
            line-height: 1.7 !important;
          }
          .landing-hero__checklist {
            gap: 8px !important;
          }
          .landing-hero__actions {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .landing-hero__actions > * {
            width: 100% !important;
            justify-content: center !important;
          }
          .hero-check-item {
            width: 100% !important;
            max-width: 100% !important;
            padding: 9px 14px 9px 10px !important;
          }
          .hero-check-item span {
            font-size: 13px !important;
          }
        }

        /* iPhone SE (375px) and smaller */
        @media (max-width: 390px) {
          .landing-hero__inner {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .landing-hero__headline {
            font-size: clamp(1.85rem, 9vw, 2.4rem) !important;
          }
          .landing-hero__body {
            font-size: 0.95rem !important;
          }
        }

        /* iPhone SE specific (320px) */
        @media (max-width: 360px) {
          .landing-hero__headline {
            font-size: 1.75rem !important;
            letter-spacing: -0.02em !important;
          }
        }
      `}</style>
    </section>);

}
