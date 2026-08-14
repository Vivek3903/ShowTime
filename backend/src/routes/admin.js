import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { getAllMovies } from '../db/movieStore.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { isAdmin: true, username },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token, username });
});

// ── Stats overview ─────────────────────────────────────────────────────────────
router.get('/stats', adminAuth, (req, res) => {
  const totalPlayers = db.prepare('SELECT COUNT(*) as c FROM players').get().c;
  const totalGames   = db.prepare('SELECT COUNT(*) as c FROM scores').get().c;
  const dailyPlays   = db.prepare('SELECT COUNT(*) as c FROM daily_plays').get().c;
  const avgScore     = db.prepare('SELECT AVG(total_score) as a FROM scores').get().a;
  const movies       = getAllMovies();

  res.json({
    totalPlayers,
    totalGames,
    dailyPlays,
    avgScore: Math.round(avgScore || 0),
    totalMovies: movies.length,
  });
});

// ── Players list ───────────────────────────────────────────────────────────────
router.get('/players', adminAuth, (req, res) => {
  const players = db.prepare(`
    SELECT
      p.id,
      p.username,
      p.created_at,
      COUNT(DISTINCT s.id)          AS games_played,
      COALESCE(SUM(s.total_score), 0) AS total_score
    FROM players p
    LEFT JOIN scores s ON s.player_id = p.id
    GROUP BY p.id
    ORDER BY total_score DESC
  `).all();
  res.json(players);
});

// ── Individual player stats ────────────────────────────────────────────────────
router.get('/players/:id/stats', adminAuth, (req, res) => {
  const { id } = req.params;
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const sessions = db.prepare(`
    SELECT id, game_type, total_score, played_at
    FROM scores WHERE player_id = ?
    ORDER BY played_at DESC
  `).all(id);

  const totalScore   = sessions.reduce((s, r) => s + r.total_score, 0);
  const bestScore    = sessions.length ? Math.max(...sessions.map(s => s.total_score)) : 0;
  const avgScore     = sessions.length ? Math.round(totalScore / sessions.length) : 0;
  const regularGames = sessions.filter(s => s.game_type === 'regular').length;
  const dailyGames   = sessions.filter(s => s.game_type === 'daily').length;
  const lastPlayed   = sessions[0]?.played_at || null;

  // Global rank by cumulative score
  const above = db.prepare(`
    SELECT COUNT(*) as c FROM (
      SELECT player_id, SUM(total_score) as t FROM scores GROUP BY player_id HAVING t > ?
    )
  `).get(totalScore).c;
  const rank = above + 1;

  res.json({
    player: { ...player, totalScore, bestScore, avgScore, regularGames, dailyGames, rank, lastPlayed },
    sessions,
  });
});

// ── Delete player ──────────────────────────────────────────────────────────────
router.delete('/players/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM scores      WHERE player_id = ?').run(id);
    db.prepare('DELETE FROM daily_plays WHERE player_id = ?').run(id);
    db.prepare('DELETE FROM players     WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// ── Movies list ────────────────────────────────────────────────────────────────
router.get('/movies', adminAuth, (req, res) => {
  const movies = getAllMovies();
  res.json(
    movies.map(m => ({
      id:     m.id,
      title:  m.title,
      year:   m.year,
      genre:  m.genre,
      frames: m.frames.length,
    }))
  );
});

// ── Recent scores ──────────────────────────────────────────────────────────────
router.get('/scores', adminAuth, (req, res) => {
  const scores = db.prepare(`
    SELECT s.id, p.username, s.game_type, s.total_score, s.played_at
    FROM scores s
    JOIN players p ON p.id = s.player_id
    ORDER BY s.played_at DESC
    LIMIT 50
  `).all();
  res.json(scores);
});

export default router;
