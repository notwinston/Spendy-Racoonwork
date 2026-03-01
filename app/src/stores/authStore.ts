import { create } from 'zustand';
import { supabase, isDemoMode } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  friendCode?: string;
  monthlyIncome?: number;
  xp: number;
  level: number;
  streakCount: number;
}

interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isOnboarded: boolean;
  error: string | null;

  setUser: (user: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  setError: (error: string | null) => void;

  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isOnboarded: false,
  error: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setOnboarded: (isOnboarded) => set({ isOnboarded }),
  setError: (error) => set({ error }),

  signUp: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      // Check if we're in demo mode (no Supabase URL configured)
      if (isDemoMode()) {
        const demoUser: UserProfile = {
          id: 'demo-' + Date.now(),
          email,
          displayName,
          friendCode: generateFriendCode(),
          xp: 0,
          level: 1,
          streakCount: 0,
        };
        set({ user: demoUser, isLoading: false, isOnboarded: false });
        return true;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      if (data.user) {
        // Update profile with display_name and friend_code
        const friendCode = generateFriendCode();
        await supabase
          .from('profiles')
          .update({
            display_name: displayName,
            friend_code: friendCode,
          })
          .eq('id', data.user.id);

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          displayName,
          friendCode,
          xp: 0,
          level: 1,
          streakCount: 0,
        };

        set({
          user: userProfile,
          session: data.session,
          isLoading: false,
          isOnboarded: false,
        });
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Demo mode
      if (isDemoMode()) {
        const demoUser: UserProfile = {
          id: 'demo-' + Date.now(),
          email,
          displayName: email.split('@')[0],
          friendCode: generateFriendCode(),
          xp: 150,
          level: 2,
          streakCount: 3,
        };
        set({ user: demoUser, isLoading: false, isOnboarded: true });
        return true;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      if (data.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          displayName: profile?.display_name || email.split('@')[0],
          avatarUrl: profile?.avatar_url,
          friendCode: profile?.friend_code,
          monthlyIncome: profile?.monthly_income ?? undefined,
          xp: profile?.xp || 0,
          level: profile?.level || 1,
          streakCount: profile?.streak_count || 0,
        };

        set({
          user: userProfile,
          session: data.session,
          isLoading: false,
          isOnboarded: true, // Returning users have onboarded
        });
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    try {
      if (!isDemoMode()) {
        await supabase.auth.signOut();
      }
    } finally {
      set({
        user: null,
        session: null,
        isOnboarded: false,
        error: null,
      });
    }
  },

  initialize: async () => {
    try {
      if (isDemoMode()) {
        set({ isLoading: false });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const userProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          displayName: profile?.display_name || '',
          avatarUrl: profile?.avatar_url,
          friendCode: profile?.friend_code,
          monthlyIncome: profile?.monthly_income ?? undefined,
          xp: profile?.xp || 0,
          level: profile?.level || 1,
          streakCount: profile?.streak_count || 0,
        };

        set({
          user: userProfile,
          session,
          isLoading: false,
          isOnboarded: true,
        });
      } else {
        set({ isLoading: false });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          set({ session });
        } else {
          set({ user: null, session: null, isOnboarded: false });
        }
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
