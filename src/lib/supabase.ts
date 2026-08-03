import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_TABLE_DEFINITIONS, COMBINED_SUPABASE_SQL } from './supabase-schema';

export { SUPABASE_TABLE_DEFINITIONS, COMBINED_SUPABASE_SQL };

export interface SupabaseConfig {
  url: string;
  key: string;
}

// Helper to retrieve Supabase environment variables from Vite or Node
export function getEnvVars(): SupabaseConfig {
  let url = '';
  let key = '';

  // Check Vite client-side environment variables first
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const metaEnv = (import.meta as any).env;
      url = metaEnv.VITE_SUPABASE_URL || '';
      key = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.VITE_SUPABASE_KEY || '';
    }
  } catch (e) {
    // Ignore meta environment access error if outside Vite context
  }

  // Fallback to Node process.env if available
  if (!url && typeof process !== 'undefined' && process.env) {
    url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  }
  if (!key && typeof process !== 'undefined' && process.env) {
    key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  }

  return { url, key };
}

export function loadSupabaseConfig(): SupabaseConfig {
  let url = '';
  let key = '';

  // 1. Check environment variables (on server-side/Node context, env vars ALWAYS take absolute precedence)
  const envConfig = getEnvVars();
  if (envConfig.url && envConfig.key) {
    url = envConfig.url;
    key = envConfig.key;
  }

  // 2. Browser context localStorage check
  if (!url || !key) {
    if (typeof window !== 'undefined') {
      try {
        const storedUrl = localStorage.getItem('naimshop_supabase_url');
        const storedKey = localStorage.getItem('naimshop_supabase_key');
        if (storedUrl) url = storedUrl;
        if (storedKey) key = storedKey;
      } catch (e) {
        console.warn('Failed to read from localStorage');
      }
    }
  }

  // 3. Safe server-side check for local configuration file (fallback if env/localStorage not set)
  if (!url || !key) {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPaths = [
        path.join(process.cwd(), 'local_supabase_config.json'),
        path.join(__dirname, 'local_supabase_config.json'),
        path.join(__dirname, '..', 'local_supabase_config.json'),
        path.join(__dirname, '..', '..', 'local_supabase_config.json')
      ];
      for (const p of configPaths) {
        if (fs.existsSync(p)) {
          const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
          if (!url && data.url) url = data.url;
          if (!key && data.key) key = data.key;
          break;
        }
      }
    } catch (err) {
      // Ignore file reading errors in browser context
    }
  }

  return { url, key };
}

export function saveSupabaseConfig(config: SupabaseConfig): boolean {
  // Browser context save
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('naimshop_supabase_url', config.url);
      localStorage.setItem('naimshop_supabase_key', config.key);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  if (typeof window === 'undefined' && typeof process !== 'undefined' && process.cwd) {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPaths = [
        path.join(process.cwd(), 'local_supabase_config.json'),
        path.join(__dirname, 'local_supabase_config.json'),
        path.join(__dirname, '..', 'local_supabase_config.json'),
        path.join(__dirname, '..', '..', 'local_supabase_config.json')
      ];
      let saved = false;
      for (const p of configPaths) {
        try {
          const dir = path.dirname(p);
          if (fs.existsSync(dir)) {
            fs.writeFileSync(p, JSON.stringify(config, null, 2), 'utf-8');
            saved = true;
          }
        } catch (inner) {}
      }
      return saved;
    } catch (err) {
      console.error('Error saving local_supabase_config.json:', err);
      return false;
    }
  }
  return true;
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = loadSupabaseConfig();
  if (!config.url || !config.key) {
    return null;
  }

  try {
    return createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Initialize and export primary Supabase client using environment variables / configuration
const initialConfig = loadSupabaseConfig();
const supabaseUrl = initialConfig.url || 'https://placeholder.supabase.co';
const supabaseAnonKey = initialConfig.key || 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export function checkSupabaseConnection(): boolean {
  const client = getSupabaseClient();
  return client !== null;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string; tablesFound?: string[] }> {
  if (!url || !key) {
    return { success: false, message: 'Supabase URL and API Key are required.' };
  }

  try {
    const tempClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error } = await tempClient.from('settings').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! However, database tables have not been created yet.',
          tablesFound: []
        };
      }
      return { success: false, message: `Supabase Connection Error: ${error.message}` };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase PostgreSQL Database!'
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to connect to Supabase.' };
  }
}

export async function initSupabase(): Promise<boolean> {
  const config = loadSupabaseConfig();
  if (!config.url || !config.key) {
    console.warn('⚠️ Supabase credentials not found in environment variables or config file.');
    return false;
  }

  const client = getSupabaseClient();
  if (!client) return false;

  console.log(`✅ Supabase initialized for URL: ${config.url}`);
  return true;
}

export default supabase;
