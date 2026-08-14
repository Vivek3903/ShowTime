import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const GuessInput = ({ titles = [], onGuess, disabled }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredTitles = useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return titles
      .filter(t => t.toLowerCase().includes(lowerQuery))
      .slice(0, 8);
  }, [query, titles]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredTitles.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTitles.length > 0 && isOpen) {
        handleSelect(filteredTitles[selectedIndex]);
      } else if (query) {
        // If they typed exact title or just want to submit
        handleSelect(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (title) => {
    setQuery('');
    setIsOpen(false);
    onGuess(title);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/50" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="block w-full pl-12 pr-4 py-4 bg-cinema-card/80 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-transparent transition-all shadow-lg text-lg"
          placeholder="Guess the movie..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {isOpen && filteredTitles.length > 0 && !disabled && (
        <ul className="absolute z-10 w-full mt-2 bg-cinema-card border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-slide-up backdrop-blur-xl">
          {filteredTitles.map((title, index) => (
            <li
              key={title}
              className={`px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-gold/20 text-gold' : 'text-white hover:bg-white/5'}`}
              onClick={() => handleSelect(title)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GuessInput;
