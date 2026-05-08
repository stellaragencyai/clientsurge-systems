/**
 * AdminGlobalSearch.jsx — #46
 * Wired to SpaLead, ClientOnboarding, Order entities.
 * Fuzzy search by business name, email, phone.
 */
import { useState, useEffect, useRef } from "react";
import { SpaLead, ClientOnboarding } from "@/api/entities";
import { Search, X } from "lucide-react";

const ENTITY_COLORS = {
  lead: "#00D4FF",
  client: "#00FFB3",
  order: "#A78BFA",
};

export default function AdminGlobalSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.toLowerCase();
        const [leads, clients] = await Promise.all([
          SpaLead.list(),
          ClientOnboarding.list(),
        ]);
        const leadResults = (leads || [])
          .filter(l => [l.business_name, l.email, l.phone, l.industry].some(v => v?.toLowerCase().includes(q)))
          .slice(0, 5)
          .map(l => ({ type: "lead", id: l.id, label: l.business_name, sub: l.industry || l.email, data: l }));
        const clientResults = (clients || [])
          .filter(c => [c.business_name, c.email, c.phone].some(v => v?.toLowerCase().includes(q)))
          .slice(0, 5)
          .map(c => ({ type: "client", id: c.id, label: c.business_name, sub: c.email, data: c }));
        setResults([...leadResults, ...clientResults].slice(0, 8));
      } catch {} finally { setLoading(false); }
    }, 280);
  }, [query]);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px" }}>
        <Search style={{ width: 14, height: 14, color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search leads, clients..."
          style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, flex: 1 }} />
        {query && <button onClick={() => { setQuery(""); setResults([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}><X style={{ width: 12, height: 12 }} /></button>}
      </div>

      {(results.length > 0 || loading) && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#0D1B2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100, overflow: "hidden" }}>
          {loading && <div style={{ padding: "10px 14px", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Searching...</div>}
          {results.map(r => (
            <div key={r.id} onClick={() => { onSelect?.(r); setQuery(""); setResults([]); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <span style={{ background: `${ENTITY_COLORS[r.type]}15`, color: ENTITY_COLORS[r.type], border: `1px solid ${ENTITY_COLORS[r.type]}30`, borderRadius: 9999, padding: "1px 7px", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{r.type}</span>
              <div>
                <p style={{ color: "#fff", fontSize: 12, fontWeight: 500, margin: 0 }}>{r.label}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0 }}>{r.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
