import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Trophy, RotateCcw, ListOrdered, Home } from 'lucide-react';

const GameSummary = ({ rounds, totalScore, leaderboardRank, gameType, onPlayAgain }) => {
  const navigate = useNavigate();
  const isHighScore = totalScore > 35;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fade-in relative z-10">
      
      {/* High Score Confetti overlay logic can be added here if needed, keeping simple CSS for now */}
      <div className="text-center mb-12 relative">
        {isHighScore && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none flex justify-center">
             <div className="absolute -top-10 text-6xl animate-bounce">🎉</div>
          </div>
        )}
        <h1 className="text-4xl md:text-6xl font-cinzel font-bold text-white mb-4 glow-text">
          Game Complete!
        </h1>
        <p className="text-xl text-white/70">
          {gameType === 'daily' ? 'Daily Challenge Finished' : 'Regular Game Finished'}
        </p>
      </div>

      <div className="glass-card rounded-3xl p-8 mb-8 border-t-4 border-t-gold">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
          <div className="text-center flex-1">
            <h3 className="text-white/50 uppercase tracking-widest text-sm mb-2">Total Score</h3>
            <div className="text-6xl font-bold font-inter text-gold glow-text">{totalScore}</div>
          </div>
          
          {leaderboardRank && (
            <div className="w-px h-20 bg-white/10 hidden md:block"></div>
          )}
          
          {leaderboardRank && (
            <div className="text-center flex-1 flex flex-col items-center">
              <h3 className="text-white/50 uppercase tracking-widest text-sm mb-2">Global Rank</h3>
              <div className="flex items-center gap-3">
                <Trophy className="w-10 h-10 text-gold" />
                <span className="text-5xl font-bold font-inter text-white">#{leaderboardRank}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-cinzel text-white/90 border-b border-white/10 pb-4 mb-6">Round Breakdown</h3>
          {rounds.map((round, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center font-bold text-white/50">
                  {i + 1}
                </div>
                {round.correct ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <div>
                  <div className="font-medium text-white">{round.actualTitle}</div>
                  <div className="text-xs text-white/50">
                    Guessed: {round.guessedTitle || 'None'} • {round.timeUsed.toFixed(1)}s
                  </div>
                </div>
              </div>
              <div className={`font-bold text-xl ${round.pointsEarned > 0 ? 'text-green-400' : 'text-white/30'}`}>
                +{round.pointsEarned}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={onPlayAgain}
          className="flex items-center justify-center gap-2 py-4 px-8 bg-gold hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transform hover:-translate-y-1"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
        <button 
          onClick={() => navigate('/leaderboard')}
          className="flex items-center justify-center gap-2 py-4 px-8 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all backdrop-blur-md border border-white/10"
        >
          <ListOrdered className="w-5 h-5" />
          Leaderboard
        </button>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 py-4 px-8 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all backdrop-blur-md border border-white/10"
        >
          <Home className="w-5 h-5" />
          Home
        </button>
      </div>
    </div>
  );
};

export default GameSummary;
