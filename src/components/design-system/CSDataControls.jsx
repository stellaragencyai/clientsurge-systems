import React from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { CSButton } from "./CSProductPrimitives";
import "@/styles/clientsurge-os-data-controls.css";

const cx = (...values) => values.filter(Boolean).join(" ");

export function CSSearchField({ value, onChange, onClear, placeholder = "Search", label = "Search", className, ...props }) {
  return (
    <label className={cx("cs-search-field", className)}>
      <span className="cs-visually-hidden">{label}</span>
      <Search aria-hidden="true" />
      <input type="search" value={value} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} {...props} />
      {value ? <button type="button" onClick={() => { onChange?.(""); onClear?.(); }} aria-label="Clear search"><X aria-hidden="true" /></button> : null}
    </label>
  );
}

export function CSFilterBar({ children, activeCount = 0, onClear, actions, className }) {
  return (
    <div className={cx("cs-filter-bar", className)}>
      <div className="cs-filter-bar__label"><SlidersHorizontal aria-hidden="true" /><span>Filters</span>{activeCount > 0 ? <span className="cs-filter-bar__count">{activeCount}</span> : null}</div>
      <div className="cs-filter-bar__controls">{children}</div>
      <div className="cs-filter-bar__actions">{activeCount > 0 && onClear ? <button type="button" onClick={onClear}>Clear all</button> : null}{actions}</div>
    </div>
  );
}

export function CSSelectFilter({ label, value, options, onChange, className }) {
  return (
    <label className={cx("cs-select-filter", className)}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange?.(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function CSPagination({ page, pageCount, onPageChange, totalItems, pageSize, className }) {
  const safePage = Math.min(Math.max(page, 1), Math.max(pageCount, 1));
  const firstItem = totalItems === 0 ? 0 : ((safePage - 1) * pageSize) + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((candidate) => candidate === 1 || candidate === pageCount || Math.abs(candidate - safePage) <= 1);
  return (
    <nav className={cx("cs-pagination", className)} aria-label="Pagination">
      <p>{totalItems === undefined ? `Page ${safePage} of ${pageCount}` : `Showing ${firstItem}–${lastItem} of ${totalItems}`}</p>
      <div className="cs-pagination__controls">
        <CSButton variant="secondary" size="sm" disabled={safePage <= 1} onClick={() => onPageChange?.(safePage - 1)} aria-label="Previous page"><ChevronLeft aria-hidden="true" /> Previous</CSButton>
        <div className="cs-pagination__pages">
          {pages.map((candidate, index) => {
            const previous = pages[index - 1];
            return <React.Fragment key={candidate}>{previous && candidate - previous > 1 ? <span aria-hidden="true">…</span> : null}<button type="button" aria-current={candidate === safePage ? "page" : undefined} onClick={() => onPageChange?.(candidate)}>{candidate}</button></React.Fragment>;
          })}
        </div>
        <CSButton variant="secondary" size="sm" disabled={safePage >= pageCount} onClick={() => onPageChange?.(safePage + 1)} aria-label="Next page">Next <ChevronRight aria-hidden="true" /></CSButton>
      </div>
    </nav>
  );
}
