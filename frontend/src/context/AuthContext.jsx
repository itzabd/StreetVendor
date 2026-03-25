import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabaseClient';
import axios from 'axios';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serviceError, setServiceError] = useState(false);

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
      // If we get a network error (no response), it might be an API outage
      if (!err.response && err.request) {
        setServiceError(true);
      }
      return null;
    }
  }

  async function checkServiceHealth() {
    try {
      // 1. Check Supabase Connectivity
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
      const isDbDown = dbError && (dbError.message.includes('fetch') || dbError.code === 'PGRST301' || dbError.status === 0);

      // 2. Check API (Render) Connectivity
      let isApiDown = false;
      try {
        // Minor ping to the API. Accessing the root or an auth-less endpoint is best.
        // Assuming the base URL might have a health check or at least returns 200/404/401
        await axios.get(`${import.meta.env.VITE_API_URL}/health`, { timeout: 5000 }).catch(err => {
          // If no response, the server is unreachable
          if (!err.response) isApiDown = true;
        });
      } catch {
        isApiDown = true;
      }

      setServiceError(isDbDown || isApiDown);
    } catch (err) {
      setServiceError(true);
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.access_token);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    return user;
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, serviceError, login, logout, getToken, refreshUser, checkServiceHealth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
