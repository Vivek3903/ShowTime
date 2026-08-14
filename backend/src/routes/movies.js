import express from 'express';
import { getAllTitles } from '../db/movieStore.js';

const router = express.Router();

router.get('/titles', (req, res) => {
  try {
    const titles = getAllTitles();
    res.json(titles);
  } catch (error) {
    console.error('Error fetching titles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
