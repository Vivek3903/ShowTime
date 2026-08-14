import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Loader2, Medal } from 'lucide-react';
import { getLeaderboard } from '../utils/api';

const LeaderboardPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      // Ensure it's an array
      setLeaders(Array.isArray(data) ? data : (data.leaderboard || []));
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]';
      case 2: return 'text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.5)]';
      case 3: return 'text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.5)]';
      default: return 'text-white/50';
    }
  };

  const getPodiumHeight = (rank) => {
    switch(rank) {
      case 1: return 'h-40 md:h-48 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 border-t-2 border-yellow-400';
      case 2: return 'h-32 md:h-40 bg-gradient-to-t from-gray-400/20 to-gray-400/5 border-t-2 border-gray-300';
      case 3: return 'h-24 md:h-32 bg-gradient-to-t from-amber-700/20 to-amber-700/5 border-t-2 border-amber-600';
      default: return '';
    }
  };

  const top3 = leaders.slice(0, 3);
  // Reorder for podium visual: 2, 1, 3
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const rankMap = top3.length === 3 ? [2, 1, 3] : [1, 2, 3];

  const rest = leaders.slice(3, 10);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-y-auto pb-12">
      <div className="absolute inset-0 film-grain z-0 pointer-events-none fixed" />
      
      <div className="z-10 relative max-w-4xl mx-auto p-4 md:p-8">
        
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-cinzel font-bold text-white mb-4 glow-text flex items-center justify-center gap-4">
            <Trophy className="w-10 h-10 md:w-12 md:h-12 text-gold" /> Hall of Fame
          </h1>
          <p className="text-white/50">Top players of ShowTime</p>
        </div>

        {loading && leaders.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-gold animate-spin" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl">
            <p className="text-white/50 text-xl">No players on the leaderboard yet. Be the first!</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            
            {/* Podium for top 3 */}
            {top3.length >= 3 && (
              <div className="flex items-end justify-center gap-2 md:gap-6 mb-16 h-64">
                {podiumOrder.map((player, idx) => {
                  const rank = rankMap[idx];
                  return (
                    <div key={player.username} className="flex flex-col items-center w-1/3 max-w-[120px]">
                      <div className="mb-4 flex flex-col items-center animate-slide-up" style={{ animationDelay: `${rank * 150}ms` }}>
                        <Medal className={`w-8 h-8 md:w-12 md:h-12 mb-2 ${getRankColor(rank)}`} />
                        <div className="font-bold text-white text-sm md:text-lg truncate w-full text-center px-2">
                          {player.username}
                        </div>
                        <div className="text-gold font-bold text-xl md:text-2xl mt-1">{player.totalScore}</div>
                      </div>
                      <div className={`w-full rounded-t-lg ${getPodiumHeight(rank)} flex justify-center pt-4 backdrop-blur-sm`}>
                        <span className="font-cinzel text-3xl md:text-5xl font-bold opacity-30">{rank}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List for rest */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-white/50 uppercase text-xs tracking-wider">
                    <th className="p-4 w-16 text-center">Rank</th>
                    <th className="p-4">Player</th>
                    <th className="p-4 text-right">Score</th>
                    <th className="p-4 text-right hidden sm:table-cell">Games</th>
                  </tr>
                </thead>
                <tbody>
                  {(top3.length < 3 ? top3 : rest).map((player, idx) => {
                    const rank = top3.length < 3 ? idx + 1 : idx + 4;
                    return (
                      <tr 
                        key={player.username} 
                        className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                      >
                        <td className="p-4 text-center font-bold text-white/50 group-hover:text-white transition-colors">
                          #{rank}
                        </td>
                        <td className="p-4 font-medium text-white">{player.username}</td>
                        <td className="p-4 text-right font-bold text-gold">{player.totalScore}</td>
                        <td className="p-4 text-right text-white/50 hidden sm:table-cell">{player.gamesPlayed || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
