/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { authClient } from '../lib/auth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('modeststyleo@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await authClient.auth.signInWithPassword({ email, password });

      if (error) {
        throw new Error(error.message || 'Login failed. Please check your credentials.');
      }

      if (data?.user) {
        if (data.user.role === 'admin') {
          localStorage.setItem("adminAuth", "true");
          localStorage.setItem("adminEmail", data.user.email);
          localStorage.setItem("loggedInCustomer", JSON.stringify(data.user));
          navigate('/admin');
        } else {
          setError('You do not have administrator privileges');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Incorrect administrator credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container flex flex-col items-center justify-center bg-slate-50 min-h-screen px-4 py-8">
      {/* Header Back button */}
      <div className="absolute top-4 left-4">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-xs text-slate-500 font-bold border-none bg-transparent hover:text-black cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="w-full max-w-sm bg-white rounded-lg border border-slate-200 p-8 shadow-xl shadow-black/5 mt-12 mb-20 animate-fade-in">
        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-10 h-10 bg-black text-white rounded-md flex items-center justify-center shadow-lg shadow-black/10 mb-4">
            <Shield size={20} />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Merchant Portal</h2>
          <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">Administrative Access</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg text-[10px] font-black uppercase tracking-wider mb-6 flex items-center gap-2 animate-shake">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <div className="relative group">
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full h-11 border border-slate-200 bg-slate-50 rounded-lg pl-10 pr-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-black focus:bg-white transition-all"
                placeholder="admin@example.com"
              />
              <Mail size={14} className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-black transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Security Key</label>
            </div>
            <div className="relative group">
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full h-11 border border-slate-200 bg-slate-50 rounded-lg pl-10 pr-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-black focus:bg-white transition-all"
                placeholder="••••••••"
              />
              <Key size={14} className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-black transition-colors" />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 mt-2 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-75 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>Authorize & Enter</span>
            )}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
