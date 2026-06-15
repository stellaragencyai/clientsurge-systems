import { TrendingUp, Target, DollarSign } from 'lucide-react';

export default function RevenueProofBlock({ industryLoss, leadsRecovered = null, bookingsGenerated = null }) {
  return (
    <div className="w-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/15 rounded-lg overflow-hidden my-8 md:my-12">
      <div className="px-6 md:px-8 py-8 md:py-10">
        <p className="text-xs font-bold tracking-widest uppercase text-primary mb-6">
          The Revenue Problem
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {/* Revenue Loss */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-destructive" />
              <span className="text-xs font-semibold text-destructive">Monthly Loss</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              ${Math.round(industryLoss / 1000)}K
            </p>
            <p className="text-xs text-muted-foreground mt-1">from missed calls</p>
          </div>

          {/* Leads Recoverable */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Recoverable</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {leadsRecovered || '~8-12'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">leads/month</p>
          </div>

          {/* Revenue Impact */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-600">Annual Impact</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              ${Math.round((industryLoss * 12) / 1000)}K+
            </p>
            <p className="text-xs text-muted-foreground mt-1">recovery potential</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-6 pt-6 border-t border-primary/10">
          These numbers are <strong>conservative estimates</strong> based on industry averages. Your actual recovery could be significantly higher.
        </p>
      </div>
    </div>
  );
}