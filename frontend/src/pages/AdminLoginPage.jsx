import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';
import axios from 'axios';

const AdminLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const getBaseUrl = () => {
        if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
        if (typeof window !== 'undefined') {
          return `http://${window.location.hostname}:3001/api`;
        }
        return 'http://localhost:3001/api';
      };
      const { data } = await axios.post(`${getBaseUrl()}/admin/login`, { username, password });
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_username', data.username);
      navigate('/admin/dashboard');
    } catch (err) {
      let errMsg = err.response?.data?.error || 'Login failed';
      if (typeof errMsg === 'object') errMsg = errMsg.message || JSON.stringify(errMsg);
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f1520] to-[#0a0a0f] z-0" />
      <div className="absolute inset-0 film-grain z-10" />

      <div className="z-20 w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-cinzel font-bold text-white mb-1 tracking-wider">Admin Portal</h1>
          <p className="text-white/40 text-sm tracking-widest uppercase">ShowTime Dashboard</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 rounded-2xl border border-white/10">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Username</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-transparent transition-all text-sm"
                placeholder="Enter admin username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-transparent transition-all text-sm"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
            >
              {isLoading ? (
                <span className="animate-pulse">Authenticating…</span>
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full text-center text-white/30 hover:text-white/60 text-sm transition-colors"
        >
          ← Back to ShowTime
        </button>
      </div>
    </div>
  );
};

export default AdminLoginPage;
