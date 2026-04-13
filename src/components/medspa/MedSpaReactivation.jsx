import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function MedSpaReactivation() {
  return (
    <section className="py-20 md:py-28 px-6 bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold text-[#A8874A] tracking-widest uppercase mb-4">
              Recover Lost Revenue
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1C1C] leading-snug mb-6">
              Turn Old Leads Into New Revenue
            </h2>
            <p className="text-[#6B6B6B] text-base leading-relaxed mb-6">
              You've spent money getting people through your funnel. Most of them never booked — but they were interested. They still might be.
            </p>
            <p className="text-[#6B6B6B] text-base leading-relaxed mb-8">
              We send targeted reactivation campaigns to your dormant leads — the right message, at the right time — and convert past inquiries into new consultations.
            </p>
            <a href="#medspa-cta">
              <Button className="rounded-full px-8 h-11 text-sm font-semibold gap-2 bg-[#A8874A] hover:bg-[#8f7040] text-white">
                Get Your Leads Working Again
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="space-y-4">
            {[
              {
                label: "Old inquiry from 3 months ago",
                message: "Hi! We noticed you inquired about our Botox treatment a while back. We have some availability this week — would you like to schedule a free consultation?",
                type: "outbound",
              },
              {
                label: "Lead responds",
                message: "Yes actually — I've been meaning to book! What times do you have?",
                type: "inbound",
              },
              {
                label: "Booking confirmed",
                message: "✓ Consultation booked — Thursday 2:00 PM",
                type: "system",
              },
            ].map((item, i) => (
              <div key={i}>
                {item.type === "system" ? (
                  <div className="text-center">
                    <span className="inline-block text-xs text-[#A8874A] bg-[#A8874A]/10 px-4 py-1.5 rounded-full font-medium">
                      {item.message}
                    </span>
                  </div>
                ) : (
                  <div className={`flex flex-col ${item.type === "outbound" ? "items-start" : "items-end"}`}>
                    <span className="text-[10px] text-[#9B9B9B] mb-1 px-1">{item.label}</span>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        item.type === "outbound"
                          ? "bg-white border border-[#EDE8DF] text-[#1C1C1C] rounded-bl-md"
                          : "bg-[#1C1C1C] text-white rounded-br-md"
                      }`}
                    >
                      {item.message}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}