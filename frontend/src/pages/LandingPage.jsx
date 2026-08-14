import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayer';
import { Trophy, Play, Calendar, User, ArrowRight } from 'lucide-react';
import { createPlayer } from '../utils/api';

const LandingPage = () => {
  const { player, setPlayer } = usePlayer();
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    
    setIsLoading(true);
    setError('');
    try {
      const data = await createPlayer(usernameInput.trim());
      setPlayer(data.username, data.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create player');
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = (type) => {
    navigate(`/game?type=${type}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background with film grain overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#120a1f] to-[#0a0a0f] z-0" />
      <div className="absolute inset-0 film-grain z-10" />

      <div className="z-20 w-full max-w-2xl flex flex-col items-center relative animate-fade-in">
        
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="text-7xl mb-6">🎬</div>
          <h1 className="text-6xl md:text-8xl font-cinzel font-bold text-white mb-4 glow-text tracking-wider">
            SHOWTIME
          </h1>
          <p className="text-xl md:text-2xl text-gold font-light tracking-widest uppercase">
            The Telugu Movie Guessing Game
          </p>
        </div>

        {/* Player Section */}
        {!player ? (
          <div className="w-full max-w-md glass-card p-8 rounded-2xl">
            <h2 className="text-2xl font-cinzel mb-6 text-center text-white">Enter the Cinema</h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-white/50" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    className="block w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-transparent transition-all"
                    placeholder="Enter your username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gold hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? 'Entering...' : (
                  <>Continue <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-lg flex flex-col items-center animate-slide-up">
            <div className="text-center mb-10">
              <p className="text-xl text-white/70 mb-2">Welcome back,</p>
              <h2 className="text-4xl font-bold text-white glow-text">{player.username}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10">
              <button
                onClick={() => startGame('regular')}
                className="group relative glass-card p-6 rounded-2xl hover:bg-white/10 transition-all border border-white/10 hover:border-gold/50 flex flex-col items-center text-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Play className="w-12 h-12 text-gold group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Quick Game</h3>
                  <p className="text-sm text-white/50">5 rounds of random movies</p>
                </div>
              </button>

              <button
                onClick={() => startGame('daily')}
                className="group relative glass-card p-6 rounded-2xl hover:bg-white/10 transition-all border border-white/10 hover:border-blue-400/50 flex flex-col items-center text-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Calendar className="w-12 h-12 text-blue-400 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Daily Challenge</h3>
                  <p className="text-sm text-white/50">1 movie · Same for everyone today</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => navigate('/leaderboard')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors py-2 px-4 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md"
            >
              <Trophy className="w-4 h-4" /> View Leaderboard
            </button>
          </div>
        )}
      </div>

      {/* Admin link — subtle, bottom corner */}
      <button
        onClick={() => navigate('/admin')}
        className="z-20 absolute bottom-4 right-4 text-white/15 hover:text-white/40 text-xs transition-colors flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Admin
      </button>
    </div>
  );
};

export default LandingPage;
