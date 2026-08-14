import db from './database.js';

let moviesCache = [];
let allTitlesCache = [];

// Simple seeded xorshift random number generator
function seedRandom(seed) {
  let state = seed;
  return function() {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    // ensure positive and between 0 and 1
    return ((state < 0 ? ~state + 1 : state) % 1000000000) / 1000000000;
  };
}

function stringToSeed(str) {
  let seed = 0;
  for (let i = 0; i < str.length; i++) {
    seed = ((seed << 5) - seed) + str.charCodeAt(i);
    seed |= 0;
  }
  return seed === 0 ? 1 : seed; // must not be 0
}

export function loadMovies() {
  const movies = db.prepare('SELECT * FROM movies').all();
  const frames = db.prepare('SELECT * FROM movie_frames').all();

  const framesByMovie = {};
  for (const frame of frames) {
    if (!framesByMovie[frame.movie_id]) {
      framesByMovie[frame.movie_id] = [];
    }
    framesByMovie[frame.movie_id].push(frame);
  }

  moviesCache = movies.map(movie => ({
    ...movie,
    frames: framesByMovie[movie.id] || []
  }));

  allTitlesCache = moviesCache.map(m => m.title);
  return moviesCache.length;
}

export function getAllTitles() {
  return allTitlesCache;
}

export function getMovieById(id) {
  return moviesCache.find(m => m.id === parseInt(id, 10)) || null;
}

export function getRandomMovies(count) {
  if (moviesCache.length === 0) return [];
  const shuffled = [...moviesCache].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, moviesCache.length));
}

export function getDailyMovies(dateStr) {
  if (moviesCache.length === 0) return [];
  const seed = stringToSeed(dateStr);
  const random = seedRandom(seed);
  
  const movies = [...moviesCache];
  // Seeded Fisher-Yates shuffle
  for (let i = movies.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [movies[i], movies[j]] = [movies[j], movies[i]];
  }
  
  return movies.slice(0, Math.min(1, movies.length));
}

export function getMovieByTitle(title) {
  if (!title) return null;
  const search = title.toLowerCase().trim();
  
  // Exact match (case insensitive)
  const exact = moviesCache.find(m => m.title.toLowerCase().trim() === search);
  if (exact) return exact;
  
  // Substring match
  const partial = moviesCache.find(m => m.title.toLowerCase().includes(search));
  return partial || null;
}

export function getAllMovies() {
  return moviesCache;
}
