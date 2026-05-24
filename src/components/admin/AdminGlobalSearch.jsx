/**
 * AdminGlobalSearch.jsx — #46 / #271
 * Searches canonical Leads, ClientProject, Order, and SupportMessage entities.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, X } from "lucide-react";
import {
  buildAdminGlobalSearchResults,
  getAdminGlobalSearchPlaceholder,
} from "@/lib/adminGlobalSearch";

const ENTITY_COLORS = {
  lead: "#00D4FF",
  client: "#00FFB3",
  order: "#A78BFA",
  support: "#00AEEF",
};

export default function AdminGlobalSearch({ onSelect, onNavigate }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);

  const handleSelect = (result) => {
    onSelect?.(result);

    if (result.type === "lead") {
      onNavigate?.("leads", result);
      navigate(`/admin/leads/${result.id}`);
      return;
    }

    if (result.type === "order") {
      onNavigate?.("client-projects", result);
      navigate(`/admin?tab=client-projects&order=${result.id}`);
      return;
    }

    if (result.type === "support") {
      onNavigate?.("inbox", result);
      navigate(`/admin?tab=inbox&message=${result.id}`);
      return;
    }

    onNavigate?.("client-projects", result);
    navigate(`/admin?tab=client-projects&client=${result.id}`);
  };

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [leads, clients, legacyClients, orders, supportMessages] = await Promise.all([
          base44.entities.Leads.list("-created_date", 200),
          base44.entities.ClientProject.list("-created_date", 200).catch(() => []),
          base44.entities.Client.list("-created_date", 200).catch(() => []),
          base44.entities.Order.list("-created_date", 200),
          base44.entities.SupportMessage.list("-created_date", 200),
        ]);

        setResults(
          buildAdminGlobalSearchResults(
            {
              lead: leads,
              client: [...(clients || []), ...(legacyClients || [])],
              order: orders,
              support: supportMessages,
            },
            query,
          ).slice(0, 10),
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(debounce.current);
  }, [query]);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px" }}>
        <Search style={{ width: 14, height: 14, color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={getAdminGlobalSearchPlaceholder()}
          style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, flex: 1 }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        )}
      </div>

      {(results.length > 0 || loading) && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#0D1B2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100, overflow: "hidden" }}>
          {loading && <div style={{ padding: "10px 14px", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Searching...</div>}
          {results.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => {
                handleSelect(result);
                setQuery("");
                setResults([]);
              }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={(event) => (event.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(event) => (event.currentTarget.style.background = "none")}
            >
              <span style={{ background: `${ENTITY_COLORS[result.type]}15`, color: ENTITY_COLORS[result.type], border: `1px solid ${ENTITY_COLORS[result.type]}30`, borderRadius: 9999, padding: "1px 7px", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>
                {result.type}
              </span>
              <div>
                <p style={{ color: "#fff", fontSize: 12, fontWeight: 500, margin: 0 }}>{result.label}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0 }}>{result.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
