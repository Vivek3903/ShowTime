import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// frames.csv lives at backend/frames.csv
// __dirname = backend/src/db  →  ../../ = backend/
const csvFilePath = path.resolve(__dirname, '../../frames.csv');
// frames/ folder lives at: backend/frames/
const framesRootDir = path.resolve(__dirname, '../../frames');

async function seed() {
  console.log(`Starting seed process...`);
  console.log(`CSV:    ${csvFilePath}`);
  console.log(`Frames: ${framesRootDir}`);

  // Create tables (idempotent)
  db.exec(`
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

  if (!fs.existsSync(csvFilePath)) {
    console.warn(`WARNING: CSV not found at ${csvFilePath}. Seed skipped.`);
    return;
  }
  if (!fs.existsSync(framesRootDir)) {
    console.warn(`WARNING: frames/ folder not found at ${framesRootDir}. Seed skipped.`);
    return;
  }

  const insertMovieStmt = db.prepare(`
    INSERT INTO movies (title, year, genre, certificate, rating)
    VALUES ($title, $year, $genre, $certificate, $rating)
  `);
  const getMovieStmt = db.prepare('SELECT id FROM movies WHERE title = ?');
  const insertFrameStmt = db.prepare(`
    INSERT INTO movie_frames (movie_id, frame_path, percentage, youtube_url)
    VALUES ($movie_id, $frame_path, $percentage, $youtube_url)
  `);
  const getFrameStmt = db.prepare(
    'SELECT id FROM movie_frames WHERE movie_id = ? AND percentage = ?'
  );

  let newMovies = 0;
  let newFrames = 0;
  let skippedMovies = 0;
  let headers = null;

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Percentage labels mapped from filename
  const FRAME_PERCENTAGES = {
    'frame_25percent.jpg': '25%',
    'frame_50percent.jpg': '50%',
    'frame_75percent.jpg': '75%',
  };

  const rl = readline.createInterface({
    input: fs.createReadStream(csvFilePath),
    crlfDelay: Infinity,
  });

  db.exec('BEGIN');
  try {
    for await (const line of rl) {
      if (!line.trim()) continue;

      if (!headers) {
        headers = parseCSVLine(line);
        continue;
      }

      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ''; });

      const { movie, year, genre, youtube_url } = row;
      if (!movie) continue;

      // Check if a frames folder exists for this movie on disk
      const movieFramesDir = path.join(framesRootDir, movie);
      if (!fs.existsSync(movieFramesDir)) {
        skippedMovies++;
        continue;
      }

      // Upsert movie
      let movieId;
      const existing = getMovieStmt.get(movie);
      if (!existing) {
        const info = insertMovieStmt.run({
          $title: movie,
          $year: parseInt(year) || null,
          $genre: genre ? genre.trim() : null,
          $certificate: null,
          $rating: null,
        });
        movieId = info.lastInsertRowid;
        newMovies++;
      } else {
        movieId = existing.id;
      }

      // Insert frames found on disk
      const frameFiles = fs.readdirSync(movieFramesDir).filter(f => FRAME_PERCENTAGES[f]);
      for (const fileName of frameFiles) {
        const percentage = FRAME_PERCENTAGES[fileName];
        // Relative path used by the static server: /frames/<movie>/<file>
        const relativePath = `${movie}/${fileName}`;

        // Skip if already inserted
        const existingFrame = getFrameStmt.get(movieId, percentage);
        if (existingFrame) continue;

        insertFrameStmt.run({
          $movie_id: movieId,
          $frame_path: relativePath,
          $percentage: percentage,
          $youtube_url: youtube_url || null,
        });
        newFrames++;
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Seed failed, rolled back:', err);
    process.exit(1);
  }

  console.log('\n✅ Seed completed!');
  console.log(`   ${newMovies} new movies inserted`);
  console.log(`   ${newFrames} new frames inserted`);
  console.log(`   ${skippedMovies} movies skipped (no frames folder on disk)`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}

export default seed;
