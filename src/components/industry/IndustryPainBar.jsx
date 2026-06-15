import { TrendingDown, AlertCircle } from 'lucide-react';

/**
 * Industry-specific revenue loss calculation block
 * Shows concrete financial impact to grab attention
 */
export default function IndustryPainBar({ config, revenueLoss }) {
  const formattedLoss = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(revenueLoss);

  return (
    <section className="py-16 px-6 bg-destructive/5 border-t border-b border-destructive/20">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main stat */}
          <div className="md:col-span-2">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-12 h-12 text-destructive flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {formattedLoss}
                </h3>
                <p className="text-lg text-muted-foreground">
                  Your estimated monthly revenue loss from missed leads and slow response times.
                </p>
              </div>
            </div>
          </div>

          {/* Key metric */}
          <div className="md:col-span-1 flex flex-col justify-center">
            <div className="text-center p-6 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <span className="text-sm font-semibold text-muted-foreground">Real opportunity cost</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on industry averages for your market
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-primary/10 border border-primary/30 rounded-lg">
          <p className="text-center text-muted-foreground">
            <strong>Recovery opportunity:</strong> Automate your lead response and capture 50% of missed leads within 90 days. That's an extra <strong className="text-foreground">{formattedLoss.replace('$', '$')}/month</strong> in revenue.
          </p>
        </div>
      </div>
    </section>
  );
}