import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const RoundResult = ({ correct, actualTitle, pointsEarned, timeUsed }) => {
  const isCorrect = correct;
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in`}>
      <div className={`glass-card p-8 rounded-2xl flex flex-col items-center max-w-lg w-full mx-4 border-2 ${isCorrect ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]'}`}>
        
        {isCorrect ? (
          <CheckCircle2 className="w-20 h-20 text-green-500 mb-6 animate-[pulse-ring_1.5s_ease-out_infinite]" />
        ) : (
          <XCircle className="w-20 h-20 text-red-500 mb-6" />
        )}
        
        <h2 className="text-3xl font-cinzel font-bold text-center mb-2">
          {isCorrect ? 'Correct!' : 'Time Up / Wrong'}
        </h2>
        
        <p className="text-xl text-white/70 mb-8 text-center">
          The movie was: <span className="font-bold text-white block mt-2 text-2xl">{actualTitle}</span>
        </p>
        
        <div className="flex gap-8 w-full justify-center border-t border-white/10 pt-6">
          <div className="flex flex-col items-center">
            <span className="text-white/50 text-sm mb-1 uppercase tracking-wider">Points</span>
            <span className={`text-4xl font-bold font-inter ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              +{pointsEarned}
            </span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-white/50 text-sm mb-1 uppercase tracking-wider">Time</span>
            <span className="text-2xl font-bold font-inter text-white flex items-center gap-1 mt-1">
              <Clock className="w-5 h-5 text-white/50" /> {timeUsed.toFixed(1)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundResult;
