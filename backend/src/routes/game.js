import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { getRandomMovies, getDailyMovies, getMovieById } from '../db/movieStore.js';
import { validateGame } from '../middleware/validateGame.js';
import { scoreLimiter, verifyGuessLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Generate a payload suitable for the client without spoiling the title
function createClientRounds(movies) {
  return movies.map((m, index) => {
    const framePaths = m.frames ? m.frames.map(f => f.frame_path) : [];
    return {
      roundIndex: index,
      movieId: m.id,
      year: m.year,
      genre: m.genre,
      frame_paths: framePaths
    };
  });
}

router.get('/regular', (req, res) => {
  const { playerId } = req.query;
  if (!playerId) {
    return res.status(400).json({ error: 'playerId is required' });
  }

  try {
    const movies = getRandomMovies(5);
    const movieIds = movies.map(m => m.id);
    
    const gameToken = jwt.sign(
      { movieIds, gameType: 'regular', issuedAt: Date.now(), playerId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const rounds = createClientRounds(movies);
    res.json({ gameToken, rounds });
  } catch (error) {
    console.error('Error starting regular game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/daily', (req, res) => {
  const { playerId } = req.query;
  if (!playerId) {
    return res.status(400).json({ error: 'playerId is required' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if played today
    const playedToday = db.prepare('SELECT id FROM daily_plays WHERE player_id = ? AND play_date = ?').get(playerId, today);
    if (playedToday) {
      return res.json({ alreadyPlayed: true });
    }

    const movies = getDailyMovies(today);
    const movieIds = movies.map(m => m.id);
    
    const gameToken = jwt.sign(
      { movieIds, gameType: 'daily', issuedAt: Date.now(), playerId, date: today },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const rounds = createClientRounds(movies);
    res.json({ gameToken, rounds });
  } catch (error) {
    console.error('Error starting daily game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-guess', verifyGuessLimiter, (req, res) => {
  const { movieId, guess } = req.body;
  if (!movieId) {
    return res.status(400).json({ error: 'movieId is required' });
  }

  try {
    const movie = getMovieById(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Empty/missing guess = time expired, treat as wrong
    if (!guess || !guess.trim()) {
      return res.json({ correct: false, title: movie.title });
    }

    const titleStr = movie.title.toLowerCase().trim();
    const guessStr = guess.toLowerCase().trim();
    
    let correct = titleStr === guessStr;
    if (!correct && guessStr.length >= titleStr.length * 0.8) {
      if (titleStr.includes(guessStr) || guessStr.includes(titleStr)) {
        correct = true;
      }
    }

    res.json({ correct, title: movie.title });
  } catch (error) {
    console.error('Error verifying guess:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/score', scoreLimiter, validateGame, (req, res) => {
  const { playerId, rounds } = req.body;
  const session = req.gameSession;

  if (String(session.playerId) !== String(playerId)) {
    return res.status(403).json({ error: 'Player ID mismatch' });
  }

  if (!rounds || !Array.isArray(rounds)) {
    return res.status(400).json({ error: 'Invalid rounds data' });
  }

  try {
    // Validate points and movie IDs
    let totalScore = 0;
    
    for (const round of rounds) {
      if (!session.movieIds.includes(round.movieId)) {
        return res.status(400).json({ error: `Invalid movieId: ${round.movieId}` });
      }
      
      const pts = Number(round.pointsEarned);
      if (![0, 7, 8, 10].includes(pts)) {
        return res.status(400).json({ error: `Invalid points: ${pts}` });
      }
      totalScore += pts;
    }

    // Insert daily play if daily mode
    if (session.gameType === 'daily') {
      try {
        db.prepare('INSERT INTO daily_plays (player_id, play_date) VALUES (?, ?)').run(playerId, session.date);
      } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(409).json({ error: 'Already played today' });
        }
        throw err;
      }
    }

    // Insert score
    db.prepare('INSERT INTO scores (player_id, game_type, total_score) VALUES (?, ?, ?)').run(
      playerId, session.gameType, totalScore
    );

    // Calculate rank (global cumulative score)
    // First, find player's total cumulative score across all games
    const allScores = db.prepare(`
      SELECT player_id, SUM(total_score) as cumulative 
      FROM scores 
      GROUP BY player_id 
      ORDER BY cumulative DESC
    `).all();

    const rankIndex = allScores.findIndex(s => String(s.player_id) === String(playerId));
    const leaderboardRank = rankIndex !== -1 ? rankIndex + 1 : -1;

    res.json({ success: true, totalScore, leaderboardRank });

  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
