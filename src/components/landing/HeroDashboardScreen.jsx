import { useEffect, useMemo, useRef, useState } from "react";

const MOTION_MULTIPLIER = 1.4;

function scaleMs(duration) {
  return Math.round(duration * MOTION_MULTIPLIER);
}

function useCounter(target, duration = 1800, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay, duration, target]);

  return value;
}

const DEMO_MODES = {
  lead_response: {
    label: "New Lead",
    helper: "A new lead comes in and the first text goes out right away.",
    headerTitle: "Lead inbox",
    status: "Replying in 4s",
    notification: {
      type: "lead",
      appName: "ClientSurge",
      title: "New lead captured",
      source: "Glow Med Spa",
      detail: "Form lead received / intro text sent automatically",
    },
    stats: [
      { label: "Lead", value: "Marcus D.", accent: "#6366f1" },
      { label: "Source", value: "Website form", accent: "#c8965c" },
      { label: "Next step", value: "First text", accent: "#22c55e" },
    ],
    queueItems: [
      { title: "Marcus D.", meta: "Requested pricing", badge: "New" },
      { title: "Phone captured", meta: "(602) 555-0148", badge: "Ready" },
      { title: "Automation rule", meta: "Instant Lead Response", badge: "On" },
    ],
    messages: [
      { role: "system", text: "Lead synced from website form" },
      { role: "ai", text: "Hi Marcus. Thanks for reaching out to Glow Med Spa." },
      { role: "ai", text: "Would you like a quick pricing breakdown or a booking link first?" },
      { role: "lead", text: "Send me pricing first, please." },
    ],
    steps: [
      "New lead arrives",
      "Lead details land in the inbox",
      "First SMS sends automatically",
    ],
  },
  missed_call: {
    label: "Missed Call",
    helper: "A missed call turns into a text message instead of a lost lead.",
    headerTitle: "Call recovery",
    status: "Text-back in 60s",
    notification: {
      type: "lead",
      appName: "ClientSurge",
      title: "Missed call recovered",
      source: "Peak Health Clinic",
      detail: "No answer / text-back queued automatically",
    },
    stats: [
      { label: "Caller", value: "Priya K.", accent: "#6366f1" },
      { label: "Trigger", value: "Missed call", accent: "#c8965c" },
      { label: "Next step", value: "Recovery text", accent: "#22c55e" },
    ],
    queueItems: [
      { title: "Incoming call", meta: "11:42 AM / 23 sec", badge: "Missed" },
      { title: "Caller ID", meta: "(480) 555-0102", badge: "Matched" },
      { title: "Automation rule", meta: "Missed Call Text-Back", badge: "On" },
    ],
    messages: [
      { role: "system", text: "Call ended without answer" },
      { role: "ai", text: "Hi Priya. Sorry we missed your call." },
      { role: "ai", text: "Want us to text you details or help you book?" },
      { role: "lead", text: "Text me the details and the booking link." },
    ],
    steps: [
      "Missed call is detected",
      "Caller is matched to a record",
      "Text-back sends automatically",
    ],
  },
  booking: {
    label: "Booking",
    helper: "The system nudges the lead toward a booking link and confirmed next step.",
    headerTitle: "Booking handoff",
    status: "Booking in progress",
    notification: {
      type: "payment",
      appName: "Venmo",
      title: "Payment received",
      source: "Luxe Aesthetics",
      detail: "paid you $320 for setup deposit",
    },
    stats: [
      { label: "Lead", value: "Jordan T.", accent: "#6366f1" },
      { label: "Stage", value: "Ready to book", accent: "#c8965c" },
      { label: "Next step", value: "Booking link", accent: "#22c55e" },
    ],
    queueItems: [
      { title: "Jordan T.", meta: "Asked for next available slot", badge: "Hot" },
      { title: "Booking link", meta: "Shared automatically", badge: "Sent" },
      { title: "Follow-up", meta: "Reminder scheduled", badge: "Queued" },
    ],
    messages: [
      { role: "system", text: "Lead asked for the next available appointment" },
      { role: "ai", text: "Perfect. Here is your booking link for the next open slot." },
      { role: "ai", text: "Once you pick a time, we will send the confirmation for you." },
      { role: "lead", text: "Done. I booked for Thursday afternoon." },
    ],
    steps: [
      "Lead asks to move forward",
      "Booking link is shared",
      "Confirmation and reminders are queued",
    ],
  },
};

function StatusBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const formatTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    };

    setTime(formatTime());
    const intervalId = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 14px 2px",
        height: "20px",
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: "700",
          color: "rgba(26,18,9,0.75)",
          letterSpacing: "0.02em",
        }}
      >
        {time}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <rect
              key={index}
              x={index * 3.5}
              y={10 - (index + 1) * 2.5}
              width="2.5"
              height={(index + 1) * 2.5}
              rx="0.5"
              fill="rgba(26,18,9,0.65)"
            />
          ))}
        </svg>
        <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
          <path
            d="M7 8.5 C7 8.5 7 8.5 7 8.5"
            stroke="rgba(26,18,9,0.65)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4.5 6.5 C5.2 5.8 5.9 5.5 7 5.5 C8.1 5.5 8.8 5.8 9.5 6.5"
            stroke="rgba(26,18,9,0.65)"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M2.2 4.2 C3.5 2.9 5.1 2.2 7 2.2 C8.9 2.2 10.5 2.9 11.8 4.2"
            stroke="rgba(26,18,9,0.65)"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
          <div
            style={{
              width: "18px",
              height: "9px",
              borderRadius: "2px",
              border: "1px solid rgba(26,18,9,0.5)",
              padding: "1px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "75%",
                height: "100%",
                borderRadius: "1px",
                background: "#22c55e",
              }}
            />
          </div>
          <div
            style={{
              width: "2px",
              height: "4px",
              borderRadius: "0 1px 1px 0",
              background: "rgba(26,18,9,0.4)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function VenmoLogo() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "8px",
        background: "#008CFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: "#fff",
          fontSize: "19px",
          fontWeight: "900",
          fontStyle: "italic",
          transform: "translateY(-1px) skewX(-11deg)",
          lineHeight: 1,
          fontFamily: "'Arial Black', 'Inter', sans-serif",
        }}
      >
        v
      </span>
    </div>
  );
}

