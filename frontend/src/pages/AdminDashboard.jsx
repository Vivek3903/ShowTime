import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Users, Film, Trophy, TrendingUp, LogOut,
  Trash2, ChevronDown, ChevronUp, Calendar, ArrowLeft,
  LayoutDashboard, Star, Clock, Gamepad2, Activity, Search,
  Moon, Sun
} from 'lucide-react';
import axios from 'axios';

const BASE = 'http://localhost:3001/api/admin';
const apiClient = (token) =>
  axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` } });

/* ─── tiny helpers ─────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

/* ─── stat card ─────────────────────────────────────────────── */
const Stat = ({ icon: Icon, label, value, sub, colorClass }) => {
  // Extract background color to use for the hover ring
  const ringColor = colorClass.includes('bg-blue-100') ? 'group-hover:ring-blue-500' :
                    colorClass.includes('emerald') ? 'group-hover:ring-emerald-500' :
                    colorClass.includes('purple') ? 'group-hover:ring-purple-500' :
                    colorClass.includes('amber') ? 'group-hover:ring-amber-500' :
                    colorClass.includes('rose') ? 'group-hover:ring-rose-500' :
                    'group-hover:ring-cyan-500';

  return (
    <div className={`bg-white dark:bg-[#161622] rounded-2xl p-6 flex flex-col gap-3 group hover:-translate-y-1 hover:shadow-xl dark:shadow-none transition-all duration-300 animate-slide-up border border-slate-100 dark:border-white/10 relative overflow-hidden ${ringColor} hover:ring-1`}>
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] dark:opacity-10 group-hover:scale-150 transition-transform duration-700 ${colorClass.split(' ')[0]}`} />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
        <div className={`p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 ${colorClass} dark:bg-opacity-20`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-bold text-slate-800 dark:text-white">{value ?? '—'}</p>
        {sub && <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-medium">{sub}</p>}
      </div>
    </div>
  );
};

/* ─── sidebar nav item ──────────────────────────────────────── */
const NavItem = ({ icon: Icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden relative ${
      active 
        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20' 
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
    }`}
  >
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-md animate-fade-in" />}
    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:scale-110 group-hover:text-slate-700 dark:group-hover:text-white'}`} />
    <span className="flex-1 text-left relative z-10">{label}</span>
    {badge != null && (
      <span className={`text-xs px-2 py-0.5 rounded-full relative z-10 font-bold transition-colors ${
        active 
          ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' 
          : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/20'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

/* ─── sortable th ───────────────────────────────────────────── */
const Th = ({ children, field, sortField, sortDir, onSort }) => (
  <th
    className="text-left px-5 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors select-none group"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      {children}
      {sortField === field ? (
        sortDir === 'asc' ? <ChevronUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
      ) : (
        <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-30 transition-opacity" />
      )}
    </div>
  </th>
);

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('admin_token');
  const adminName = localStorage.getItem('admin_username') || 'Admin';

  const [view, setView]           = useState('overview');
  const [stats, setStats]         = useState(null);
  const [players, setPlayers]     = useState([]);
  const [movies, setMovies]       = useState([]);
  const [scores, setScores]       = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [sortField, setSortField] = useState('total_score');
  const [sortDir, setSortDir]     = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('admin_theme') === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('admin_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/admin');
  }, [navigate]);

  useEffect(() => {
    if (!token) { navigate('/admin'); return; }
    (async () => {
      setLoading(true);
      try {
        const c = apiClient(token);
        const [s, p, m, sc] = await Promise.all([
          c.get('/stats'), c.get('/players'), c.get('/movies'), c.get('/scores'),
        ]);
        setStats(s.data); setPlayers(p.data); setMovies(m.data); setScores(sc.data);
      } catch (e) { if (e.response?.status === 401) logout(); }
      finally { setLoading(false); }
    })();
  }, [token, logout]);

  const openPlayer = async (id) => {
    setDetailLoading(true);
    setView('player-detail');
    try {
      const { data } = await apiClient(token).get(`/players/${id}/stats`);
      setSelectedPlayer(data);
    } catch { setView('players'); }
    finally { setDetailLoading(false); }
  };

  const deletePlayer = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this player and all their scores?')) return;
    setDeletingId(id);
    try {
      await apiClient(token).delete(`/players/${id}`);
      setPlayers(p => p.filter(x => x.id !== id));
      if (selectedPlayer?.player?.id === id) setView('players');
    } catch { alert('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filteredPlayers = players.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()));
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const m = sortDir === 'asc' ? 1 : -1;
    return typeof a[sortField] === 'string'
      ? m * a[sortField].localeCompare(b[sortField])
      : m * ((a[sortField] ?? 0) - (b[sortField] ?? 0));
  });

  const filteredMovies = movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const thProps = { sortField, sortDir, onSort: toggleSort };

  if (loading) return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading Dashboard</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-800 dark:text-slate-200 flex font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      
      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="relative z-10 w-72 flex-shrink-0 bg-white dark:bg-[#12121a] border-r border-slate-200 dark:border-white/10 flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
        {/* Logo */}
        <div className="px-6 py-8 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">ShowTime</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold tracking-widest uppercase ml-14">Workspace</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider px-4 mb-3">Menu</p>
          <NavItem icon={LayoutDashboard} label="Overview"      active={view === 'overview'}      onClick={() => { setView('overview'); setSearchQuery(''); }} />
          <NavItem icon={Users}           label="Players"       active={view === 'players' || view === 'player-detail'} onClick={() => { setView('players'); setSearchQuery(''); }} badge={players.length} />
          <NavItem icon={Film}            label="Movies"        active={view === 'movies'}        onClick={() => { setView('movies'); setSearchQuery(''); }}  badge={movies.length} />
          <NavItem icon={Activity}        label="Recent Scores" active={view === 'scores'}        onClick={() => { setView('scores'); setSearchQuery(''); }}  badge={scores.length} />
        </nav>

        {/* User + Logout */}
        <div className="px-6 py-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-lg border border-indigo-200 dark:border-indigo-800">
                {adminName[0].toUpperCase()}
              </div>
              <div>
                <p className="text-slate-900 dark:text-white text-sm font-bold">{adminName}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Administrator</p>
              </div>
            </div>
            <button onClick={logout} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <main className="relative z-10 flex-1 overflow-auto bg-slate-50 dark:bg-transparent">
        <div className="p-10 max-w-7xl mx-auto space-y-10">
          
          {/* Top Bar with Theme Toggle */}
          <div className="flex justify-end mb-[-20px] relative z-20">
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#161622] border border-slate-200 dark:border-white/10 rounded-full shadow-sm text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {isDark ? (
                <><Sun className="w-4 h-4" /> Light Mode</>
              ) : (
                <><Moon className="w-4 h-4" /> Dark Mode</>
              )}
            </button>
          </div>

          {/* ── OVERVIEW ── */}
          {view === 'overview' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back, {adminName}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Here's what's happening in ShowTime today.</p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="animate-slide-up" style={{animationDelay: '50ms'}}>
                  <Stat icon={Users} label="Total Players" value={stats?.totalPlayers} sub="All-time registrations" colorClass="bg-blue-100 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="animate-slide-up" style={{animationDelay: '100ms'}}>
                  <Stat icon={Gamepad2} label="Total Games" value={stats?.totalGames} sub="Regular + daily combined" colorClass="bg-emerald-100 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="animate-slide-up" style={{animationDelay: '150ms'}}>
                  <Stat icon={Calendar} label="Daily Plays" value={stats?.dailyPlays} sub="Daily challenge sessions" colorClass="bg-purple-100 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="animate-slide-up" style={{animationDelay: '200ms'}}>
                  <Stat icon={Trophy} label="Average Score" value={stats?.avgScore} sub="Across all game sessions" colorClass="bg-amber-100 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="animate-slide-up" style={{animationDelay: '250ms'}}>
                  <Stat icon={Film} label="Movies in DB" value={stats?.totalMovies} sub="Active in game pool" colorClass="bg-rose-100 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="animate-slide-up" style={{animationDelay: '300ms'}}>
                  <Stat icon={Activity} label="Regular Games" value={stats ? stats.totalGames - stats.dailyPlays : 0} sub="Quick game sessions" colorClass="bg-cyan-100 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>

              {/* Top 5 players */}
              {players.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Top Performers</h2>
                  <div className="bg-white dark:bg-[#161622] rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                          <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Rank</th>
                          <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Player</th>
                          <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Games Played</th>
                          <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Cumulative Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {[...players].sort((a,b) => b.total_score - a.total_score).slice(0,5).map((p, i) => (
                          <tr key={p.id} onClick={() => openPlayer(p.id)} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                            <td className="px-6 py-4">
                              {i === 0 ? <span className="text-2xl">🥇</span> : i === 1 ? <span className="text-2xl">🥈</span> : i === 2 ? <span className="text-2xl">🥉</span> : <span className="text-slate-400 dark:text-slate-500 font-bold ml-2">#{i+1}</span>}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{p.username}</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{p.games_played}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                                {p.total_score}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PLAYERS LIST ── */}
          {view === 'players' && (
            <div className="animate-fade-in flex flex-col h-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Players Directory</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage and view player statistics</p>
                </div>
                <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#161622] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 font-medium transition-all shadow-sm dark:shadow-none"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-[#161622] rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">#</th>
                        <Th field="username"     {...thProps}>Username</Th>
                        <Th field="games_played" {...thProps}>Games Played</Th>
                        <Th field="total_score"  {...thProps}>Total Score</Th>
                        <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Join Date</th>
                        <th className="px-6 py-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {sortedPlayers.map((p, i) => (
                        <tr
                          key={p.id}
                          onClick={() => openPlayer(p.id)}
                          className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group animate-slide-up"
                          style={{animationDelay: `${i * 20}ms`}}
                        >
                          <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-medium text-xs">{i + 1}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{p.username}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{p.games_played}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-amber-600 dark:text-amber-500">{p.total_score}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">{fmt(p.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => deletePlayer(p.id, e)}
                              disabled={deletingId === p.id}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-all disabled:opacity-40 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                              title="Delete Player"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {sortedPlayers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                              <Users className="w-12 h-12 mb-3 text-slate-200 dark:text-slate-700" />
                              <p className="text-base font-medium">No players found</p>
                              <p className="text-sm mt-1">Try adjusting your search query.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── PLAYER DETAIL ── */}
          {view === 'player-detail' && (
            detailLoading ? (
               <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Loading player data...</p>
              </div>
            ) : selectedPlayer && (
              <div className="animate-fade-in space-y-6">
                <button
                  onClick={() => setView('players')}
                  className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-semibold py-2 px-4 bg-white dark:bg-[#161622] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:shadow-md dark:hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Players
                </button>

                {/* Player header */}
                <div className="bg-white dark:bg-[#161622] rounded-2xl p-8 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-4xl font-black text-indigo-600 dark:text-indigo-400 shadow-inner dark:shadow-none">
                      {selectedPlayer.player.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedPlayer.player.username}</h1>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Joined {fmt(selectedPlayer.player.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center px-6 py-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                      <p className="text-slate-900 dark:text-white text-3xl font-black">#{selectedPlayer.player.rank}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mt-0.5">Global Rank</p>
                    </div>
                    <button
                      onClick={(e) => deletePlayer(selectedPlayer.player.id, e)}
                      className="px-5 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-bold transition-colors text-sm flex items-center gap-2 border border-red-100 dark:border-red-500/20 shadow-sm dark:shadow-none"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Account
                    </button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Total Score',   value: selectedPlayer.player.totalScore,   icon: Trophy,   color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 hover:ring-amber-500' },
                    { label: 'Best Score',    value: selectedPlayer.player.bestScore,    icon: Star,     color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20 hover:ring-yellow-500' },
                    { label: 'Avg Score',     value: selectedPlayer.player.avgScore,     icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 hover:ring-emerald-500' },
                    { label: 'Total Games',   value: selectedPlayer.sessions.length,     icon: Gamepad2, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 hover:ring-blue-500' },
                    { label: 'Regular',       value: selectedPlayer.player.regularGames, icon: Activity, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/20 hover:ring-cyan-500' },
                    { label: 'Daily',         value: selectedPlayer.player.dailyGames,   icon: Calendar, color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 hover:ring-purple-500' },
                  ].map(({ label, value, icon: Icon, color }, i) => (
                    <div key={label} className={`bg-white dark:bg-[#161622] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:shadow-md hover:ring-1 transition-all animate-slide-up ${color.split(' ').find(c => c.startsWith('hover:ring-'))}`} style={{animationDelay: `${i*50}ms`}}>
                      <div className={`${color.replace(/hover:ring-[^\s]+/, '')} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-3xl font-black text-slate-800 dark:text-white">{value}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs mt-1 uppercase tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Game history */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Game History</h2>
                    {selectedPlayer.player.lastPlayed && (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium bg-white dark:bg-[#161622] px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                        <Clock className="w-4 h-4" />
                        Last played: {fmtTime(selectedPlayer.player.lastPlayed)}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white dark:bg-[#161622] rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                          <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">#</th>
                          <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Game Type</th>
                          <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Score</th>
                          <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Date & Time</th>
                          <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {selectedPlayer.sessions.map((s, i) => {
                          const maxPossible = s.game_type === 'daily' ? 10 : 50;
                          const pct = Math.round((s.total_score / maxPossible) * 100);
                          return (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-medium text-xs">{selectedPlayer.sessions.length - i}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                  s.game_type === 'daily' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                                }`}>{s.game_type}</span>
                              </td>
                              <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-base">{s.total_score}</td>
                              <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">{fmtTime(s.played_at)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-slate-100 dark:bg-white/10 rounded-full h-2 w-24 overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-1000 ${pct >= 70 ? 'bg-emerald-500 dark:bg-emerald-400' : pct >= 40 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-rose-500 dark:bg-rose-400'}`}
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-slate-500 dark:text-slate-400 font-bold text-xs w-8">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {selectedPlayer.sessions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                              No game sessions recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {/* ── MOVIES ── */}
          {view === 'movies' && (
            <div className="animate-fade-in flex flex-col h-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Movie Database</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{movies.length} movies currently in the game pool</p>
                </div>
                <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search titles..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#161622] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 font-medium transition-all shadow-sm dark:shadow-none"
                  />
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#161622] rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">#</th>
                        <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Title</th>
                        <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Year</th>
                        <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Genre</th>
                        <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Frames</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredMovies.map((m, i) => (
                        <tr 
                          key={m.id} 
                          className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors animate-slide-up"
                          style={{animationDelay: `${(i % 20) * 20}ms`}}
                        >
                          <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-medium text-xs">{i + 1}</td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{m.title}</td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{m.year || '—'}</td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]" title={m.genre}>{m.genre || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                              m.frames === 3 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                            }`}>
                              {m.frames} frame{m.frames !== 1 ? 's' : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredMovies.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                              <Film className="w-12 h-12 mb-3 text-slate-200 dark:text-slate-700" />
                              <p className="text-base font-medium">No movies found</p>
                              <p className="text-sm mt-1">Try adjusting your search query.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── RECENT SCORES ── */}
          {view === 'scores' && (
            <div className="animate-fade-in flex flex-col h-full">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Activity Feed</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Latest {scores.length} game sessions across the platform</p>
              </div>
              
              <div className="bg-white dark:bg-[#161622] rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                      <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Player</th>
                      <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Game Type</th>
                      <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Score</th>
                      <th className="text-left px-6 py-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Time Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {scores.map((s, i) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors animate-slide-up" style={{animationDelay: `${(i % 15) * 30}ms`}}>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{s.username}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            s.game_type === 'daily' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                          }`}>{s.game_type}</span>
                        </td>
                        <td className="px-6 py-4 font-black text-amber-600 dark:text-amber-500 text-base">{s.total_score}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{fmtTime(s.played_at)}</td>
                      </tr>
                    ))}
                    {scores.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">No game activity recorded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
    </div>
  );
}
