import { useState, useEffect } from 'react';

export const usePlayer = () => {
  const [player, setPlayerState] = useState(null);
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(true);

  useEffect(() => {
    const username = localStorage.getItem('showtime_username');
    const playerId = localStorage.getItem('showtime_playerId');
    if (username && playerId) {
      setPlayerState({ username, id: playerId });
    }
    setIsLoadingPlayer(false);
  }, []);

  const setPlayer = (username, id) => {
    localStorage.setItem('showtime_username', username);
    localStorage.setItem('showtime_playerId', id);
    setPlayerState({ username, id });
  };

  const clearPlayer = () => {
    localStorage.removeItem('showtime_username');
    localStorage.removeItem('showtime_playerId');
    setPlayerState(null);
  };

  return { player, setPlayer, clearPlayer, isLoadingPlayer };
};
