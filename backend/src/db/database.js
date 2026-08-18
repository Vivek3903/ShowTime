import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

// Database will be created at DB_PATH or backend/showtime.db
const defaultDbPath = path.resolve(__dirname, '../../showtime.db');
const dbPath = process.env.DB_PATH || defaultDbPath;

if (process.env.DB_PATH && !fs.existsSync(dbPath) && fs.existsSync(defaultDbPath)) {
  fs.copyFileSync(defaultDbPath, dbPath);
}

const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL;');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    game_type TEXT NOT NULL CHECK(game_type IN ('regular', 'daily')),
    total_score INTEGER NOT NULL,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS daily_plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    play_date TEXT NOT NULL,
    UNIQUE(player_id, play_date),
    FOREIGN KEY(player_id) REFERENCES players(id)
  );
  
  -- Also creating movies here to ensure they exist for constraints if needed
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    year INTEGER,
    genre TEXT,
    certificate TEXT,
    rating REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS movie_frames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    frame_path TEXT NOT NULL,
    percentage TEXT NOT NULL,
    youtube_url TEXT,
    FOREIGN KEY(movie_id) REFERENCES movies(id)
  );
`);

export default db;
