import { Mail, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const statusConfig = {
  sent: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
  delivered: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  opened: { icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50' },
  failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  pending: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50' },
};

export default function EmailHistoryPanel({ emails }) {
  if (!emails || emails.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">No emails sent yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => {
        const config = statusConfig[email.status] || statusConfig.pending;
        const Icon = config.icon;
        const createdDate = new Date(email.created_date);
        const timeStr = createdDate.toLocaleDateString() + ' ' + createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <div key={email.id} className={`border border-border rounded-lg p-4 ${config.bg}`}>
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{email.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">{email.message_body}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="capitalize font-medium">{email.status}</span>
                  <span>•</span>
                  <span>{timeStr}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}