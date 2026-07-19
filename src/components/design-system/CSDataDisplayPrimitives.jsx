import React from "react";
import { ArrowDown, ArrowUp, Clock3, Minus, MoreHorizontal } from "lucide-react";
import { CSStatusBadge } from "./CSProductPrimitives";

const cx = (...values) => values.filter(Boolean).join(" ");

export function CSDataTable({ columns, rows, rowKey = "id", caption, emptyState, loading = false, className }) {
  if (loading) {
    return <CSTableSkeleton columns={columns.length} rows={5} className={className} />;
  }

  if (!rows?.length) {
    return emptyState || <div className="cs-data-empty">No records are available.</div>;
  }

  return (
    <div className={cx("cs-data-table-wrap", className)}>
      <table className="cs-data-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>{columns.map((column) => <th key={column.key} scope="col" className={column.align ? `is-${column.align}` : undefined}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={typeof rowKey === "function" ? rowKey(row) : row[rowKey] ?? rowIndex}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.label} className={column.align ? `is-${column.align}` : undefined}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CSStatusRow({ icon, title, description, status, tone = "neutral", meta, action, className }) {
  return (
    <div className={cx("cs-status-row", className)}>
      {icon ? <span className="cs-status-row__icon" aria-hidden="true">{icon}</span> : null}
      <div className="cs-status-row__content">
        <div className="cs-status-row__title-line">
          <strong>{title}</strong>
          {status ? <CSStatusBadge tone={tone}>{status}</CSStatusBadge> : null}
        </div>
        {description ? <p>{description}</p> : null}
      </div>
      {meta ? <span className="cs-status-row__meta">{meta}</span> : null}
      {action ? <div className="cs-status-row__action">{action}</div> : null}
    </div>
  );
}

export function CSActivityTimeline({ items, className, emptyState }) {
  if (!items?.length) return emptyState || <div className="cs-data-empty">No recent activity.</div>;

  return (
    <ol className={cx("cs-activity-timeline", className)}>
      {items.map((item, index) => (
        <li key={item.id || index} className="cs-activity-item">
          <span className={cx("cs-activity-item__marker", item.tone && `cs-activity-item__marker--${item.tone}`)} aria-hidden="true">{item.icon || <Clock3 />}</span>
          <div className="cs-activity-item__content">
            <div className="cs-activity-item__topline">
              <strong>{item.title}</strong>
              <time dateTime={item.dateTime}>{item.timeLabel}</time>
            </div>
            {item.description ? <p>{item.description}</p> : null}
            {item.meta ? <div className="cs-activity-item__meta">{item.meta}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function CSKPIBlock({ label, value, change, trend = "neutral", helper, icon, actions, className }) {
  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  return (
    <article className={cx("cs-kpi-block", className)}>
      <div className="cs-kpi-block__header">
        <span className="cs-kpi-block__label">{label}</span>
        {icon ? <span className="cs-kpi-block__icon" aria-hidden="true">{icon}</span> : null}
      </div>
      <div className="cs-kpi-block__value-row">
        <strong>{value}</strong>
        {change ? <span className={cx("cs-kpi-block__change", `cs-kpi-block__change--${trend}`)}><TrendIcon aria-hidden="true" />{change}</span> : null}
      </div>
      {helper ? <p>{helper}</p> : null}
      {actions ? <div className="cs-kpi-block__actions">{actions}</div> : null}
    </article>
  );
}

export function CSProgressTracker({ value, max = 100, label, helper, tone = "action", className }) {
  const safeValue = Math.min(Math.max(value, 0), max);
  const percentage = max > 0 ? Math.round((safeValue / max) * 100) : 0;
  return (
    <div className={cx("cs-progress-tracker", className)}>
      <div className="cs-progress-tracker__topline"><span>{label}</span><strong>{percentage}%</strong></div>
      <div className="cs-progress-tracker__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={safeValue}>
        <span className={cx("cs-progress-tracker__fill", `cs-progress-tracker__fill--${tone}`)} style={{ width: `${percentage}%` }} />
      </div>
      {helper ? <p>{helper}</p> : null}
    </div>
  );
}

export function CSChartFrame({ title, description, actions, legend, children, empty = false, emptyState, className }) {
  return (
    <section className={cx("cs-chart-frame", className)}>
      <div className="cs-chart-frame__header">
        <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
        {actions ? <div>{actions}</div> : null}
      </div>
      {legend ? <div className="cs-chart-frame__legend">{legend}</div> : null}
      <div className="cs-chart-frame__body">{empty ? (emptyState || <div className="cs-data-empty">No chart data is available.</div>) : children}</div>
    </section>
  );
}

export function CSDataState({ state = "empty", title, description, action, className }) {
  return (
    <div className={cx("cs-data-state", `cs-data-state--${state}`, className)} role={state === "error" ? "alert" : "status"}>
      <MoreHorizontal aria-hidden="true" />
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function CSTableSkeleton({ columns = 4, rows = 5, className }) {
  return (
    <div className={cx("cs-table-skeleton", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="cs-table-skeleton__row" key={rowIndex} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, columnIndex) => <span key={columnIndex} />)}
        </div>
      ))}
    </div>
  );
}
