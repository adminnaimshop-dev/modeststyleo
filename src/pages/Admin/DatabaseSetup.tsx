import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Database, Key, Globe, Copy, Check, Code2 } from 'lucide-react';
import { COMBINED_SUPABASE_SQL } from '../../lib/supabase-schema';

export default function DatabaseSetup() {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/supabase/diagnostics');
      const data = await res.json();
      if (data.config) {
        setUrl(data.config.url || '');
        setKey(data.config.key || '');
      }
      setConnected(!!data.connected);
    } catch (err) {
      console.error('Failed to fetch Supabase config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setTesting(true);
    setMessage({ text: 'Testing connection to Supabase...', type: 'info' });
    try {
      const res = await fetch('/api/supabase/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, key })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Success! Connected to Supabase PostgreSQL Database.', type: 'success' });
        setConnected(true);
      } else {
        setMessage({ text: `Connection Failed: ${data.error || 'Check credentials'}`, type: 'error' });
        setConnected(false);
      }
    } catch (err: any) {
      setMessage({ text: `Error: ${err.message}`, type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(COMBINED_SUPABASE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (loading && !url) {
    return <div className="p-8 text-center font-bold text-gray-600">Loading Supabase settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-600" />
            Supabase Database Setup
          </h1>
          <p className="text-gray-500 text-sm">Configure your Supabase PostgreSQL project credentials.</p>
        </div>
        <div className={`px-3.5 py-1.5 text-xs rounded-full font-bold flex items-center gap-1.5 ${
          connected ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
        }`}>
          {connected ? (
            <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Connected</>
          ) : (
            <><AlertCircle className="w-4 h-4 text-amber-600" /> Not Connected</>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 font-semibold text-sm ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
          message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-600" /> Supabase Project URL
          </label>
          <input 
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
            value={url} 
            onChange={e => setUrl(e.target.value)}
            placeholder="https://xxxx.supabase.co"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-emerald-600" /> Supabase Anon / Service Role Key
          </label>
          <input 
            type="password"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
            value={key} 
            onChange={e => setKey(e.target.value)}
            placeholder="eyJhY2Nlc3NfdG9rZW4iOi..."
          />
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
          <button 
            onClick={handleSave} 
            disabled={testing}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-8 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 font-bold text-sm"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Save & Connect Supabase
          </button>

          <button
            onClick={handleCopySql}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-slate-200"
          >
            {copiedSql ? <Check size={14} className="text-emerald-600" /> : <Code2 size={14} />}
            <span>{copiedSql ? 'SQL Copied!' : 'Copy Supabase SQL Setup'}</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl shadow-sm border border-slate-800 space-y-4">
        <h3 className="font-bold text-emerald-400 flex items-center gap-2 text-base">
          <Code2 className="w-5 h-5" />
          Automated Table Creation Query for Supabase:
        </h3>
        <pre className="p-4 bg-slate-950 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
          {COMBINED_SUPABASE_SQL}
        </pre>
        <p className="text-xs text-slate-400">
          How to use: Copy the SQL above, navigate to your <b>Supabase Dashboard &gt; SQL Editor &gt; New Query</b>, paste and click <b>Run</b>. All tables will be created instantly.
        </p>
      </div>
    </div>
  );
}
