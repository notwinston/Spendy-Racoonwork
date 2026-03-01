import { create } from 'zustand';
import type { CalendarEvent, CalendarConnection, CalendarProvider } from '../types';
import {
  syncGoogleCalendar,
  loadDemoCalendarData,
  parseICSFile,
  connectAppleCalendar as connectAppleCalendarService,
} from '../services/calendarService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface CalendarState {
  events: CalendarEvent[];
  connections: CalendarConnection[];
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  fetchEvents: (userId: string) => Promise<void>;
  addConnection: (
    userId: string,
    provider: CalendarProvider,
    accessToken?: string,
  ) => Promise<void>;
  syncCalendar: (
    userId: string,
    accessToken: string,
    connectionId?: string,
  ) => Promise<void>;
  loadDemoData: (userId: string, persona?: 'sarah' | 'marcus') => Promise<void>;
  connectAppleCalendar: (userId: string) => Promise<void>;
  importICSEvents: (userId: string, content: string) => Promise<void>;
  clearEvents: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  connections: [],
  isLoading: false,
  isSyncing: false,

  fetchEvents: async (userId: string) => {
    set({ isLoading: true });
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', userId)
          .order('start_time', { ascending: true });

        if (error) {
          console.warn('Error fetching calendar events:', error.message);
        } else if (data) {
          set({ events: data as CalendarEvent[] });
        }
      }
      // If not configured, events remain whatever is in local state
    } catch (err) {
      console.warn('fetchEvents error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addConnection: async (
    userId: string,
    provider: CalendarProvider,
    accessToken?: string,
  ) => {
    const connection: CalendarConnection = {
      id: 'conn-' + Math.random().toString(36).substring(2, 15),
      user_id: userId,
      provider,
      access_token_encrypted: accessToken ?? 'demo-token',
      refresh_token_encrypted: null,
      calendar_ids: [],
      last_sync_at: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('calendar_connections').insert({
        user_id: connection.user_id,
        provider: connection.provider,
        access_token_encrypted: connection.access_token_encrypted,
        refresh_token_encrypted: connection.refresh_token_encrypted,
        calendar_ids: connection.calendar_ids,
        is_active: connection.is_active,
      });
      if (error) {
        console.warn('Error adding calendar connection:', error.message);
      }
    }

    set({ connections: [...get().connections, connection] });
  },

  syncCalendar: async (
    userId: string,
    accessToken: string,
    connectionId?: string,
  ) => {
    set({ isSyncing: true });
    try {
      const newEvents = await syncGoogleCalendar(
        accessToken,
        userId,
        connectionId,
      );
      // Merge with existing events, replacing duplicates by external_id
      const existingMap = new Map(
        get().events.map((e) => [e.external_id ?? e.id, e]),
      );
      for (const event of newEvents) {
        existingMap.set(event.external_id ?? event.id, event);
      }
      set({ events: Array.from(existingMap.values()) });
    } catch (err) {
      console.warn('syncCalendar error:', err);
      throw err;
    } finally {
      set({ isSyncing: false });
    }
  },

  loadDemoData: async (userId: string, persona?: 'sarah' | 'marcus') => {
    set({ isLoading: true });
    try {
      const events = await loadDemoCalendarData(userId, persona);
      set({ events });
    } catch (err) {
      console.warn('loadDemoData error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  connectAppleCalendar: async (userId: string) => {
    set({ isLoading: true });
    try {
      const appleEvents = await connectAppleCalendarService(userId);
      // Merge with existing events
      const existingMap = new Map(
        get().events.map((e) => [e.external_id ?? e.id, e]),
      );
      for (const event of appleEvents) {
        existingMap.set(event.external_id ?? event.id, event);
      }
      set({ events: Array.from(existingMap.values()) });
    } catch (err) {
      console.warn('connectAppleCalendar error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  importICSEvents: async (userId: string, content: string) => {
    set({ isLoading: true });
    try {
      const parsed = parseICSFile(content, userId);
      if (isSupabaseConfigured && parsed.length > 0) {
        const rows = parsed.map(({ id: _id, ...rest }) => rest);
        const { error } = await supabase.from('calendar_events').insert(rows);
        if (error) {
          console.warn('ICS import supabase error:', error.message);
        }
      }
      set({ events: [...get().events, ...parsed] });
    } catch (err) {
      console.warn('importICSEvents error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  clearEvents: () => set({ events: [], connections: [] }),
}));
