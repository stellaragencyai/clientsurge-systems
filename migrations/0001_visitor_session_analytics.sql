CREATE TABLE IF NOT EXISTS visitor_sessions (
  session_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  completed_at INTEGER,
  landing_url TEXT NOT NULL,
  landing_path TEXT NOT NULL,
  current_url TEXT NOT NULL,
  current_path TEXT NOT NULL,
  exit_url TEXT,
  exit_path TEXT,
  referrer TEXT,
  page_title TEXT,
  page_count INTEGER NOT NULL DEFAULT 1,
  elapsed_ms INTEGER NOT NULL DEFAULT 0,
  visible_ms INTEGER NOT NULL DEFAULT 0,
  engaged_ms INTEGER NOT NULL DEFAULT 0,
  last_event_type TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  completion_reason TEXT,
  is_bounce INTEGER NOT NULL DEFAULT 1,
  engagement_level TEXT NOT NULL DEFAULT 'Likely bounce',
  telegram_chat_id TEXT,
  telegram_start_message_id TEXT,
  telegram_completion_sent INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  timezone TEXT,
  network TEXT,
  asn TEXT,
  ip_address TEXT,
  browser TEXT,
  operating_system TEXT,
  device_type TEXT,
  screen_resolution TEXT,
  language TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS visitor_pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  page_instance_id TEXT NOT NULL,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  entered_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  exited_at INTEGER,
  elapsed_ms INTEGER NOT NULL DEFAULT 0,
  visible_ms INTEGER NOT NULL DEFAULT 0,
  engaged_ms INTEGER NOT NULL DEFAULT 0,
  exit_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (session_id, page_instance_id),
  FOREIGN KEY (session_id) REFERENCES visitor_sessions(session_id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_instance_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES visitor_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_status_last_seen
  ON visitor_sessions (status, last_seen_at);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor
  ON visitor_sessions (visitor_id, first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_created
  ON visitor_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visitor_pageviews_session
  ON visitor_pageviews (session_id, entered_at);

CREATE INDEX IF NOT EXISTS idx_visitor_pageviews_path
  ON visitor_pageviews (path, entered_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session
  ON analytics_events (session_id, received_at);
