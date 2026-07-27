# Visitor Session Analytics

Updated: 2026-07-27

## Production Shape

The production Cloudflare Worker injects `/clientsurge-telegram-click-tracker.js` into public HTML responses. The same script keeps the existing qualifying-click Telegram alerts and adds session-duration tracking through a same-origin endpoint:

- `POST /api/analytics/v1/session-event`
- D1 binding: `ANALYTICS_DB`
- D1 database: `clientsurge-visitor-analytics`
- Wrangler config: `wrangler.clientsurge-security.toml`
- Migration: `migrations/0001_visitor_session_analytics.sql`
- Cron: every minute, finalizes active sessions with no heartbeat for 60 seconds

The browser tracker stores only a persistent anonymous visitor ID in `localStorage` and active session/page state in `sessionStorage`. It does not use cookies.

## Events

The browser sends these event types:

- `session_start` when a new browser session is created
- `page_start` when the first page or a client-side route starts
- `heartbeat` every 15 seconds while visible
- `page_hidden` and `page_visible` on visibility changes
- `route_change` before a React Router/history route transition starts the next page instance
- `page_exit` and `session_end` on unload/pagehide
- `conversion` when an existing qualifying click is sent

The Worker rejects non-ClientSurge origins, malformed JSON, oversized payloads, invalid event types, and impossible duration metrics such as engaged time exceeding visible time.

## Duration Rules

- Session timeout: 60 seconds without heartbeat
- Heartbeat interval: 15 seconds
- Active engagement window: 30 seconds after pointer, touch, key, or scroll activity
- Server-side cap: 8 hours per session
- Duration updates are monotonic: lower or out-of-order client durations do not reduce stored totals
- Bounce is true only when the session has one page, less than 10 seconds engaged time, and no conversion

## Telegram Alerts

On first accepted session event, the Worker sends an arrival message with page, URL, referrer, Cloudflare location/network metadata, device/browser fields, visitor ID, session ID, and `Arrived at`.

On explicit exit or cron finalization, the Worker edits the original Telegram message when possible. If edit fails or no message ID exists, it sends a completion message/reply. Completion delivery is idempotent through `telegram_completion_sent`.

## Verification

Recommended focused proof after changes:

1. `node --test tests/cloudflareTelegramTracker.test.js tests/cloudflareVisitorSessionAnalytics.test.js`
2. `npm run cloudflare:security:dry-run`
3. `npx wrangler d1 migrations apply clientsurge-visitor-analytics --remote`
4. `npm run cloudflare:security:deploy`
5. Live GET `https://clientsurgesystems.com/clientsurge-telegram-click-tracker.js` and confirm it contains `/api/analytics/v1/session-event`
6. Live POST a synthetic session to `/api/analytics/v1/session-event`
7. Query D1 for the synthetic `session_id`
8. Confirm Telegram arrival and completion behavior

## Rollback

The quickest rollback is to deploy the previous Worker version. If the D1 database remains bound, it is inert when the old Worker no longer posts or finalizes session events. To pause Telegram messages without dropping event writes, set `VISITOR_ALERT_ENABLED=false` as a Worker secret. To stop capture entirely, remove the session endpoint branch and tracker session code, then deploy.
