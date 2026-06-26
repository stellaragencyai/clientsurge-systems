/**
 * Empty State Component — standardized empty/no-data display.
 * Fixes FLAW #58: Unstyled empty states across the app.
 */
import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon, title = "Nothing here yet", description = "", action = null, className = "" }) {
  const FinalIcon = Icon || Inbox;
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <FinalIcon className="w-8 h-8 text-muted-foreground/50" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}