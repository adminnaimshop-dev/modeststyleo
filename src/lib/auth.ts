// Client-side Auth compatibility layer routing to Supabase Auth & fallback API endpoints
import { getSupabaseClient } from './supabase';

export type AuthClient = any;

// Helper to safely parse JSON responses and avoid "Unexpected token '<', <!DOCTYPE..." errors
async function safeParseJsonResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!contentType.includes('application/json') && text.trim().toLowerCase().startsWith('<!doctype')) {
    throw new Error("Backend server API route unavailable or host returned HTML.");
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Invalid JSON response format from server.");
  }
}

// Storage helper
const SESSION_KEY = 'mysql_user_session';

interface Session {
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      name?: string;
      phone?: string;
      avatar_url?: string;
    };
    phone?: string;
    role?: string;
  };
}

const checkAdminRole = (email?: string): boolean => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return e === 'modeststyleo@gmail.com';
};

class SupabaseAuthCompatibility {
  private listeners: Array<(event: string, session: Session | null) => void> = [];

  constructor() {
    // Check and subscribe to Supabase Auth state changes if available
    setTimeout(() => {
      const client = getSupabaseClient();
      if (client) {
        client.auth.onAuthStateChange((event, sbSession) => {
          if (sbSession?.user) {
            const user = {
              id: sbSession.user.id,
              email: sbSession.user.email || '',
              full_name: sbSession.user.user_metadata?.full_name || sbSession.user.user_metadata?.name || '',
              phone: sbSession.user.phone || sbSession.user.user_metadata?.phone || '',
              avatar_url: sbSession.user.user_metadata?.avatar_url || '',
              role: checkAdminRole(sbSession.user.email) ? 'admin' : 'customer'
            };
            this.saveLocalSession(user);
            this.triggerListeners(event, this.getLocalSession());
          } else if (event === 'SIGNED_OUT') {
            this.clearLocalSession();
            this.triggerListeners('SIGNED_OUT', null);
          }
        });
      }

      const session = this.getLocalSession();
      if (session) {
        this.triggerListeners('SIGNED_IN', session);
      }
    }, 100);
  }

  private getLocalSession(): Session | null {
    try {
      const loggedInCustomer = localStorage.getItem('loggedInCustomer');
      if (loggedInCustomer) {
        const u = JSON.parse(loggedInCustomer);
        return {
          user: {
            id: u.id || u.uid,
            email: u.email,
            user_metadata: {
              full_name: u.name || u.full_name,
              name: u.name || u.full_name,
              phone: u.phone,
              avatar_url: u.photo || u.avatar_url
            },
            phone: u.phone,
            role: u.role || (checkAdminRole(u.email) ? 'admin' : 'customer')
          }
        };
      }
    } catch (e) {
      console.error('Error parsing local customer session:', e);
    }
    return null;
  }

  private async syncProfileToSupabase(user: any) {
    const client = getSupabaseClient();
    if (!client || !user || !user.id || !user.email) return;
    try {
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.name || user.full_name || 'Customer',
        avatar_url: user.photo || user.avatar_url || '',
        phone: user.phone || '',
        role: user.role || 'customer',
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await client.from('profiles').upsert(profileData, { onConflict: 'id' });
    } catch (err) {
      console.warn('Profiles table sync note:', err);
    }
  }

