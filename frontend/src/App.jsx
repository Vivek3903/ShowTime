import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"                  element={<LandingPage />} />
        <Route path="/game"              element={<GamePage />} />
        <Route path="/leaderboard"       element={<LeaderboardPage />} />
        <Route path="/admin"             element={<AdminLoginPage />} />
        <Route path="/admin/dashboard"   element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
