import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'freistehen.sqlite');

import fs from 'node:fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS spots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL CHECK (source IN ('osm', 'community')),
  osm_type TEXT,
  osm_id INTEGER,
  name TEXT,
  description TEXT,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  category TEXT NOT NULL DEFAULT 'parking',
  fee TEXT,
  surface TEXT,
  max_height_m REAL,
  max_weight_t REAL,
  motorhome INTEGER DEFAULT 0,
  truck INTEGER DEFAULT 0,
  water INTEGER DEFAULT 0,
  toilets INTEGER DEFAULT 0,
  quiet INTEGER DEFAULT 0,
  tags_json TEXT,
  created_by TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reported', 'removed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(osm_type, osm_id)
);

CREATE INDEX IF NOT EXISTS idx_spots_lat_lon ON spots (lat, lon);
CREATE INDEX IF NOT EXISTS idx_spots_source ON spots (source);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  author TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ratings_spot ON ratings (spot_id);
`);
