import React from 'react';

const Timer = ({ timeLeft, maxTime, phase }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / maxTime) * circumference;
  
  let colorClass = 'text-green-500';
  if (timeLeft <= 10 && timeLeft > 5) colorClass = 'text-amber-500';
  if (timeLeft <= 5) colorClass = 'text-red-500';
  
  const isPulsing = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className={`relative flex items-center justify-center w-24 h-24 ${isPulsing ? 'animate-[pulse-ring_1s_ease-out_infinite]' : ''}`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-white/10"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${colorClass} transition-all duration-300 ease-linear`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold font-inter ${colorClass}`}>{timeLeft}</span>
        {phase !== 'expired' && <span className="text-[10px] text-white/50 uppercase tracking-wider">{phase}</span>}
      </div>
    </div>
  );
};

export default Timer;
