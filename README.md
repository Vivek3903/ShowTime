# ShowTime 🎬

**ShowTime** is an immersive, web-based Telugu movie guessing game. Test your cinematic knowledge by guessing the movie title from a single frame! Features a rich, theatrical UI with dynamic hints, daily challenges, and global leaderboards.

---

## 🌟 Features

*   **Two Game Modes**:
    *   **Quick Game**: 5 randomized rounds. Dynamic hints (Year and Genre) unlock as the timer ticks down. Faster guesses earn more points!
    *   **Daily Challenge**: A globally synced, fixed set of 5 movies each day. Hardcore mode with no hints and only one attempt allowed per day.
*   **Dynamic Hint System**: As the 20-second timer drops, the movie's Release Year (at 15s) and Genre (at 10s) are automatically revealed to help you out.
*   **Global Leaderboard**: Compete with others and climb the ranks in the Hall of Fame.
*   **Admin Dashboard**: Secure, token-protected control panel to monitor total players, games played, and a feed of recent scores.
*   **Anti-Cheat System**: Secure backend validation using JWT-signed game sessions to prevent forged score submissions.

---

## 🎨 Theme & Aesthetic

The application is built with a premium, cinematic visual language designed to make players feel like they are in a theater:

*   **Colors**: Deep theater black (`#0a0a0f`) combined with glowing cinematic gold (`#d4af37`).
*   **Typography**: The *Cinzel* font is used for headings to evoke a classic movie poster aesthetic.
*   **Visual Effects**: 
    *   A custom static **Film Grain** CSS overlay covers the background.
    *   **Glassmorphism** cards (`glass-card`) with frosted blurs.
    *   Smooth CSS animations (slide-ups, fade-ins, and pulsating glows).
    *   Dynamic, color-shifting progress bars for the game timer.

---

## 💻 Tech Stack

### Frontend
*   **Framework**: React 18 (Vite)
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Routing**: React Router v6
*   **Hosting**: Vercel

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express 4
*   **Database**: SQLite (`node:sqlite`) with WAL mode for performance
*   **Security**: JSON Web Tokens (JWT) for session tracking, API Rate Limiting
*   **Hosting**: Railway (Dockerized with Persistent Volumes)

---

## 🚀 Quick Start (Local Development)

### 1. Set up the Backend
```bash
cd backend
npm install
# Seed the database with movies/frames from frames.csv
npm run seed
# Start the server (runs on http://localhost:3001)
npm run dev
```

### 2. Set up the Frontend
```bash
cd frontend
npm install
# Create a .env file and set VITE_API_URL=http://localhost:3001/api
# Start the development server (runs on http://localhost:5173)
npm run dev
```

---

## 📁 Project Structure

```text
ShowTime/
├── backend/
│   ├── src/
│   │   ├── db/          # SQLite connection and seeding logic
│   │   ├── routes/      # Express API routes (game, admin, leaderboards)
│   │   └── middleware/  # Rate limiters & JWT validation
│   ├── frames/          # Static movie frame images
│   └── frames.csv       # Source dataset for the SQLite database
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI (Timer, GuessInput, MovieFrame)
    │   ├── pages/       # Views (GamePage, AdminDashboard, LeaderboardPage)
    │   └── utils/       # Axios API client
    └── vercel.json      # Vercel SPA routing configuration
```
