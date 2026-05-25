import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles } from "lucide-react";

function formatDate(value) {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const CATEGORY_LABELS = {
  new_feature: "New Feature",
  improvement: "Improvement",
  bug_fix: "Bug Fix",
  announcement: "Announcement",
};

export default function PortalWhatsNew() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const records = await base44.entities.Changelog.filter({ is_published: true }, "-date", 20);
        if (!mounted) return;
        setEntries(records || []);
        setError("");
      } catch (err) {
        if (!mounted) return;
        setEntries([]);
        setError(err?.message || "Unable to load changelog updates right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading recent updates...
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
        No published product updates yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <article key={entry.id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              {CATEGORY_LABELS[entry.category] || "Update"}
            </span>
            {entry.version ? (
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {entry.version}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-foreground">{entry.title}</h3>
          {entry.description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {entry.description}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
