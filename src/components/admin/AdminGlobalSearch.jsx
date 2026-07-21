/**
 * AdminGlobalSearch.jsx - Phase F universal search surface.
 * Searches customers, leads, opportunities, appointments, conversations,
 * AI workers, timeline events, settings, billing, and documents through one result contract.
 */
import { useState, useEffect, useRef, useId } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Search, X } from "lucide-react";
import {
  buildAdminGlobalSearchResponse,
  getAdminGlobalSearchPlaceholder,
  loadAdminGlobalSearchRecords,
} from "@/lib/adminGlobalSearch";

const ENTITY_TONES = {
  customer: { color: "#047857", background: "#ECFDF5", border: "#A7F3D0" },
  lead: { color: "#0369A1", background: "#F0F9FF", border: "#BAE6FD" },
  opportunity: { color: "#C2410C", background: "#FFF7ED", border: "#FED7AA" },
  appointment: { color: "#047857", background: "#ECFDF5", border: "#A7F3D0" },
  conversation: { color: "#92400E", background: "#FFFBEB", border: "#FDE68A" },
  ai_worker: { color: "#6D28D9", background: "#F5F3FF", border: "#DDD6FE" },
  timeline_event: { color: "#0369A1", background: "#F0F9FF", border: "#BAE6FD" },
  setting: { color: "#475569", background: "#F8FAFC", border: "#CBD5E1" },
  billing: { color: "#047857", background: "#ECFDF5", border: "#A7F3D0" },
  document: { color: "#BE123C", background: "#FFF1F2", border: "#FECDD3" },
};

const EMPTY_SEARCH_META = {
  totalMatches: 0,
  permittedCount: 0,
  restrictedCount: 0,
  truncated: false,
};

const MIN_QUERY_LENGTH = 2;

function toSearchUiStatus(platformStatus) {
  if (platformStatus === "Partial Results") return "partial-results";
  if (platformStatus === "Permission Restricted") return "permission-restricted";
  if (platformStatus === "No Results") return "no-results";
  return "results";
}

function normalizeTypeLabel(type) {
  return String(type || "result").replace(/_/g, " ");
}

function resultCountLabel(count) {
  return `${count} ${count === 1 ? "result" : "results"}`;
}

function buildStatusMessage(status, results, meta) {
  const count = results.length;

  if (status === "loading") return "Searching admin records.";
  if (status === "error") return "Search is unavailable. Try again or use navigation.";
  if (status === "no-results") return "No results found. Try another customer, lead, appointment, or setting.";
  if (status === "permission-restricted") {
    const restricted = meta.restrictedCount || meta.totalMatches || 0;
    return `${resultCountLabel(restricted)} matched but are permission restricted for this user.`;
  }
  if (status === "partial-results") {
    return `${resultCountLabel(count)} available. Some sources are unavailable or additional matches are hidden. Use arrow keys to review results.`;
  }
  if (status === "results") {
    return `${resultCountLabel(count)} available. Use arrow keys to review results, Enter to open one, and Escape to close search.`;
  }
  return "";
}

