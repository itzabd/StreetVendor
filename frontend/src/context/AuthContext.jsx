import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabaseClient';
import axios from 'axios';

export const DEMO_IDENTITIES = {
  vendor: {
    user: { id: '00000000-0000-0000-0000-000000000001', email: 'demo.vendor@streetvendor.bd' },
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Rahim Uddin',
      phone: '+880 1711-234567',
      nid_number: '19922695412000341',
      role: 'vendor',
      status: 'active',
      home_address: 'House 14, Road 5, Mirpur-10, Dhaka',
      onboarding_completed: true,
      tin_number: '482910482911',
      business_name: "Rahim's Tea & Snacks",
      business_type: 'Tea & Light Refreshments',
      operating_hours: '07:00 AM - 10:00 PM',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    },
    token: 'demo-vendor-token'
  },
  admin: {
    user: { id: '00000000-0000-0000-0000-000000000002', email: 'demo.admin@streetvendor.bd' },
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Tanvir Ahmed',
      phone: '+880 1819-876543',
      nid_number: '19852695412000889',
      role: 'admin',
      status: 'active',
      home_address: 'City Corporation Zone Office, Dhaka North',
      onboarding_completed: true,
      tin_number: '992019482911',
      business_name: 'Dhaka North City Corporation (DNCC)',
      business_type: 'Urban Governance & Licensing',
      operating_hours: '09:00 AM - 05:00 PM',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    token: 'demo-admin-token'
  }
};

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [demoRole, setDemoRole] = useState(null);
  const [serviceStatus, setServiceStatus] = useState({ database: 'ok', api: 'ok' });

  // Fetch profile from backend
  async function fetchProfile(token) {
    if (isDemo && demoRole) {
      return DEMO_IDENTITIES[demoRole].profile;
    }
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/vendors/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      return res.data;
    } catch (err) {
      setProfile(null);
      if (!err.response) {
        setServiceStatus(prev => ({ ...prev, api: 'error' }));
      }
      return null;
    }
  }

  async function checkServiceHealth() {
    let dbStatus = 'ok';
    let apiStatus = 'ok';

    try {
      // Check API Connectivity
      try {
        await axios.get(`${import.meta.env.VITE_API_URL}/health`, { timeout: 4000 }).catch(err => {
          if (!err.response) apiStatus = 'error';
        });
      } catch {
        apiStatus = 'error';
      }

      // Check Supabase Connectivity (only warn if not in demo mode)
      try {
        const { error: dbError } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        if (dbError && (dbError.message?.includes('fetch') || dbError.code === 'PGRST301' || dbError.status === 0)) {
          dbStatus = 'error';
        }
      } catch {
        dbStatus = 'error';
      }

      setServiceStatus({ database: dbStatus, api: apiStatus });
    } catch {
      setServiceStatus({ database: 'ok', api: 'ok' });
    }
  }

  // Enter Demo Mode as Vendor or Admin
  function enterDemoMode(role = 'vendor') {
    const selected = DEMO_IDENTITIES[role] ? role : 'vendor';
    setIsDemo(true);
    setDemoRole(selected);
    setUser(DEMO_IDENTITIES[selected].user);
    setProfile(DEMO_IDENTITIES[selected].profile);
    localStorage.setItem('sv_demo_role', selected);
    setServiceStatus({ database: 'ok', api: 'ok' });
  }

  // Switch role between vendor and admin while in Demo Mode
  function switchDemoRole(newRole) {
    if (DEMO_IDENTITIES[newRole]) {
      setDemoRole(newRole);
      setUser(DEMO_IDENTITIES[newRole].user);
      setProfile(DEMO_IDENTITIES[newRole].profile);
      localStorage.setItem('sv_demo_role', newRole);
    }
  }

  // Exit Demo Mode
  function exitDemoMode() {
    setIsDemo(false);
    setDemoRole(null);
    localStorage.removeItem('sv_demo_role');
    setUser(null);
    setProfile(null);
  }

  useEffect(() => {
    // Check if user previously chosen demo mode
    const savedDemo = localStorage.getItem('sv_demo_role');
    if (savedDemo && DEMO_IDENTITIES[savedDemo]) {
      setIsDemo(true);
      setDemoRole(savedDemo);
      setUser(DEMO_IDENTITIES[savedDemo].user);
      setProfile(DEMO_IDENTITIES[savedDemo].profile);
      setLoading(false);
      return;
    }

    // Otherwise get initial Supabase session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.access_token);
      } catch (err) {
        console.warn("Auth initialization note:", err);
      } finally {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Only update if not in explicit demo mode
      if (!localStorage.getItem('sv_demo_role')) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.access_token);
        } else {
          setProfile(null);
        }
      }
    });

    // Initial health check
    checkServiceHealth();
    const healthInterval = setInterval(checkServiceHealth, 60000);

    return () => {
      subscription?.unsubscribe?.();
      clearInterval(healthInterval);
    };
  }, []);

  async function login(email, password) {
    exitDemoMode();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function logout() {
    if (isDemo) {
      exitDemoMode();
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function getToken() {
    if (isDemo && demoRole) {
      return DEMO_IDENTITIES[demoRole].token;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token;
    } catch {
      return null;
    }
  }

  async function refreshUser() {
    if (isDemo && demoRole) {
      return DEMO_IDENTITIES[demoRole].user;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.access_token);
      }
      return session?.user;
    } catch {
      return null;
    }
  }

  const isOnboarded = user && (isDemo || profile?.onboarding_completed);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      isOnboarded,
      isDemo,
      demoRole,
      enterDemoMode,
      switchDemoRole,
      exitDemoMode,
      serviceStatus,
      login,
      logout,
      getToken,
      refreshUser,
      checkServiceHealth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

