import { useState } from "react";

export default function FounderSection() {
  const [photoUnavailable, setPhotoUnavailable] = useState(true);

  return (
    <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Built by someone who actually gets it</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            Meet the Founder
          </h2>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
            border: "1.5px solid rgba(0,174,239,0.18)",
            boxShadow: "0 20px 60px rgba(0,59,143,0.08), 0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div className="grid md:grid-cols-2 gap-0 items-stretch">
            <div
              className="relative flex items-center justify-center p-10 md:p-12"
              style={{ background: "linear-gradient(135deg, rgba(0,174,239,0.08) 0%, rgba(0,59,143,0.05) 100%)" }}
            >
              {photoUnavailable ? (
                <div
                  className="w-64 h-72 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center px-8"
                  style={{
                    border: "2px solid rgba(0,174,239,0.18)",
                    boxShadow: "0 8px 32px rgba(0,59,143,0.12)",
                    background: "linear-gradient(135deg, #eff8ff 0%, #ffffff 100%)",
                  }}
                  aria-label="Nolan Strommer founder profile"
                >
                  <div
                    className="mb-5 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold"
                    style={{
                      background: "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)",
                      color: "#ffffff",
                      boxShadow: "0 10px 26px rgba(0,59,143,0.18)",
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
                  style={{ border: "2px solid rgba(0,174,239,0.18)", boxShadow: "0 8px 32px rgba(0,59,143,0.12)" }}
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
              <div className="pt-6" style={{ borderTop: "1px solid rgba(0,174,239,0.18)" }}>
                <p className="text-sm font-semibold text-primary">
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
