import { Target, TrendingUp, DollarSign, Wrench } from "lucide-react";

const items = [
  { icon: Target, text: "Built for Service Businesses" },
  { icon: TrendingUp, text: "Designed to Increase Conversions" },
  { icon: DollarSign, text: "Focused on Revenue Outcomes" },
  { icon: Wrench, text: "Done-for-You Implementation" },
];

export default function TrustBar() {
  return (
    <section className="py-8 border-y border-border bg-card">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 justify-center">
              <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}