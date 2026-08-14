import express from 'express';
import db from '../db/database.js';

const router = express.Router();

router.post('/', (req, res) => {
  const { username } = req.body;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  const validUsername = /^[a-zA-Z0-9_]{2,20}$/;
  if (!validUsername.test(username)) {
    return res.status(400).json({ 
      error: 'Username must be 2-20 characters long and contain only letters, numbers, and underscores' 
    });
  }

  try {
    // Check if player exists
    const existingPlayer = db.prepare('SELECT id, username FROM players WHERE username = ?').get(username);
    
    if (existingPlayer) {
      return res.status(409).json({ 
        error: 'Username is already taken. Please choose another one.' 
      });
    }

    // Create new player
    const info = db.prepare('INSERT INTO players (username) VALUES (?)').run(username);
    return res.json({ 
      id: info.lastInsertRowid, 
      username, 
      isNew: true 
    });
  } catch (error) {
    console.error('Player creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
