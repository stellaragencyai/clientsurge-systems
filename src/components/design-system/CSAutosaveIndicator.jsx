import { CheckCircle2, Loader2 } from "lucide-react";

export default function CSAutosaveIndicator({ status = "", saving = false }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
      {saving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          Saving changes...
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          {status || "Changes saved"}
        </>
      )}
    </div>
  );
}
