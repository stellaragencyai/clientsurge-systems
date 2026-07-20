/**
 * AdminGlobalSearch.jsx - Phase F universal search surface.
 * Searches customers, leads, opportunities, appointments, conversations,
 * AI workers, timeline events, settings, billing, and documents through one result contract.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Search, X } from "lucide-react";
import {
  buildAdminGlobalSearchResponse,
  getAdminGlobalSearchPlaceholder,
  loadAdminGlobalSearchRecords,
} from "@/lib/adminGlobalSearch";

const ENTITY_COLORS = {
  customer: "#00FFB3",
  lead: "#00D4FF",
  opportunity: "#F97316",
  appointment: "#22C55E",
  conversation: "#F59E0B",
  ai_worker: "#A78BFA",
  timeline_event: "#38BDF8",
  setting: "#64748B",
  billing: "#10B981",
  document: "#FB7185",
};

const RESULT_STATE_COPY = {
  loading: "Searching...",
  "partial-results": "Partial results available",
  "permission-restricted": "Permission restricted",
  "no-results": "No results found",
  error: "Search is unavailable",
};

function toSearchUiStatus(platformStatus) {
  if (platformStatus === "Partial Results") return "partial-results";
  if (platformStatus === "Permission Restricted") return "permission-restricted";
  if (platformStatus === "No Results") return "no-results";
  return "results";
}

export default function AdminGlobalSearch({ onSelect, onNavigate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const debounce = useRef(null);

  const handleSelect = (result) => {
    onSelect?.(result);
    if (result.tab) onNavigate?.(result.tab, result);
    navigate(result.destination || "/admin");
  };

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setStatus("idle");
      return undefined;
    }

    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setStatus("loading");
      try {
        const searchRecords = await loadAdminGlobalSearchRecords(base44);
        const searchResponse = buildAdminGlobalSearchResponse(
          searchRecords.recordsBySource,
          query,
          10,
          { sourceStatuses: searchRecords.sourceStatuses, user },
        );

        setResults(searchResponse.results);
        setStatus(toSearchUiStatus(searchResponse.status));
      } catch {
        setResults([]);
        setStatus("error");
      }
    }, 280);

    return () => clearTimeout(debounce.current);
  }, [query, user]);

  const showMenu = status !== "idle";

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px" }}>
        <Search style={{ width: 14, height: 14, color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={getAdminGlobalSearchPlaceholder()}
          aria-label="Universal admin search"
          aria-expanded={showMenu}
          style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, flex: 1 }}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults([]);
              setStatus("idle");
            }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        )}
      </div>

      {showMenu && (
        <div
          role="listbox"
          aria-label="Universal search results"
          style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#0D1B2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100, overflow: "hidden" }}
        >
          {status !== "results" && (
            <div role="status" aria-live="polite" style={{ padding: "10px 14px", color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
              {RESULT_STATE_COPY[status]}
            </div>
          )}
          {results.map((result) => {
            const color = ENTITY_COLORS[result.type] || "#94A3B8";
            return (
              <button
                key={`${result.type}-${result.id || result.destination}`}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  handleSelect(result);
                  setQuery("");
                  setResults([]);
                  setStatus("idle");
                }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "transparent", textAlign: "left" }}
                onMouseEnter={(event) => (event.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
              >
                <span style={{ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: 9999, padding: "1px 7px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {result.type.replace("_", " ")}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: "#fff", fontSize: 12, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.title}</p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {result.owner} - {result.timestamp}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
