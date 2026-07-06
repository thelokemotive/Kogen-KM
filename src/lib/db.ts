import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  bio TEXT NOT NULL DEFAULT '',
  fav_spot TEXT NOT NULL DEFAULT '',
  avatar_path TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  sport TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  distance_m REAL NOT NULL,
  elevation_m REAL NOT NULL DEFAULT 0,
  duration_s INTEGER,
  moving_s INTEGER,
  avg_kmh REAL,
  started_at TEXT NOT NULL,
  gpx_path TEXT,
  file_hash TEXT,
  polyline TEXT,
  status TEXT NOT NULL DEFAULT 'APPROVED',
  flag_reason TEXT,
  reviewed_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_started ON activities(started_at);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);

CREATE TABLE IF NOT EXISTS kudos (
  activity_id INTEGER NOT NULL REFERENCES activities(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (activity_id, user_id)
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  subject_user_id INTEGER REFERENCES users(id),
  caption TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id INTEGER NOT NULL REFERENCES users(id),
  badge_id TEXT NOT NULL,
  awarded_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, badge_id)
);
`;

// The school runs two active seasons per year: Autumn (trail running +
// mountain biking) and Spring. Winter is ski season and out of scope for now.
const DEFAULT_TERMS: Array<[string, string, string]> = [
  ['Autumn Term 2025', '2025-09-01', '2025-12-19'],
  ['Spring Term 2026', '2026-01-06', '2026-03-27'],
  ['Autumn Term 2026', '2026-08-31', '2026-12-18'],
  ['Spring Term 2027', '2027-01-05', '2027-03-26'],
];

function open(): Database.Database {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'avatars'), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'photos'), { recursive: true });
  const db = new Database(path.join(DATA_DIR, 'kogen.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  const termCount = db.prepare('SELECT COUNT(*) AS n FROM terms').get() as { n: number };
  if (termCount.n === 0) {
    const ins = db.prepare('INSERT INTO terms (name, starts_on, ends_on) VALUES (?, ?, ?)');
    for (const t of DEFAULT_TERMS) ins.run(...t);
  }
  return db;
}

// Reuse one connection across hot reloads in dev and across route modules.
const globalForDb = globalThis as unknown as { __kogenDb?: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb.__kogenDb) globalForDb.__kogenDb = open();
  return globalForDb.__kogenDb;
}
