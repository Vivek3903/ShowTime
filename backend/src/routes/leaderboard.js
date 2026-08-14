import express from 'express';
import db from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const leaderboard = db.prepare(`
      SELECT 
        p.username,
        SUM(s.total_score) as totalScore,
        COUNT(s.id) as gamesPlayed
      FROM players p
      JOIN scores s ON p.id = s.player_id
      GROUP BY p.id
      ORDER BY totalScore DESC
      LIMIT 10
    `).all();

    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      totalScore: entry.totalScore,
      gamesPlayed: entry.gamesPlayed
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
