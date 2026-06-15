export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100svh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "clamp(6rem, 12vw, 10rem) clamp(1.5rem, 5vw, 3rem)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
            fontWeight: "900",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            margin: "0",
          }}
        >
          Turn missed calls and leads into booked jobs automatically.
        </h1>
        <p style={{ 
          fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)", 
          lineHeight: 1.4, 
          color: "rgba(255,255,255,0.8)", 
          marginTop: "1rem",
          maxWidth: "700px",
          margin: "1rem auto 0"
        }}>
          AI responds instantly. Follows up automatically. Books appointments. Never lose revenue again.
        </p>
      </div>
    </section>
  );
}