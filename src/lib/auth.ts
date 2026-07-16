// Client-side Auth compatibility layer routing to Hostinger MySQL API endpoints
export type AuthClient = any;

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
  };
}

class MySQLAuthCompatibility {
  private listeners: Array<(event: string, session: Session | null) => void> = [];

  constructor() {
    // Check initial session from storage
    setTimeout(() => {
      const session = this.getLocalSession();
      this.triggerListeners('SIGNED_IN', session);
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
              full_name: u.name,
              name: u.name,
              phone: u.phone,
              avatar_url: u.photo
            },
            phone: u.phone
          }
        };
      }
    } catch (e) {
      console.error('Error parsing local customer session:', e);
    }
    return null;
  }

  private saveLocalSession(user: any) {
    const userData = {
      id: user.id,
      uid: user.id,
      name: user.full_name || 'Customer',
      email: user.email,
      phone: user.phone || '',
      photo: user.avatar_url || '',
      role: user.role || 'customer',
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem('loggedInCustomer', JSON.stringify(userData));
    if (userData.role === 'admin') {
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('adminEmail', userData.email);
    }
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
    try {
      const res = await fetch('/api/auth/session');
      if (!res.ok) throw new Error('Failed to fetch session');
      const data = await res.json();
      if (data.session) {
        this.saveLocalSession(data.session.user);
        return { data: { session: data.session }, error: null };
      }
    } catch (e) {
      // fallback to local
    }
    const local = this.getLocalSession();
    return { data: { session: local }, error: null };
  }

  async signInWithPassword({ email, password }: any) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { data: { user: null }, error: new Error(data.error || 'Authentication failed') };
      }
      this.saveLocalSession(data.user);
      const session = this.getLocalSession();
      this.triggerListeners('SIGNED_IN', session);
      return { data: { user: session?.user }, error: null };
    } catch (err: any) {
      return { data: { user: null }, error: err };
    }
  }

  async signUp({ email, password, options }: any) {
    try {
      const fullName = options?.data?.full_name || options?.data?.name || '';
      const phone = options?.data?.phone || '';
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { data: { user: null }, error: new Error(data.error || 'Registration failed') };
      }
      this.saveLocalSession(data.user);
      const session = this.getLocalSession();
      this.triggerListeners('SIGNED_IN', session);
      return { data: { user: session?.user }, error: null };
    } catch (err: any) {
      return { data: { user: null }, error: err };
    }
  }

  async signOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    this.clearLocalSession();
    this.triggerListeners('SIGNED_OUT', null);
    return { error: null };
  }

  async resetPasswordForEmail(email: string, options: any = {}) {
    // Custom mock password reset via API
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { error: new Error(data.error || 'Reset password request failed') };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  async signInWithOtp({ email, options }: any) {
    try {
      const res = await fetch('/api/auth/otp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { error: new Error(data.error || 'OTP send failed') };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  async verifyOtp({ email, token, type }: any) {
    try {
      const res = await fetch('/api/auth/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      });
      const data = await res.json();
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
    console.warn('OAuth is simulated in preview for provider:', provider);
    // Simulate google/facebook sign in by redirecting to account tab with mock session
    setTimeout(() => {
      window.location.href = options?.redirectTo || window.location.origin + '/account';
    }, 500);
    return { error: null };
  }

  async updateUser({ password }: any) {
    try {
      const loggedInCustomer = localStorage.getItem('loggedInCustomer');
      const email = loggedInCustomer ? JSON.parse(loggedInCustomer).email : null;
      if (!email) throw new Error('No user is logged in');

      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { error: new Error(data.error || 'Update password failed') };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }
}

// Instantiate mock compatibility client
export const authClient = {
  auth: new MySQLAuthCompatibility()
} as unknown as AuthClient;

export function getAuthClient() { return authClient; }

export function checkAuthConnection(): boolean {
  // Always true for backward compatibility so frontend knows Auth is active
  return true;
}
