import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabaseClient';
import axios from 'axios';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from backend
  async function fetchProfile(token) {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/vendors/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch {
      setProfile(null);
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

    return () => subscription.unsubscribe();
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
    <AuthContext.Provider value={{ user, profile, loading, login, logout, getToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
