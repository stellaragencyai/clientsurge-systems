import { MessageSquare, Phone, Calendar, Zap, TrendingUp, CheckCircle, Clock, MessageCircle, RotateCcw } from 'lucide-react';

const ICON_MAP = {
  MessageSquare,
  Phone,
  Calendar,
  Zap,
  TrendingUp,
  CheckCircle,
  Clock,
  MessageCircle,
  RotateCcw,
};

export default function IndustrySolution({ features }) {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {features.map((feature, idx) => {
        const Icon = ICON_MAP[feature.icon] || MessageSquare;
        return (
          <div
            key={idx}
            className="p-8 rounded-xl border border-border bg-background hover:border-primary/50 hover:shadow-lg transition-all"
          >
            <div className="mb-4">
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-7 h-7 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}