import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

export const createPlayer = async (username) => {
  const { data } = await api.post('/players', { username });
  return data;
};

export const getMovieTitles = async () => {
  const { data } = await api.get('/movies/titles');
  return data;
};

export const startRegularGame = async (playerId) => {
  const { data } = await api.get(`/game/regular?playerId=${playerId}`);
  return data;
};

export const startDailyGame = async (playerId) => {
  const { data } = await api.get(`/game/daily?playerId=${playerId}`);
  return data;
};

export const verifyGuess = async (movieId, guess) => {
  const { data } = await api.post('/game/verify-guess', { movieId, guess });
  return data;
};

export const submitScore = async (gameToken, playerId, rounds) => {
  const { data } = await api.post('/game/score', { gameToken, playerId, rounds });
  return data;
};

export const getLeaderboard = async () => {
  const { data } = await api.get('/leaderboard');
  return data;
};

export const getFrameUrl = (framePath) => {
  if (!framePath) return '';
  // framePath is like "Bahubali The Beginning/frame_25percent.jpg"
  // static server mounts at /frames, so prepend it and encode spaces
  const encoded = framePath.split('/').map(encodeURIComponent).join('/');
  const getStaticBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace('/api', '');
    if (typeof window !== 'undefined') {
      return `http://${window.location.hostname}:3001`;
    }
    return 'http://localhost:3001';
  };
  return `${getStaticBaseUrl()}/frames/${encoded}`;
};

export default api;
