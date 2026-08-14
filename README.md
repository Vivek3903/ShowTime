# ShowTime 🎬

A daily Telugu movie guessing game. Guess the movie from a single trailer frame — reveals of year and genre unlock over time if you're stuck.

## Prerequisites

- Node.js 18+
- npm 9+

## Project Structure

```
ShowTime/
├── backend/        # Node.js + Express API + SQLite
├── frontend/       # React + Vite + Tailwind CSS
├── frames/         # Movie frame images (populated by build_dataset.py)
├── frames.csv      # Dataset: one row per frame per movie
└── movies.csv      # Full Telugu movies metadata
```

## Quick Start

### 1. Seed the database

```bash
cd backend
npm install
npm run seed
```

This reads `frames.csv` from the project root and populates the SQLite database (`backend/showtime.db`).

### 2. Start the backend

```bash
cd backend
npm run dev
```

Backend runs at **http://localhost:3001**

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## Game Modes

### Quick Game
- 5 rounds, 20 seconds per round
- **0–10s**: Frame only → correct guess = **10 pts**
- **10–15s**: Year revealed → correct guess = **8 pts**
- **15–20s**: Genre revealed → correct guess = **7 pts**
- **20s**: Round auto-advances, **0 pts**

### Daily Challenge
- One fixed set of 5 movies per calendar day (seeded by date — same for all players)
- 10 seconds per round, frame-only, no reveals
- Can only be played **once per day per player** (enforced server-side)

---

## Updating the Dataset

1. Add rows to `frames.csv` (columns: `movie, year, certificate, genre, rating, youtube_title, youtube_url, frame, frame_path, percentage, timestamp_seconds`)
2. Add the corresponding frame images to `frames/<MovieFolder>/`
3. Re-run `npm run seed` in the backend — it safely upserts new entries

---

## Environment Variables (backend/.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `showtime_secret_...` | Secret for signing game session tokens |
| `PORT` | `3001` | Backend port |
| `NODE_ENV` | `development` | Environment |

---

## Security

- Game sessions are JWT-signed — score submission is rejected without a valid token
- Daily play enforced server-side via `daily_plays` table
- Rate limiting: 100 req/15min general, 10 req/5min on score submission
- Input validation on all endpoints

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express 4 |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (game session tokens only) |