function NotificationBanner({ notification, visible }) {
  if (!notification) {
    return null;
  }

  const isPayment = notification.type === "payment";

  return (
    <div
      style={{
        position: "absolute",
        top: "24px",
        left: "10px",
        right: "10px",
        zIndex: 30,
        background: "rgba(255,255,255,0.92)",
        color: "#1a1209",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderRadius: "16px",
        padding: "10px 12px",
        boxShadow: "0 18px 40px rgba(15,23,42,0.14), 0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid rgba(255,255,255,0.55)",
        display: "flex",
        alignItems: "flex-start",
        gap: "9px",
        transform: visible ? "translateY(0)" : "translateY(-115%)",
        opacity: visible ? 1 : 0,
        transition: `transform ${scaleMs(350)}ms ease, opacity ${scaleMs(250)}ms ease`,
        pointerEvents: "none",
      }}
    >
      {isPayment ? (
        <VenmoLogo />
      ) : (
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "13px",
            fontWeight: "800",
            color: "#fff",
          }}
        >
          CS
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "3px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                color: "#111827",
                letterSpacing: "0.01em",
              }}
            >
              {notification.appName}
            </span>
            <span style={{ fontSize: "9px", color: "rgba(26,18,9,0.35)" }}>now</span>
          </div>
        </div>
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            margin: "0 0 1px",
            color: "#111827",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {notification.title}
        </p>
        <p
          style={{
            fontSize: "10px",
            margin: "0 0 1px",
            color: "#111827",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {notification.source}
        </p>
        <p
          style={{
            fontSize: "10px",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "rgba(26,18,9,0.55)",
          }}
        >
          {notification.detail}
        </p>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "3px",
        padding: "7px 10px",
        background: "#f0ece6",
        borderRadius: "3px 10px 10px 10px",
        width: "fit-content",
      }}
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "rgba(26,18,9,0.35)",
            animation: `typingDot ${scaleMs(1200)}ms ease-in-out ${Math.round(index * 280)}ms infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function HeroDashboardScreen() {
  const [activeMode, setActiveMode] = useState("lead_response");
  const [aiRespondingDot, setAiRespondingDot] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [liveLeads, setLiveLeads] = useState(247);
  const [liveRevenue, setLiveRevenue] = useState(4200);
  const [revenueFlash, setRevenueFlash] = useState(false);
  const [freshStep, setFreshStep] = useState(0);
  const [ripple, setRipple] = useState(null);
  const [glareVisible, setGlareVisible] = useState(false);
  const [todayLeadTick, setTodayLeadTick] = useState(0);
  const touchStartX = useRef(null);
  const cycleRef = useRef(0);

  const currentMode = useMemo(() => DEMO_MODES[activeMode], [activeMode]);
  const initialLeads = useCounter(247, scaleMs(2200), scaleMs(400));
  const initialRevenue = useCounter(4200, scaleMs(2400), scaleMs(1000));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setAiRespondingDot((value) => (value + 1) % 3);
    }, scaleMs(400));

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const rotateId = setInterval(() => {
      setActiveMode((previous) => {
        const keys = Object.keys(DEMO_MODES);
        const nextIndex = (keys.indexOf(previous) + 1) % keys.length;
        return keys[nextIndex];
      });
    }, scaleMs(18000));

    return () => clearInterval(rotateId);
  }, []);

  useEffect(() => {
    setNotificationVisible(true);
    const hideId = setTimeout(() => setNotificationVisible(false), scaleMs(3600));
    return () => clearTimeout(hideId);
  }, [activeMode]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Math.random() > 0.55) setLiveLeads((v) => v + 1);
      if (Math.random() > 0.5) {
        setLiveRevenue((v) => v + Math.floor(Math.random() * 90 + 30));
        setRevenueFlash(true);
        setTimeout(() => setRevenueFlash(false), 900);
      }
    }, scaleMs(16000));
    return () => clearInterval(intervalId);
  }, []);

  // Enhancement 3: Periodic glare sweep
  useEffect(() => {
    const triggerGlare = () => {
      setGlareVisible(true);
      setTimeout(() => setGlareVisible(false), 1400);
    };
    triggerGlare();
    const id = setInterval(triggerGlare, 8000);
    return () => clearInterval(id);
  }, []);

  // Functionality enhancement 2: live "today" lead ticker in header
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.6) setTodayLeadTick((v) => v + 1);
    }, scaleMs(7000));
    return () => clearInterval(id);
  }, []);

  // Enhancement 4: Swipe gesture to change tabs
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return;
    const keys = Object.keys(DEMO_MODES);
    setActiveMode((prev) => {
      const idx = keys.indexOf(prev);
      return diff > 0 ? keys[(idx + 1) % keys.length] : keys[(idx - 1 + keys.length) % keys.length];
    });
    touchStartX.current = null;
  };

  // Enhancement 1: Tap ripple
  const handleTabClick = (key, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ key, x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 500);
    setActiveMode(key);
  };

  useEffect(() => {
    setVisibleMessages(0);
    setShowTyping(false);
    setFadingOut(false);
    setFreshStep(0);
    cycleRef.current += 1;
    const runId = cycleRef.current;
    const timeouts = [];
    const messages = currentMode.messages;

    let delay = scaleMs(700);
    messages.forEach((message, index) => {
      if (message.role === "ai" && index > 0) {
        timeouts.push(
          setTimeout(() => {
            if (cycleRef.current !== runId) {
              return;
            }
            setShowTyping(true);
          }, delay)
        );
        delay += scaleMs(1000);
        timeouts.push(
          setTimeout(() => {
            if (cycleRef.current !== runId) {
              return;
            }
            setShowTyping(false);
            setVisibleMessages(index + 1);
            setFreshStep(Math.min(index + 1, currentMode.steps.length - 1));
          }, delay)
        );
      } else {
        timeouts.push(
          setTimeout(() => {
            if (cycleRef.current !== runId) {
              return;
            }
            setVisibleMessages(index + 1);
            setFreshStep(Math.min(index, currentMode.steps.length - 1));
          }, delay)
        );
      }

      delay += scaleMs(1300);
    });

    timeouts.push(
      setTimeout(() => {
        if (cycleRef.current !== runId) {
          return;
        }
        setFadingOut(true);
      }, delay + scaleMs(2400))
    );

    timeouts.push(
      setTimeout(() => {
        if (cycleRef.current !== runId) {
          return;
        }
        setVisibleMessages(0);
        setShowTyping(false);
        setFadingOut(false);
        setFreshStep(0);
      }, delay + scaleMs(3200))
    );

    return () => {
      cycleRef.current += 1;
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [currentMode]);

  const displayLeads = liveLeads || initialLeads;
  const displayRevenue = liveRevenue || initialRevenue;
  const textPrimary = "#1a1209";
  const textMuted = "rgba(26,18,9,0.45)";
  const cardBackground = "#ffffff";
  const cardBorder = "rgba(0,0,0,0.07)";
  const sectionBackground = "#f0ece6";

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        width: "100%",
        height: "100%",
        background: "#f8f5f0",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
        overflow: "hidden",
        position: "relative",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
      }}
    >
      {/* Enhancement 3: Glass glare sweep */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
        overflow: "hidden",
        borderRadius: "12px",
      }}>
        <div style={{
          position: "absolute",
          top: "-20%",
          left: glareVisible ? "120%" : "-60%",
          width: "40%",
          height: "140%",
          background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)",
          transform: "skewX(-12deg)",
          transition: `left ${glareVisible ? 1400 : 0}ms cubic-bezier(0.4,0,0.2,1)`,
          pointerEvents: "none",
        }} />
      </div>
      <NotificationBanner notification={currentMode.notification} visible={notificationVisible} />

      <StatusBar />

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "2px" }}>
        <div
          style={{
            width: "80px",
            height: "3px",
            borderRadius: "9999px",
            background: "rgba(26,18,9,0.12)",
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "0 14px 0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: "10px",
            padding: "7px 12px",
            border: "1px solid rgba(255,255,255,0.35)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "7px",
                background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "9px", fontWeight: "800", color: "#fff" }}>CS</span>
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: textPrimary, display: "block" }}>
                ClientSurge
              </span>
              <span style={{ fontSize: "8px", color: textMuted }}>{currentMode.helper}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Functionality enhancement 2: live today counter badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: "3px",
              background: "linear-gradient(135deg,rgba(154,92,46,0.12),rgba(200,150,92,0.1))",
              border: "1px solid rgba(154,92,46,0.2)",
              borderRadius: "8px", padding: "2px 6px",
            }}>
              <span style={{ fontSize: "8px", fontWeight: "800", color: "#9a5c2e", letterSpacing: "0.04em" }}>
                +{todayLeadTick + 3} today
              </span>
            </div>
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
                animation: `hPulse ${scaleMs(2000)}ms infinite`,
              }}
            />
            <span style={{ fontSize: "9px", color: textMuted, fontWeight: "600" }}>
              {currentMode.status}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "6px",
            background: "rgba(255,255,255,0.75)",
            borderRadius: "11px",
            padding: "4px",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          {Object.entries(DEMO_MODES).map(([key, mode]) => {
            const isActive = key === activeMode;
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => handleTabClick(key, e)}
                    style={{
                      overflow: "hidden",
                  flex: 1,
                  border: isActive ? "1.5px solid rgba(200,150,92,0.55)" : "1.5px solid transparent",
                  borderRadius: "8px",
                  padding: "8px 6px",
                  background: isActive
                    ? "linear-gradient(135deg,#1a1209 0%,#2a1e0f 100%)"
                    : "transparent",
                  color: isActive ? "#f5e6d0" : textPrimary,
                  cursor: "pointer",
                  transition: `background ${scaleMs(220)}ms ease, color ${scaleMs(220)}ms ease, border-color ${scaleMs(220)}ms ease`,
                  boxShadow: isActive ? "0 6px 14px rgba(26,18,9,0.2), inset 0 1px 0 rgba(200,150,92,0.2)" : "none",
                }}
              >
                {/* Enhancement 1: Tap ripple */}
                {ripple?.key === key && (
                  <span style={{
                    position: "absolute",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.35)",
                    width: "80px", height: "80px",
                    left: ripple.x - 40, top: ripple.y - 40,
                    animation: "rippleOut 0.5s ease-out forwards",
                    pointerEvents: "none",
                  }} />
                )}
                <span style={{ display: "block", fontSize: "10px", fontWeight: "800", position: "relative", zIndex: 1 }}>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "7px" }}>
          {currentMode.stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: cardBackground,
                border: `1.5px solid ${cardBorder}`,
                borderRadius: "11px",
                padding: "10px 8px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: `linear-gradient(90deg,${stat.accent}80,${stat.accent})`,
                  }}
                />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "8px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {stat.label}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "800",
                        color: stat.accent,
                        lineHeight: 1.15,
                        marginTop: "5px",
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                  {/* Functionality enhancement 1: mini sparkline */}
                  <svg width="28" height="16" viewBox="0 0 28 16" style={{ marginTop: "2px", opacity: 0.7 }}>
                    <polyline
                      points="0,14 5,10 9,11 13,6 17,8 22,3 28,1"
                      fill="none"
                      stroke={stat.accent}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="28" cy="1" r="2" fill={stat.accent} />
                  </svg>
                </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "0.92fr 1.08fr", gap: "10px", flex: 1, minHeight: 0 }}>
          <div
            style={{
              background: cardBackground,
              border: `1px solid ${cardBorder}`,
              borderRadius: "11px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: "700",
                  color: textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {currentMode.headerTitle}
              </span>
              <span
                style={{
                  fontSize: "8px",
                  fontWeight: "700",
                  color: "#22c55e",
                  background: "rgba(34,197,94,0.1)",
                  padding: "2px 7px",
                  borderRadius: "8px",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                Running
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "7px", flex: 1 }}>
              {currentMode.queueItems.map((item, index) => (
                <div
                  key={item.title}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                    padding: "8px 9px",
                    borderRadius: "10px",
                    background: sectionBackground,
                    border: index === freshStep ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(0,0,0,0.04)",
                    boxShadow: index === freshStep ? "0 0 0 2px rgba(34,197,94,0.08)" : "none",
                    transition: `border-color ${scaleMs(240)}ms ease, box-shadow ${scaleMs(240)}ms ease`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: textPrimary }}>{item.title}</span>
                    <span
                      style={{
                        fontSize: "8px",
                        fontWeight: "800",
                        color: "#22c55e",
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.2)",
                        padding: "2px 6px",
                        borderRadius: "999px",
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <span style={{ fontSize: "8px", color: textMuted }}>{item.meta}</span>
                </div>
              ))}

              <div
                style={{
                  marginTop: "auto",
                  padding: "8px 9px",
                  borderRadius: "10px",
                  background: "#f9f7f3",
                  border: "1px dashed rgba(154,92,46,0.18)",
                }}
              >
                <div style={{ fontSize: "8px", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Today
                </div>
                <div style={{ fontSize: "12px", fontWeight: "800", color: textPrimary, marginTop: "2px" }}>
                  {displayLeads}
                </div>
                {/* Enhancement 2: Revenue flash on tick */}
                <div style={{
                  fontSize: "8px",
                  color: revenueFlash ? "#16a34a" : textMuted,
                  fontWeight: revenueFlash ? "800" : "400",
                  transition: "color 0.3s, font-weight 0.3s",
                  background: revenueFlash ? "rgba(34,197,94,0.1)" : "transparent",
                  borderRadius: "4px",
                  padding: revenueFlash ? "1px 4px" : "0",
                }}>
                  active leads / ${displayRevenue.toLocaleString()} tracked
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: cardBackground,
              border: `1px solid ${cardBorder}`,
              borderRadius: "11px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <span style={{ fontSize: "8px", fontWeight: "800", color: "#fff" }}>AI</span>
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: "#22c55e",
                      boxShadow: "0 0 4px #22c55e",
                      top: "-6px",
                      left: `${4 + index * 3}px`,
                      opacity: aiRespondingDot === index ? 1 : 0.28,
                      transition: `opacity ${scaleMs(220)}ms ease`,
                    }}
                  />
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "10px", fontWeight: "700", color: textPrimary, display: "block" }}>
                  Automation conversation
                </span>
                <span style={{ fontSize: "8px", color: textMuted }}>{currentMode.label} workflow</span>
              </div>
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: "800",
                  color: "#22c55e",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  padding: "2px 7px",
                  borderRadius: "8px",
                  flexShrink: 0,
                }}
              >
                Live
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                justifyContent: "flex-end",
                opacity: fadingOut ? 0.45 : 1,
                transition: `opacity ${scaleMs(420)}ms ease`,
                minHeight: 0,
              }}
            >
              {currentMode.messages.slice(0, visibleMessages).map((message, index) => {
                const isAi = message.role === "ai";
                const isSystem = message.role === "system";
                return (
                  <div
                    key={`${activeMode}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: isSystem ? "center" : isAi ? "flex-start" : "flex-end",
                      animation: `sIn ${scaleMs(300)}ms ease-out`,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: isSystem ? "92%" : "82%",
                        padding: isSystem ? "5px 8px" : "5px 8px",
                        borderRadius: isSystem ? "999px" : isAi ? "3px 9px 9px 9px" : "9px 3px 9px 9px",
                        background: isSystem
                          ? "rgba(99,102,241,0.08)"
                          : isAi
                            ? "linear-gradient(135deg,#22c55e,#16a34a)"
                            : "#e8e4de",
                        fontSize: isSystem ? "8px" : "9px",
                        lineHeight: 1.45,
                        color: isSystem ? "#4f46e5" : isAi ? "#fff" : textPrimary,
                        boxShadow: isAi ? "0 2px 8px rgba(34,197,94,0.18)" : "none",
                        border: isSystem ? "1px solid rgba(99,102,241,0.12)" : "none",
                        textAlign: isSystem ? "center" : "left",
                      }}
                    >
                      {message.text}
                    </div>
                  </div>
                );
              })}
              {showTyping && <TypingDots />}
            </div>
          </div>
        </div>

        <div
          style={{
            background: cardBackground,
            border: `1px solid ${cardBorder}`,
            borderRadius: "11px",
            padding: "10px 12px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "7px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: "700",
                color: textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              What happens automatically
            </span>
            <span style={{ fontSize: "8px", color: textMuted }}>1 / 2 / 3</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
            {currentMode.steps.map((step, index) => {
              const isActive = index <= freshStep;
              return (
                <div
                  key={step}
                  style={{
                    padding: "7px 8px",
                    borderRadius: "9px",
                    background: isActive ? "rgba(34,197,94,0.12)" : sectionBackground,
                    border: isActive ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(0,0,0,0.04)",
                    transition: `background ${scaleMs(220)}ms ease, border-color ${scaleMs(220)}ms ease`,
                  }}
                >
                  <div style={{ fontSize: "8px", color: isActive ? "#15803d" : textMuted, marginBottom: "3px", fontWeight: "800" }}>
                    STEP {index + 1}
                  </div>
                  <div style={{ fontSize: "9px", color: textPrimary, lineHeight: 1.35, fontWeight: "600" }}>
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "20px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "32%",
            height: "4px",
            borderRadius: "9999px",
            background: "rgba(26,18,9,0.18)",
          }}
        />
      </div>

      <style>{`
        @keyframes hPulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
        @keyframes sIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes typingDot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4 } 30% { transform: translateY(-3px); opacity: 1 } }
        @keyframes rippleOut { from { transform: scale(0); opacity: 1; } to { transform: scale(3); opacity: 0; } }
      `}</style>
    </div>
  );
}