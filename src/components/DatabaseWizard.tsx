import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Save, 
  Settings, 
  Globe, 
  Key, 
  Loader2, 
  Copy, 
  ExternalLink,
  Code2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from '../lib/safe-motion';
import { COMBINED_SUPABASE_SQL } from '../lib/supabase-schema';

interface DatabaseWizardProps {
  onComplete: () => void;
  targetAction?: string;
}

export default function DatabaseWizard({ onComplete, targetAction }: DatabaseWizardProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const fetchDiagnostics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/supabase/diagnostics');
      const data = await res.json();
      if (data.config) {
        setSupabaseUrl(data.config.url || '');
        setSupabaseKey(data.config.key || '');
      }
      setIsConnected(data.connected || false);
    } catch (err) {
      console.error('Error fetching Supabase diagnostics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setMessage({ type: 'error', text: 'Supabase URL and API Key are required.' });
      return;
    }

    setIsTesting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/supabase/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: supabaseUrl, key: supabaseKey })
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Network error testing Supabase connection.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/supabase/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: supabaseUrl, key: supabaseKey })
      });
      const data = await res.json();

      if (data.success) {
        setIsConnected(data.connected || true);
        setMessage({ type: 'success', text: 'Supabase credentials saved successfully!' });
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save configuration.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error saving Supabase settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(COMBINED_SUPABASE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Supabase Database Setup
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your Supabase PostgreSQL database for persistent storage
              </p>
            </div>
          </div>
          {isConnected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={14} /> Connected
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {targetAction && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2.5">
              <ShieldAlert size={16} className="shrink-0" />
              <span><b>Database Required:</b> "{targetAction}" needs an active database connection.</span>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : message.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
              <div>{message.text}</div>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe size={14} className="text-emerald-400" /> Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key size={14} className="text-emerald-400" /> Supabase Anon Key / Service Role Key
              </label>
              <input
                type="password"
                placeholder="eyJhY2Nlc3NfdG9rZW4iOi..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-xs"
                required
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || isLoading}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-700 disabled:opacity-50"
                >
                  {isTesting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  <span>Test Connection</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSqlModal(!showSqlModal)}
                  className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 border border-emerald-500/20"
                >
                  <Code2 size={14} />
                  <span>View Database SQL Schema</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onComplete}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-semibold transition-colors"
                >
                  Skip for Now (Demo Store Mode)
                </button>

                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save & Connect</span>
                </button>
              </div>
            </div>
          </form>

          {/* SQL Modal / Code Block */}
          <AnimatePresence>
            {showSqlModal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Code2 size={14} className="text-emerald-400" />
                    <span>Supabase SQL Setup Query (Paste into Supabase SQL Editor)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition-colors"
                  >
                    {copiedSql ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                  {COMBINED_SUPABASE_SQL}
                </pre>
                <p className="text-[11px] text-slate-400">
                  Tip: Go to your Supabase Dashboard &gt; SQL Editor &gt; New Query &gt; Paste and click <b>Run</b> to set up all tables instantly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
