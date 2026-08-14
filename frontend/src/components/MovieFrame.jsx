import React, { useState, useEffect } from 'react';
import { getFrameUrl } from '../utils/api';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';

const MovieFrame = ({ framePaths = [], phase, year, genre }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [imgSrcs, setImgSrcs] = useState({});
  const [loading, setLoading] = useState(true);

  // Reset carousel when movie changes
  useEffect(() => {
    setCurrentIdx(0);
    setImgSrcs({});
    setLoading(true);
  }, [framePaths]);

  // Preload all frames
  useEffect(() => {
    if (!framePaths || framePaths.length === 0) return;
    let loaded = 0;
    const srcs = {};
    framePaths.forEach((fp, i) => {
      const img = new Image();
      img.src = getFrameUrl(fp);
      img.onload = () => {
        srcs[i] = img.src;
        loaded++;
        if (loaded === framePaths.length) {
          setImgSrcs({ ...srcs });
          setLoading(false);
        }
      };
      img.onerror = () => {
        srcs[i] = null;
        loaded++;
        if (loaded === framePaths.length) {
          setImgSrcs({ ...srcs });
          setLoading(false);
        }
      };
    });
  }, [framePaths]);

  const total = framePaths.length;
  const prev = () => setCurrentIdx(i => (i - 1 + total) % total);
  const next = () => setCurrentIdx(i => (i + 1) % total);

  const currentSrc = imgSrcs[currentIdx];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Frame container */}
      <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-cinema-card min-h-[300px] md:min-h-[50vh] flex items-center justify-center">

        {loading && <div className="absolute inset-0 shimmer" />}

        {!loading && currentSrc && (
          <img
            key={currentIdx}
            src={currentSrc}
            alt={`Frame ${currentIdx + 1}`}
            className="w-full h-full object-contain max-h-[60vh] animate-fade-in"
          />
        )}

        {!loading && !currentSrc && (
          <div className="flex flex-col items-center justify-center text-white/30 space-y-4">
            <Film className="w-16 h-16" />
            <p>Failed to load frame</p>
          </div>
        )}

        {/* Prev / Next arrows — only show if multiple frames */}
        {!loading && total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-all backdrop-blur-sm border border-white/10 hover:border-white/30"
              aria-label="Previous frame"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-all backdrop-blur-sm border border-white/10 hover:border-white/30"
              aria-label="Next frame"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {!loading && total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentIdx ? 'bg-gold scale-125' : 'bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reveals area */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center min-h-[40px]">
        {(phase === 'year' || phase === 'genre') && year && (
          <div className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-white font-medium tracking-wide animate-slide-up backdrop-blur-md">
            <span className="text-white/50 text-xs uppercase tracking-widest mr-2">Year</span>{year}
          </div>
        )}
        {phase === 'genre' && genre && (
          <div
            className="px-6 py-2 rounded-full bg-gold/20 border border-gold/30 text-gold font-medium tracking-wide animate-slide-up backdrop-blur-md"
            style={{ animationDelay: '100ms' }}
          >
            <span className="text-gold/60 text-xs uppercase tracking-widest mr-2">Genre</span>{genre}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieFrame;
