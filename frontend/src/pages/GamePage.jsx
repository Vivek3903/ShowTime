import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayer';
import { useGameTimer } from '../hooks/useGameTimer';
import { startRegularGame, startDailyGame, verifyGuess, submitScore, getMovieTitles } from '../utils/api';
import MovieFrame from '../components/MovieFrame';
import Timer from '../components/Timer';
import GuessInput from '../components/GuessInput';
import RoundResult from '../components/RoundResult';
import GameSummary from '../components/GameSummary';
import { Loader2, Calendar } from 'lucide-react';

const REGULAR_TIME = 20;
const DAILY_TIME = 20;
const REGULAR_ROUNDS = 5;

const GamePage = () => {
  const [searchParams] = useSearchParams();
  const gameType = searchParams.get('type') || 'regular';
  const { player, isLoadingPlayer } = usePlayer();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState('loading'); // loading, playing, round_complete, game_complete, already_played, error
  const [gameData, setGameData] = useState(null);
  const [allTitles, setAllTitles] = useState([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [roundResults, setRoundResults] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [finalRank, setFinalRank] = useState(null);
  
  const totalRounds = gameData?.rounds?.length ?? REGULAR_ROUNDS;
  const currentRound = gameData?.rounds?.[currentRoundIdx];
  const isDaily = gameType === 'daily';
  const maxTime = isDaily ? DAILY_TIME : REGULAR_TIME;

  const handleTimeUp = useCallback(() => {
    if (gameState === 'playing' && currentRound) {
      handleGuess(null);
    }
  }, [gameState, currentRound]);

  const { timeLeft, start: startTimer, stop: stopTimer, reset: resetTimer } = useGameTimer(maxTime, handleTimeUp);

  const phase = useMemo(() => {
    if (gameState !== 'playing') return 'expired';
    const elapsed = maxTime - timeLeft;
    if (elapsed >= 15) return 'genre';
    if (elapsed >= 10) return 'year';
    return 'frame';
  }, [timeLeft, maxTime, gameState]);

  useEffect(() => {
    if (isLoadingPlayer) return; // wait for localStorage read
    if (!player) {
      navigate('/');
      return;
    }
    
    const initGame = async () => {
      try {
        const [titlesData, newGameData] = await Promise.all([
          getMovieTitles(),
          isDaily ? startDailyGame(player.id) : startRegularGame(player.id)
        ]);
        if (newGameData.alreadyPlayed) {
          setGameState('already_played');
          return;
        }
        setAllTitles(Array.isArray(titlesData) ? titlesData : (titlesData.titles || []));
        setGameData(newGameData);
        setGameState('playing');
        resetTimer();
        startTimer();
      } catch (err) {
        console.error('Failed to init game', err);
        setGameState('error');
      }
    };
    initGame();
  }, [player, isLoadingPlayer, isDaily, navigate]);

  const handleGuess = async (guessTitle) => {
    if (gameState !== 'playing') return;
    
    stopTimer();
    setCurrentResult(null); // Clear previous result before showing overlay
    setGameState('round_complete');
    
    const timeUsed = maxTime - timeLeft;
    
    try {
      // In a real app we might not want to verify if they guessed nothing, 
      // but API handles verifyGuess nicely. If guessTitle is null, they ran out of time.
      let pointsEarned = 0;
      let actualTitle = 'Unknown';
      let correct = false;

      // Always call API to get actual title at least (API gives it on verify)
      const res = await verifyGuess(currentRound.movieId, guessTitle || '');
      correct = res.correct;
      actualTitle = res.title;
      
      if (correct) {
        // Score based on which hints were visible when the player answered
        if (phase === 'frame') pointsEarned = 10;       // answered before year revealed
        else if (phase === 'year') pointsEarned = 8;    // answered after year, before genre
        else pointsEarned = 7;                           // answered after genre revealed
      }

      const result = {
        movieId: currentRound.movieId,
        guessedTitle: guessTitle,
        pointsEarned,
        timeUsed,
        correct,
        actualTitle
      };

      setCurrentResult(result);
      setRoundResults(prev => [...prev, result]);
      setTotalScore(prev => prev + pointsEarned);

      // Correct answer: wait 3s to celebrate; wrong/timeout: skip quickly in 1.5s
      const delay = correct ? 3000 : 1500;
      setTimeout(() => {
        if (currentRoundIdx < totalRounds - 1) {
          setCurrentRoundIdx(prev => prev + 1);
          setGameState('playing');
          resetTimer();
          startTimer();
        } else {
          finishGame([...roundResults, result]);
        }
      }, delay);

    } catch (err) {
      console.error(err);
      // API failed mid-round — treat as wrong, don't crash the game
      const fallbackResult = {
        movieId: currentRound.movieId,
        guessedTitle: guessTitle,
        pointsEarned: 0,
        timeUsed: maxTime - timeLeft,
        correct: false,
        actualTitle: '—'
      };
      setCurrentResult(fallbackResult);
      setRoundResults(prev => [...prev, fallbackResult]);
      setTimeout(() => {
        if (currentRoundIdx < totalRounds - 1) {
          setCurrentRoundIdx(prev => prev + 1);
          setGameState('playing');
          resetTimer();
          startTimer();
        } else {
          finishGame([...roundResults, fallbackResult]);
        }
      }, 1500);
    }
  };

  const finishGame = async (finalRounds) => {
    setGameState('game_complete');
    try {
      const res = await submitScore(gameData.gameToken, player.id, finalRounds);
      if (res.leaderboardRank) {
        setFinalRank(res.leaderboardRank);
      }
    } catch (err) {
      console.error('Failed to submit score', err);
    }
  };

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="absolute inset-0 film-grain z-0" />
        <div className="z-10 flex flex-col items-center gap-4 text-gold">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-cinzel text-xl">Preparing Cinema...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'already_played') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
        <div className="glass-card p-8 text-center max-w-md w-full">
          <div className="flex flex-col items-center mb-4">
            <Calendar className="w-14 h-14 text-blue-400 mb-2" />
            <span className="text-blue-300 text-sm font-medium tracking-wide">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl font-cinzel text-white mb-3">Already played today!</h2>
          <p className="text-gray-400 text-sm mb-6">Come back tomorrow for the next daily challenge.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/game?type=regular')} className="btn-primary">Quick Game</button>
            <button onClick={() => navigate('/')} className="btn-secondary">Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
        <div className="glass-card p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-cinzel text-white mb-3">Failed to start game</h2>
          <p className="text-gray-400 text-sm mb-6">Make sure the backend is running at localhost:3001.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  if (gameState === 'game_complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] py-12 relative overflow-y-auto">
        <div className="absolute inset-0 film-grain z-0 pointer-events-none fixed" />
        <GameSummary 
          rounds={roundResults} 
          totalScore={totalScore} 
          leaderboardRank={finalRank} 
          gameType={gameType}
          onPlayAgain={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col relative">
      <div className="absolute inset-0 film-grain z-0 pointer-events-none" />
      
      {/* Header */}
      <header className="z-10 w-full p-4 md:px-8 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="font-cinzel font-bold text-xl md:text-2xl text-white glow-text">SHOWTIME</div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-[10px] uppercase text-white/50 tracking-wider">Round</div>
            <div className="font-bold text-lg text-white">{currentRoundIdx + 1} / {totalRounds}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase text-white/50 tracking-wider">Score</div>
            <div className="font-bold text-lg text-gold">{totalScore}</div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="z-10 flex-1 flex flex-col items-center p-4 md:p-8 w-full max-w-6xl mx-auto gap-8">
        
        {currentRound && (
          <MovieFrame
            framePaths={currentRound.frame_paths}
            phase={phase}
            year={currentRound.year}
            genre={currentRound.genre}
          />
        )}

        <div className="flex flex-col md:flex-row items-center w-full max-w-4xl gap-6 mt-4">
          <Timer timeLeft={timeLeft} maxTime={maxTime} phase={phase} />
          
          <div className="flex-1 w-full">
            <GuessInput 
              titles={allTitles} 
              onGuess={handleGuess} 
              disabled={gameState !== 'playing'} 
            />
          </div>
        </div>

      </main>

      {/* Result Overlay */}
      {gameState === 'round_complete' && currentResult && (
        <RoundResult 
          correct={currentResult.correct}
          actualTitle={currentResult.actualTitle}
          pointsEarned={currentResult.pointsEarned}
          timeUsed={currentResult.timeUsed}
        />
      )}
    </div>
  );
};

export default GamePage;
