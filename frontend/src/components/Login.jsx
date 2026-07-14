import React, { useState } from 'react';
import axios from 'axios';
import { Bot, ShieldAlert, Sparkles, LogIn, UserCheck, ShieldCheck } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e, customEmail = null, customPassword = null) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    if (!loginEmail || !loginPassword) {
      setError('Please fill in all credentials.');
      setLoading(false);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });

      const { token, user } = response.data;
      onLoginSuccess(token, user);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleShortcutLogin = (roleType) => {
    let targetEmail = '';
    let targetPassword = '';

    if (roleType === 'admin') {
      targetEmail = 'admin@ethara.ai';
      targetPassword = 'admin123';
    } else if (roleType === 'hr') {
      targetEmail = 'hr@ethara.ai';
      targetPassword = 'hr123';
    } else if (roleType === 'employee') {
      targetEmail = 'amit@ethara.ai';
      targetPassword = 'amit123';
    }

    setEmail(targetEmail);
    setPassword(targetPassword);
    handleSubmit(null, targetEmail, targetPassword);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-4">Ethara Space</h2>
          <p className="text-sm text-slate-400">Seat Allocation & Project Mapping System</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl relative">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <LogIn className="h-5 w-5 text-indigo-400" /> Account Authentication
          </h3>

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold flex items-center gap-1.5 animate-shake">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="name@ethara.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 font-semibold text-sm text-white rounded-xl shadow-lg transition duration-150 flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Preset Account Access Section */}
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
              Quick Sandbox Logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleShortcutLogin('admin')}
                disabled={loading}
                className="py-2.5 px-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition group disabled:opacity-50"
              >
                <ShieldCheck className="h-4.5 w-4.5 text-indigo-400 group-hover:scale-110 transition" />
                <span className="text-[10px] font-bold text-white">Admin</span>
                <span className="text-[8px] text-slate-500">Full Rights</span>
              </button>

              <button
                type="button"
                onClick={() => handleShortcutLogin('hr')}
                disabled={loading}
                className="py-2.5 px-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition group disabled:opacity-50"
              >
                <UserCheck className="h-4.5 w-4.5 text-cyan-400 group-hover:scale-110 transition" />
                <span className="text-[10px] font-bold text-white">HR Manager</span>
                <span className="text-[8px] text-slate-500">Staff Maps</span>
              </button>

              <button
                type="button"
                onClick={() => handleShortcutLogin('employee')}
                disabled={loading}
                className="py-2.5 px-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition group disabled:opacity-50"
              >
                <Bot className="h-4.5 w-4.5 text-emerald-400 group-hover:scale-110 transition" />
                <span className="text-[10px] font-bold text-white">Amit (Staff)</span>
                <span className="text-[8px] text-slate-500">Read-Only</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
