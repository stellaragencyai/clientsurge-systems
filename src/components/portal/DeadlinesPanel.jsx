import { AlertCircle, Calendar, CheckCircle2, Clock, FileText, Zap } from 'lucide-react';

const CATEGORY_CONFIG = {
  setup: { icon: Zap, color: 'bg-blue-50 border-blue-200 text-blue-700', label: 'Setup' },
  payment: { icon: FileText, color: 'bg-amber-50 border-amber-200 text-amber-700', label: 'Payment' },
  testing: { icon: Clock, color: 'bg-purple-50 border-purple-200 text-purple-700', label: 'Testing' },
  launch: { icon: AlertCircle, color: 'bg-green-50 border-green-200 text-green-700', label: 'Launch' },
};

export default function DeadlinesPanel({ project }) {
  const deadlines = project?.deadlines || [];
  
  if (deadlines.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold text-foreground">No Deadlines Yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Milestones will appear here as your project progresses.</p>
      </div>
    );
  }

  const upcoming = deadlines.filter(d => d.status !== 'completed').sort((a, b) => {
    const aDate = new Date(a.due_date).getTime();
    const bDate = new Date(b.due_date).getTime();
    return aDate - bDate;
  });

  const completed = deadlines.filter(d => d.status === 'completed');

  const getDaysUntil = (dateStr) => {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'overdue';
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    return `${days}d away`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Calendar className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Deadlines */}
      {upcoming.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {upcoming.map(deadline => {
              const config = CATEGORY_CONFIG[deadline.category];
              const daysUntil = getDaysUntil(deadline.due_date);
              const isOverdue = new Date(deadline.due_date).getTime() < Date.now();

              return (
                <div
                  key={deadline.id}
                  className={`rounded-xl border-2 p-5 transition-all ${
                    isOverdue
                      ? 'border-red-300 bg-red-50/40'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(deadline.status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h4 className="font-semibold text-foreground">{deadline.title}</h4>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold flex-shrink-0 ${config.color} border`}>
                          {config.label}
                        </span>
                      </div>

                      {deadline.description && (
                        <p className="text-sm text-muted-foreground mb-2">{deadline.description}</p>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(deadline.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className={`text-xs font-bold ${
                          isOverdue ? 'text-red-700' : 'text-amber-700'
                        }`}>
                          {daysUntil}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Deadlines */}
      {completed.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">Completed</h3>
          <div className="space-y-2">
            {completed.map(deadline => (
              <div key={deadline.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50/30 text-green-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{deadline.title}</p>
                  <p className="text-xs opacity-75">
                    Completed on{' '}
                    {new Date(deadline.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}