export default function AdminGlobalSearch({ onSelect, onNavigate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = `admin-global-search-${reactId}-input`;
  const resultsId = `admin-global-search-${reactId}-results`;
  const statusId = `admin-global-search-${reactId}-status`;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [searchMeta, setSearchMeta] = useState(EMPTY_SEARCH_META);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounce = useRef(null);
  const inputRef = useRef(null);

  const handleSelect = (result) => {
    onSelect?.(result);
    if (result.tab) onNavigate?.(result.tab, result);
    navigate(result.destination || "/admin");
  };

  const resetSearch = () => {
    setQuery("");
    setResults([]);
    setStatus("idle");
    setSearchMeta(EMPTY_SEARCH_META);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const selectResult = (result) => {
    if (!result) return;
    handleSelect(result);
    resetSearch();
  };

  useEffect(() => {
    if (!query || query.length < MIN_QUERY_LENGTH) {
      clearTimeout(debounce.current);
      setResults([]);
      setStatus("idle");
      setSearchMeta(EMPTY_SEARCH_META);
      setIsOpen(false);
      setActiveIndex(-1);
      return undefined;
    }

    clearTimeout(debounce.current);
    setIsOpen(true);
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
        setSearchMeta({
          totalMatches: searchResponse.totalMatches,
          permittedCount: searchResponse.permittedCount,
          restrictedCount: searchResponse.restrictedCount,
          truncated: searchResponse.truncated,
        });
        setActiveIndex(searchResponse.results.length > 0 ? 0 : -1);
        setIsOpen(true);
      } catch {
        setResults([]);
        setStatus("error");
        setSearchMeta(EMPTY_SEARCH_META);
        setActiveIndex(-1);
        setIsOpen(true);
      }
    }, 280);

    return () => clearTimeout(debounce.current);
  }, [query, user]);

  const showMenu = isOpen && status !== "idle";
  const hasResults = results.length > 0;
  const validActiveIndex = hasResults && activeIndex >= 0 && activeIndex < results.length ? activeIndex : -1;
  const statusMessage = showMenu ? buildStatusMessage(status, results, searchMeta) : "";
  const activeDescendant = validActiveIndex >= 0 ? `${resultsId}-option-${validActiveIndex}` : undefined;

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && showMenu) {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!hasResults) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(results.length - 1);
      return;
    }

    if (event.key === "Enter" && showMenu && validActiveIndex >= 0) {
      event.preventDefault();
      selectResult(results[validActiveIndex]);
    }
  };

  return (
    <div
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocused(false);
          setIsOpen(false);
          setActiveIndex(-1);
        }
      }}
      style={{ position: "relative", width: "100%", maxWidth: 400 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#F8FAFC",
          border: `1px solid ${isFocused ? "#0284C7" : "#CBD5E1"}`,
          borderRadius: 10,
          padding: "8px 12px",
          boxShadow: isFocused ? "0 0 0 3px rgba(14, 165, 233, 0.18)" : "none",
        }}
      >
        <Search aria-hidden="true" focusable="false" style={{ width: 14, height: 14, color: "#475569", flexShrink: 0 }} />
        <input
          ref={inputRef}
          id={inputId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (query.length >= MIN_QUERY_LENGTH && status !== "idle") setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={getAdminGlobalSearchPlaceholder()}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-label="Universal admin search"
          aria-expanded={showMenu}
          aria-haspopup="listbox"
          aria-controls={showMenu ? resultsId : undefined}
          aria-activedescendant={activeDescendant}
          aria-describedby={statusMessage ? statusId : undefined}
          className="min-w-0 flex-1 placeholder:text-slate-500"
          style={{ background: "none", border: "none", outline: "none", color: "#0F172A", fontSize: 13 }}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              resetSearch();
              inputRef.current?.focus();
            }}
            onFocus={() => setIsFocused(true)}
            style={{ background: "none", border: "none", borderRadius: 6, cursor: "pointer", color: "#334155", padding: 2 }}
          >
            <X aria-hidden="true" focusable="false" style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {showMenu && (
        <div
          style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 10, boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)", zIndex: 100, overflow: "hidden" }}
        >
          {statusMessage && (
            <div id={statusId} role="status" aria-live="polite" style={{ padding: "10px 14px", color: "#334155", fontSize: 12, borderBottom: hasResults ? "1px solid #E2E8F0" : "none" }}>
              {statusMessage}
            </div>
          )}
          <div id={resultsId} role="listbox" aria-label="Universal search results" style={{ maxHeight: hasResults ? 360 : 0, overflowY: "auto" }}>
            {results.map((result, index) => {
              const tone = ENTITY_TONES[result.type] || ENTITY_TONES.setting;
              const active = index === validActiveIndex;
              const typeLabel = normalizeTypeLabel(result.type);
              return (
                <div
                  key={`${result.type}-${result.id || result.destination}`}
                  id={`${resultsId}-option-${index}`}
                  role="option"
                  aria-selected={active}
                  aria-label={`${typeLabel} result: ${result.title}. Owner ${result.owner}. Destination ${result.destination}. Updated ${result.timestamp}.`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectResult(result);
                  }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #F1F5F9", background: active ? "#E0F2FE" : "#FFFFFF", textAlign: "left" }}
                >
                  <span style={{ background: tone.background, color: tone.color, border: `1px solid ${tone.border}`, borderRadius: 9999, padding: "1px 7px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {typeLabel}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: "#0F172A", fontSize: 12, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.title}</p>
                    <p style={{ color: "#475569", fontSize: 10, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {result.owner} - {result.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
