import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

// Imports setup after environment initialization
import db from './db/database.js';
import { loadMovies } from './db/movieStore.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// Route imports
import playersRouter from './routes/players.js';
import moviesRouter from './routes/movies.js';
import gameRouter from './routes/game.js';
import leaderboardRouter from './routes/leaderboard.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Load store
const movieCount = loadMovies();
console.log(`Loaded ${movieCount} movies into memory.`);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // In production, we might want to be more permissive with Vercel preview URLs
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true); // Or validate against a specific regex if needed
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'DELETE'], // ensure DELETE is allowed for admin
  credentials: true
}));

app.use(express.json());

// Serve static frames BEFORE rate limiter (images should never be rate-limited)
const framesDir = path.resolve(__dirname, '../frames');
app.use('/frames', express.static(framesDir));

// Apply global rate limit to API routes only
app.use(generalLimiter);

// Routes
app.use('/api/players', playersRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/game', gameRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin', adminRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled application error:', err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, () => {
  console.log(`ShowTime backend is running on http://localhost:${PORT}`);
  console.log(`Serving static frames from: ${framesDir}`);
});
