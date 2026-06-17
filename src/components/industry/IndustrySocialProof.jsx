import { Star } from 'lucide-react';

export default function IndustrySocialProof({ industryName, placeholder }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-titles text-[#001B44] text-3xl md:text-4xl font-bold mb-4">Trusted by {industryName} Leaders</h2>
        <p className="text-muted-foreground text-lg">
          See how practices like yours use ClientSurge to automate lead response and grow revenue
        </p>
      </div>

      {/* Testimonial slots (3-card layout) */}
      <div className="grid md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-8 rounded-xl border-2 border-dashed border-border bg-card/50 text-center"
          >
            {/* Rating stars */}
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, idx) => (
                <Star key={idx} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            {/* Placeholder quote */}
            <p className="text-muted-foreground mb-6 italic min-h-[80px]">
              "[Testimonial #{i} coming from {industryName} client]"
            </p>

            {/* Client info */}
            <div>
              <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-3" />
              <p className="font-semibold text-foreground">Client Name</p>
              <p className="text-sm text-muted-foreground">{industryName} Practice</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stat bar */}
      <div className="mt-16 grid grid-cols-3 gap-8 p-8 rounded-xl bg-primary/5 border border-primary/20">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">450+</div>
          <p className="text-sm text-muted-foreground">Practices Automated</p>
        </div>
        <div className="text-center border-l border-r border-primary/20">
          <div className="text-3xl font-bold text-primary mb-2">$12M+</div>
          <p className="text-sm text-muted-foreground">Revenue Recovered</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">98%</div>
          <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
        </div>
      </div>
    </div>
  );
}