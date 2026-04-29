/**
 * AdminGlobalSearch — Cmd+K search across leads, projects, campaigns.
 * Fix #14
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Users, FolderKanban, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminGlobalSearch({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const [leads, projects, campaigns] = await Promise.all([
        base44.entities.Leads.list("-updated_date", 300),
        base44.entities.ClientProject.list("-created_date", 100),
        base44.entities.NurtureCampaign.list("-enrolled_at", 100),
      ]);
      const lq = q.toLowerCase();
      const matchedLeads = (leads || []).filter(l =>
        l.full_name?.toLowerCase().includes(lq) ||
        l.email?.toLowerCase().includes(lq) ||
        l.phone?.includes(lq) ||
        l.business_name?.toLowerCase().includes(lq)
      ).slice(0, 5).map(l => ({ type: "lead", id: l.id, label: l.full_name, sub: `${l.business_name} · ${l.email || l.phone}`, status: l.status }));

      const matchedProjects = (projects || []).filter(p =>
        p.business_name?.toLowerCase().includes(lq) ||
        p.client_email?.toLowerCase().includes(lq)
      ).slice(0, 3).map(p => ({ type: "project", id: p.id, label: p.business_name, sub: p.client_email }));

      const matchedCampaigns = (campaigns || []).filter(c =>
        c.lead_name?.toLowerCase().includes(lq) ||
        c.lead_email?.toLowerCase().includes(lq)
      ).slice(0, 3).map(c => ({ type: "campaign", id: c.id, label: c.lead_name, sub: c.lead_email, status: c.status }));

      setResults([...matchedLeads, ...matchedProjects, ...matchedCampaigns]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const handleSelect = (result) => {
    setOpen(false);
    if (result.type === "lead") {
      navigate(`/admin/leads/${result.id}`);
    } else if (result.type === "project") {
      onNavigate?.("client-projects");
    } else if (result.type === "campaign") {
      onNavigate?.("nurture");
    }
  };

  const typeIcon = (type) => {
    if (type === "lead") return <Users className="h-3.5 w-3.5" />;
    if (type === "project") return <FolderKanban className="h-3.5 w-3.5" />;
    return <Send className="h-3.5 w-3.5" />;
  };

  const typeLabel = (type) => {
    if (type === "lead") return "Lead";
    if (type === "project") return "Project";
    return "Campaign";
  };

  return (
    <>
      {/* Trigger button in sidebar/topbar */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-[10px] font-mono bg-background border border-border rounded px-1 py-0.5">⌘K</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search leads, projects, campaigns…"
                className="flex-1 text-sm text-foreground bg-transparent outline-none"
              />
              {searching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 && query.trim() && !searching && (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No results for "{query}"</p>
              )}
              {results.length === 0 && !query.trim() && (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">Type to search across leads, projects, and campaigns.</p>
              )}
              {results.map((result, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors border-b border-border last:border-0"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    {typeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{result.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.sub}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {result.status && (
                      <span className="text-[10px] font-semibold bg-muted rounded-full px-2 py-0.5 text-muted-foreground">{result.status}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{typeLabel(result.type)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}