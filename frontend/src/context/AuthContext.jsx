import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabaseClient';
import axios from 'axios';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState({ database: 'ok', api: 'ok' });
  
  // Debug API URL
  useEffect(() => {
    console.log("Current API URL:", import.meta.env.VITE_API_URL);
  }, []);

  // Fetch profile from backend
  async function fetchProfile(token) {
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
      // 1. Check Supabase Connectivity
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
      if (dbError && (dbError.message.includes('fetch') || dbError.code === 'PGRST301' || dbError.status === 0)) {
        dbStatus = 'error';
      }

      // 2. Check API (Render) Connectivity
      try {
        await axios.get(`${import.meta.env.VITE_API_URL}/health`, { timeout: 5000 }).catch(err => {
          if (!err.response) apiStatus = 'error';
        });
      } catch {
        apiStatus = 'error';
      }

      setServiceStatus({ database: dbStatus, api: apiStatus });
    } catch (err) {
      setServiceStatus({ database: 'error', api: 'error' });
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.access_token);
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.access_token);
      } else {
        setProfile(null);
      }
    });

    // Initial health check
    checkServiceHealth();

    // Periodic health check every 60s
    const healthInterval = setInterval(checkServiceHealth, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(healthInterval);
    };
  }, []);

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function refreshUser() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchProfile(session.access_token);
    }
    return session?.user;
  }

    const isOnboarded = user && profile?.onboarding_completed;

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, isOnboarded, serviceStatus, login, logout, getToken, refreshUser, checkServiceHealth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
