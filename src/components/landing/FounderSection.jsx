import { useState } from "react";

export default function FounderSection() {
  const [photoUnavailable, setPhotoUnavailable] = useState(false);

  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Built by someone who actually gets it</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            Meet the Founder
          </h2>
        </div>

        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #fefdfb 100%)",
            border: "1.5px solid rgba(154,92,46,0.25)",
            boxShadow: "0 20px 60px rgba(120,70,20,0.10), 0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div className="grid md:grid-cols-2 gap-0 items-stretch">
            <div
              className="relative flex items-center justify-center p-10 md:p-12"
              style={{ background: "linear-gradient(135deg, rgba(154,92,46,0.06) 0%, rgba(200,150,92,0.04) 100%)" }}
            >
              {photoUnavailable ? (
                <div
                  className="w-64 h-72 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center px-8"
                  style={{
                    border: "2px solid rgba(154,92,46,0.2)",
                    boxShadow: "0 8px 32px rgba(120,70,20,0.12)",
                    background: "linear-gradient(135deg, #f9efe1 0%, #fffaf3 100%)",
                  }}
                  aria-label="Nolan Strommer founder profile"
                >
                  <div
                    className="mb-5 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold"
                    style={{
                      background: "linear-gradient(135deg, #9a5c2e 0%, #c9945c 100%)",
                      color: "#ffffff",
                      boxShadow: "0 10px 26px rgba(120,70,20,0.18)",
                    }}
                  >
                    NS
                  </div>
                  <p className="text-sm font-semibold text-foreground">Founder photo pending</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Launch-safe placeholder until the approved founder image is added.
                  </p>
                </div>
              ) : (
                <div
                  className="w-64 h-72 rounded-2xl overflow-hidden"
                  style={{ border: "2px solid rgba(154,92,46,0.2)", boxShadow: "0 8px 32px rgba(120,70,20,0.12)" }}
                >
                  <img
                    src="/founder-photo.jpg"
                    onError={() => setPhotoUnavailable(true)}
                    alt="Nolan Strommer, founder of ClientSurge Systems"
                    width="400"
                    height="480"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center p-10 md:p-12">
              <h3 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-5 leading-tight">
                I am Nolan, founder of ClientSurge Systems
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                I built this after watching local businesses spend thousands attracting leads and lose too many opportunities to slow follow-up. Every system is custom, done-for-you, and measured against clear launch goals after onboarding.
              </p>
              <div className="pt-6" style={{ borderTop: "1px solid rgba(154,92,46,0.2)" }}>
                <p className="text-sm font-semibold" style={{ color: "#9a5c2e" }}>
                  Nolan, Founder | ClientSurge Systems | Phoenix, AZ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
