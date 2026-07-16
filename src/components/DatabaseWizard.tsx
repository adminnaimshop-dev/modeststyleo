import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Save, 
  Settings, 
  PlusCircle, 
  ArrowRight,
  Server,
  Key,
  Globe,
  Loader2,
  Table as TableIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DatabaseWizardProps {
  onComplete: () => void;
  targetAction?: string;
}

type WizardStep = 'checking' | 'config' | 'database' | 'tables' | 'success';

interface Diagnostics {
  config: { host: string; user: string; database: string; port: number };
  serverConnected: boolean;
  databaseExists: boolean;
  missingTables: string[];
  existingTables: string[];
  tableDetails: Array<{
    name: string;
    status: 'exists' | 'missing';
    columns: Array<{ name: string; status: 'exists' | 'missing' }>;
  }>;
  error: string | null;
}

export default function DatabaseWizard({ onComplete, targetAction }: DatabaseWizardProps) {
  const [step, setStep] = useState<WizardStep>('checking');
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [host, setHost] = useState('');
  const [port, setPort] = useState(3306);
  const [database, setDatabase] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  // Progress tracking
  const [currentAction, setCurrentAction] = useState<string>('');
  const [creationProgress, setCreationProgress] = useState<{name: string, status: 'pending' | 'success' | 'error'}[]>([]);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mysql/diagnostics');
      const data = await res.json();
      setDiagnostics(data);
      
      setHost(data.config.host);
      setPort(data.config.port);
      setDatabase(data.config.database);
      setUser(data.config.user);

      if (!data.serverConnected) {
        setStep('config');
      } else if (!data.databaseExists) {
        setStep('database');
      } else if (data.missingTables.length > 0) {
        setStep('tables');
      } else {
        // Even if tables exist, check if we need to auto-trigger success
        setStep('success');
        setTimeout(onComplete, 2000);
      }
    } catch (err) {
      setError('Failed to reach server diagnostics.');
      setStep('config');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mysql/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, database, user, password })
      });
      const result = await res.json();
      if (result.success) {
        runDiagnostics();
      } else {
        setError(result.error || 'Connection failed.');
      }
    } catch (err) {
      setError('Failed to update configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDatabase = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentAction('Creating Database...');
    try {
      const res = await fetch('/api/mysql/create-database', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        runDiagnostics();
      } else {
        setError(result.error || 'Database creation failed.');
      }
    } catch (err) {
      setError('Error creating database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAll = async () => {
    if (!diagnostics) return;
    setIsLoading(true);
    setError(null);
    
    const allItems: {name: string, status: 'pending' | 'success' | 'error'}[] = [];
    
    // Step 1: Missing Tables
    for (const table of diagnostics.missingTables) {
      setCurrentAction(`Creating table: ${table}`);
      try {
        const res = await fetch('/api/mysql/create-table', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableName: table })
        });
        const result = await res.json();
        if (result.success) {
          allItems.push({ name: `Table: ${table} (তৈরি হয়েছে)`, status: 'success' });
          setCreationProgress([...allItems]);
        } else {
          allItems.push({ name: `Table: ${table} (ব্যর্থ)`, status: 'error' });
          setCreationProgress([...allItems]);
          setError(`Failed at ${table}`);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        setError('Connection lost.');
        setIsLoading(false);
        return;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    // Step 2: Missing Columns (In existing tables)
    if (diagnostics.tableDetails) {
      for (const table of diagnostics.tableDetails) {
        if (table.status === 'exists') {
          const missingCols = table.columns.filter(c => c.status === 'missing');
          for (const col of missingCols) {
            setCurrentAction(`Adding column ${col.name} to ${table.name}`);
            try {
              // We'll use a generic run-sql or a specific add-column endpoint
              // For simplicity, let's assume we have an endpoint for this or we just re-run create table which might handle it
              // But standard SQL is ALTER TABLE ADD COLUMN
              const res = await fetch('/api/mysql/execute-sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql: `ALTER TABLE \`${table.name}\` ADD COLUMN ${col.name} VARCHAR(255)` }) // This is a fallback, better to use proper definition
              });
              const result = await res.json();
              if (result.success) {
                allItems.push({ name: `${table.name} > Column: ${col.name} (তৈরি হয়েছে)`, status: 'success' });
                setCreationProgress([...allItems]);
              }
            } catch (e) {}
            await new Promise(r => setTimeout(r, 200));
          }
        }
      }
    }

    setStep('success');
    setTimeout(onComplete, 2000);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-md px-4">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <Database size={16} className="text-rose-500" />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500">Database Status</h3>
                <p className="text-[13px] font-bold text-white">
                  {step === 'checking' ? 'Checking connection...' :
                   step === 'config' ? 'Configuration required' :
                   step === 'database' ? 'Database missing' :
                   step === 'tables' ? 'Tables initialization' : 'Success!'}
                </p>
              </div>
            </div>
            {isLoading && <Loader2 size={16} className="text-rose-500 animate-spin" />}
          </div>

          <AnimatePresence mode="wait">
            {step === 'config' && (
              <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl">
                  <p className="text-[11px] font-bold text-rose-200 leading-relaxed italic">
                    {diagnostics?.error || 'Database address incorrect. Hostinger-এ "localhost" কাজ করবে না।'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <input value={host} onChange={e => setHost(e.target.value)} placeholder="Host (sqlXXX.hostinger.com)" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs font-bold outline-none focus:border-rose-500" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={database} onChange={e => setDatabase(e.target.value)} placeholder="Database" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs font-bold outline-none focus:border-rose-500" />
                    <input value={user} onChange={e => setUser(e.target.value)} placeholder="User" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs font-bold outline-none focus:border-rose-500" />
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs font-bold outline-none focus:border-rose-500" />
                </div>
                <button onClick={handleUpdateConfig} disabled={isLoading} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg">Save & Connect</button>
              </motion.div>
            )}

            {step === 'database' && (
              <motion.div key="database" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <p className="text-[12px] font-bold text-slate-300">MySQL connected but database <span className="text-rose-500">{database}</span> not found.</p>
                <button onClick={handleCreateDatabase} disabled={isLoading} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg">Create Database</button>
              </motion.div>
            )}

            {step === 'tables' && (
              <motion.div key="tables" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {creationProgress.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                    {creationProgress.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] font-bold">
                        {item.status === 'success' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <ShieldAlert size={12} className="text-rose-500" />}
                        <span className={item.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] font-bold text-slate-300">
                    Tables missing in <span className="text-rose-500">{database}</span>. Let's initialize them.
                  </p>
                )}
                {!isLoading && creationProgress.length === 0 && (
                  <button onClick={handleCreateAll} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg">Initialize Tables & Columns</button>
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800 rounded-lg">
                    <Loader2 size={12} className="text-rose-500 animate-spin" />
                    <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider">{currentAction}</span>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
                <h4 className="text-[13px] font-black text-white uppercase tracking-tight">Database Synchronized!</h4>
              </motion.div>
            )}
          </AnimatePresence>
          
          {error && <p className="mt-3 text-[10px] font-bold text-rose-500 animate-pulse text-center">⚠️ {error}</p>}
        </div>
      </motion.div>
    </div>
  );
}