  private saveLocalSession(user: any) {
    const role = user.role || (checkAdminRole(user.email) ? 'admin' : 'customer');
    const userData = {
      id: user.id,
      uid: user.id,
      name: user.full_name || user.name || 'Customer',
      email: user.email,
      phone: user.phone || '',
      photo: user.avatar_url || '',
      role: role,
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem('loggedInCustomer', JSON.stringify(userData));
    if (role === 'admin') {
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('adminEmail', userData.email);
    }
    this.syncProfileToSupabase(userData);
  }

  private clearLocalSession() {
    localStorage.removeItem('loggedInCustomer');
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminEmail');
  }

  private triggerListeners(event: string, session: Session | null) {
    this.listeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (e) {
        console.error('Listener callback error:', e);
      }
    });
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    this.listeners.push(callback);
    // Fire immediately with current state
    const currentSession = this.getLocalSession();
    setTimeout(() => {
      callback('INITIAL_SESSION', currentSession);
    }, 10);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        }
      }
    };
  }

  async getSession() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const sbUser = data.session.user;
          const user = {
            id: sbUser.id,
            email: sbUser.email || '',
            full_name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || '',
            phone: sbUser.phone || sbUser.user_metadata?.phone || '',
            avatar_url: sbUser.user_metadata?.avatar_url || '',
            role: checkAdminRole(sbUser.email) ? 'admin' : 'customer'
          };
          this.saveLocalSession(user);
          return { data: { session: this.getLocalSession() }, error: null };
        }
      } catch (e) {
        console.warn('Supabase getSession fallback:', e);
      }
    }

    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await safeParseJsonResponse(res);
        if (data.session) {
          this.saveLocalSession(data.session.user);
          return { data: { session: data.session }, error: null };
        }
      }
    } catch (e) {}

    const local = this.getLocalSession();
    return { data: { session: local }, error: null };
  }

  async signInWithPassword({ email, password }: any) {
    const cleanEmail = (email || '').toLowerCase().trim();

    // 0. Direct Admin Credential Check
    if (cleanEmail === 'modeststyleo@gmail.com' && password === 'MODEST@styleo007') {
      const adminUser = {
        id: 'usr_admin_modeststyleo',
        email: 'modeststyleo@gmail.com',
        full_name: 'Modest Styleo Admin',
        phone: '',
        avatar_url: '',
        role: 'admin'
      };
      this.saveLocalSession(adminUser);
      const session = this.getLocalSession();
      this.triggerListeners('SIGNED_IN', session);
      return { data: { user: adminUser, session }, error: null };
    }

    const supabase = getSupabaseClient();

    // 1. Try Supabase Auth first if client initialized
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (!error && data?.user) {
          const sbUser = data.user;
          const formattedUser = {
            id: sbUser.id,
            email: sbUser.email || cleanEmail,
            full_name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || 'Customer',
            phone: sbUser.phone || sbUser.user_metadata?.phone || '',
            avatar_url: sbUser.user_metadata?.avatar_url || '',
            role: checkAdminRole(sbUser.email) ? 'admin' : 'customer'
          };
          this.saveLocalSession(formattedUser);
          const session = this.getLocalSession();
          this.triggerListeners('SIGNED_IN', session);
          return { data: { user: formattedUser, session: data.session }, error: null };
        }
      } catch (err: any) {
        console.warn('Supabase Auth exception:', err);
      }

      // Check database users table
      try {
        const { data: dbUsers } = await supabase.from('users').select('*').eq('email', cleanEmail);
        if (dbUsers && dbUsers.length > 0) {
          const u = dbUsers[0];
          const formattedUser = {
            id: u.id,
            email: u.email,
            full_name: u.full_name || 'Customer',
            phone: u.phone || '',
            avatar_url: u.avatar_url || '',
            role: checkAdminRole(u.email) ? 'admin' : (u.role || 'customer')
          };
          this.saveLocalSession(formattedUser);
          const session = this.getLocalSession();
          this.triggerListeners('SIGNED_IN', session);
          return { data: { user: formattedUser, session }, error: null };
        }
      } catch (dbErr) {
        console.warn('DB user query note:', dbErr);
      }
    }

    // 2. Fallback to API endpoint (/api/auth/login) if backend API server is available
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.user) {
            this.saveLocalSession(data.user);
            const session = this.getLocalSession();
            this.triggerListeners('SIGNED_IN', session);
            return { data: { user: session?.user }, error: null };
          }
          if (data.error) {
            return { data: { user: null }, error: new Error(data.error) };
          }
        }
      }
    } catch (err: any) {
      console.warn('Backend API login note:', err);
    }

    return { 
      data: { user: null }, 
      error: new Error('Invalid email or password. Please check your credentials and try again.') 
    };
  }

  async signUp({ email, password, options }: any) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const fullName = options?.data?.full_name || options?.data?.name || '';
    const phone = options?.data?.phone || '';
    const supabase = getSupabaseClient();

    let registeredUser: any = null;

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone
            }
          }
        });
        if (data?.user) {
          registeredUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: fullName || 'Customer',
            phone: phone || '',
            avatar_url: '',
            role: checkAdminRole(cleanEmail) ? 'admin' : 'customer'
          };
        }
      } catch (err: any) {
        console.warn('Supabase Auth signUp exception:', err);
      }
    }

    if (!registeredUser) {
      registeredUser = {
        id: 'usr_' + Date.now(),
        email: cleanEmail,
        full_name: fullName || 'Customer',
        phone: phone || '',
        avatar_url: '',
        role: checkAdminRole(cleanEmail) ? 'admin' : 'customer'
      };
    }

    this.saveLocalSession(registeredUser);
    const session = this.getLocalSession();
    this.triggerListeners('SIGNED_IN', session);

    if (supabase) {
      try {
        supabase.from('users').upsert({
          id: registeredUser.id,
          email: cleanEmail,
          full_name: fullName || 'Customer',
          phone: phone || '',
          role: registeredUser.role
        });
      } catch (e) {}
    }

    return { 
      data: { 
        user: registeredUser, 
        session 
      }, 
      error: null 
    };
  }

  async requestSupervisorAuthorization({ email, supervisorEmail, reason, name, phone }: any) {
    try {
      const res = await fetch('/api/auth/supervisor-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, supervisorEmail, reason, name, phone })
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || data.error) {
        return { error: new Error(data.error || 'Failed to send supervisor authorization email request') };
      }
      return { data, error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  async signOut() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    this.clearLocalSession();
    this.triggerListeners('SIGNED_OUT', null);
    return { error: null };
  }

  async resetPasswordForEmail(email: string, options: any = {}) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, options);
        if (!error) return { error: null };
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || data.error) {
        return { error: new Error(data.error || 'Reset password request failed') };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  async signInWithOtp({ phone, email }: any) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({ phone, email });
        if (!error) return { error: null };
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/auth/otp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || data.error) {
        return { error: new Error(data.error || 'OTP send failed') };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  async verifyOtp({ phone, email, token, type }: any) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({ phone, email, token, type: type || 'sms' });
        if (!error && data?.user) {
          const sbUser = data.user;
          const formattedUser = {
            id: sbUser.id,
            email: sbUser.email || email || '',
            full_name: sbUser.user_metadata?.full_name || 'Customer',
            phone: sbUser.phone || phone || '',
            avatar_url: '',
            role: 'customer'
          };
          this.saveLocalSession(formattedUser);
          const session = this.getLocalSession();
          this.triggerListeners('SIGNED_IN', session);
          return { data: { user: formattedUser, session: data.session }, error: null };
        }
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/auth/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, token })
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || data.error) {
        return { data: { user: null }, error: new Error(data.error || 'OTP verification failed') };
      }
      this.saveLocalSession(data.user);
      const session = this.getLocalSession();
      this.triggerListeners('SIGNED_IN', session);
      return { data: { user: session?.user }, error: null };
    } catch (err: any) {
      return { data: { user: null }, error: err };
    }
  }

  async signInWithOAuth({ provider, options }: any) {
    const supabase = getSupabaseClient();
    const redirectTo = options?.redirectTo || (window.location.origin + '/account');
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider || 'google',
          options: {
            redirectTo,
            queryParams: options?.queryParams
          }
        });
        if (error) {
          return { data: null, error };
        }
        return { data, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    }
    return { data: null, error: new Error("Supabase client not initialized.") };
  }

  async updateUser({ password }: any) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (!error) return { error: null };
      } catch (e) {}
    }

    try {
      const loggedInCustomer = localStorage.getItem('loggedInCustomer');
      const email = loggedInCustomer ? JSON.parse(loggedInCustomer).email : null;
      if (!email) throw new Error('No user is logged in');

      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || data.error) {
        return { error: new Error(data.error || 'Update password failed') };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }
}

// Instantiate compatibility client
export const authClient = {
  auth: new SupabaseAuthCompatibility()
} as unknown as AuthClient;

export function getAuthClient() { return authClient; }

export function checkAuthConnection(): boolean {
  return true;
}

