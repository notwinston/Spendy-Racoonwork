import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  CalendarEvent,
  EventCategory,
  DemoCalendarEvent,
} from '../types';

// Bundled demo data
import sarahEvents from '../data/sarah_events.json';
import marcusEvents from '../data/marcus_events.json';

// ---------- Category detection ----------

const CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
  dining: [
    'lunch', 'dinner', 'breakfast', 'brunch', 'coffee', 'cafe', 'restaurant',
    'food', 'eat', 'boba', 'tea', 'sushi', 'pizza', 'burger', 'ramen',
    'tim hortons', 'starbucks', 'mcdonalds',
  ],
  groceries: ['grocery', 'groceries', 'supermarket', 'costco', 'walmart', 'market'],
  transport: [
    'uber', 'lyft', 'taxi', 'transit', 'bus', 'train', 'compass', 'evo',
    'car share', 'gas', 'parking', 'flight',
  ],
  entertainment: [
    'movie', 'concert', 'show', 'theatre', 'theater', 'netflix', 'game',
    'gaming', 'party', 'festival', 'arcade',
  ],
  shopping: ['shop', 'shopping', 'mall', 'amazon', 'order', 'buy', 'purchase'],
  travel: ['trip', 'travel', 'hotel', 'airbnb', 'vacation', 'hostel', 'resort'],
  health: [
    'doctor', 'dentist', 'pharmacy', 'hospital', 'clinic', 'therapy',
    'medical', 'health', 'dental',
  ],
  education: [
    'class', 'lecture', 'tutorial', 'seminar', 'study', 'exam', 'lab',
    'cmpt', 'math', 'course', 'university', 'school', 'college',
  ],
  fitness: [
    'gym', 'workout', 'yoga', 'run', 'swim', 'hike', 'climbing',
    'recreation', 'fitness', 'exercise', 'sport',
  ],
  social: [
    'hangout', 'meetup', 'date', 'friend', 'reunion', 'birthday',
    'gathering', 'potluck', 'picnic',
  ],
  professional: [
    'meeting', 'interview', 'standup', 'sprint', 'retro', 'office',
    'work', 'client', 'presentation', 'conference',
  ],
  bills: ['rent', 'bill', 'payment', 'insurance', 'subscription', 'utilities'],
  personal: ['appointment', 'errand', 'haircut', 'laundry', 'cleaning'],
  other: [],
};

/**
 * Detect the spending category of a calendar event from its title.
 */
export function detectCategory(title: string): EventCategory {
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category as EventCategory;
      }
    }
  }
  return 'other';
}

// ---------- Apple Calendar (expo-calendar) ----------

/**
 * Connect to the device's Apple Calendar via expo-calendar.
 * Requests permission, fetches 90 days of events, maps to CalendarEvent[].
 * Optionally persists to Supabase if configured.
 */
export async function connectAppleCalendar(
  userId: string,
  connectionId?: string,
): Promise<CalendarEvent[]> {
  const ExpoCalendar = await import('expo-calendar');

  const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission denied');
  }

  const calendars = await ExpoCalendar.getCalendarsAsync(
    ExpoCalendar.EntityTypes.EVENT,
  );

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);

  const allEvents: CalendarEvent[] = [];

  for (const cal of calendars) {
    const events = await ExpoCalendar.getEventsAsync(
      [cal.id],
      startDate,
      endDate,
    );

    for (const event of events) {
      allEvents.push({
        id: `apple-${event.id}`,
        user_id: userId,
        external_id: event.id,
        calendar_connection_id: connectionId ?? `apple-${cal.id}`,
        title: event.title,
        description: event.notes ?? null,
        location: event.location ?? null,
        start_time: typeof event.startDate === 'string'
          ? event.startDate
          : event.startDate.toISOString(),
        end_time: event.endDate
          ? typeof event.endDate === 'string'
            ? event.endDate
            : event.endDate.toISOString()
          : null,
        is_all_day: event.allDay,
        recurrence_rule: event.recurrenceRule
          ? JSON.stringify(event.recurrenceRule)
          : null,
        attendee_count: 1,
        category: detectCategory(event.title),
        raw_data: null,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Persist to Supabase if configured
  if (isSupabaseConfigured && allEvents.length > 0) {
    const rows = allEvents.map(({ id: _id, ...rest }) => rest);
    const { error } = await supabase
      .from('calendar_events')
      .upsert(rows, {
        onConflict: 'user_id,external_id,calendar_connection_id',
      });
    if (error) {
      console.warn('Supabase upsert error (Apple Calendar):', error.message);
    }
  }

  return allEvents;
}

// ---------- Google Calendar sync ----------

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email: string }[];
  recurrence?: string[];
}

/**
 * Fetch events from Google Calendar API and upsert them into the calendar_events table.
 * Requires a valid OAuth access token. In Expo Go, real OAuth requires an EAS build.
 */
export async function syncGoogleCalendar(
  accessToken: string,
  userId: string,
  connectionId?: string,
): Promise<CalendarEvent[]> {
  const now = new Date().toISOString();
  const threeMonthsLater = new Date(
    Date.now() + 90 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(now)}` +
    `&timeMax=${encodeURIComponent(threeMonthsLater)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=250`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Google Calendar API error: ${response.status}`);
  }

  const data = (await response.json()) as { items: GoogleCalendarEvent[] };
  const events = (data.items ?? []).map((item) =>
    mapGoogleEventToCalendarEvent(item, userId, connectionId),
  );

  if (isSupabaseConfigured && events.length > 0) {
    const { error } = await supabase
      .from('calendar_events')
      .upsert(events, { onConflict: 'user_id,external_id,calendar_connection_id' });
    if (error) {
      console.warn('Supabase upsert error:', error.message);
    }
  }

  return events;
}

function mapGoogleEventToCalendarEvent(
  item: GoogleCalendarEvent,
  userId: string,
  connectionId?: string,
): CalendarEvent {
  const title = item.summary ?? 'Untitled';
  const isAllDay = !item.start?.dateTime;
  const startTime = item.start?.dateTime ?? `${item.start?.date}T00:00:00Z`;
  const endTime = item.end?.dateTime ?? `${item.end?.date}T23:59:59Z`;
  const recurrenceRule = item.recurrence?.join(';') ?? null;
  const attendeeCount = item.attendees?.length ?? 1;
  const category = detectCategory(title);

  return {
    id: '', // Supabase will generate
    user_id: userId,
    external_id: item.id,
    calendar_connection_id: connectionId ?? null,
    title,
    description: item.description ?? null,
    location: item.location ?? null,
    start_time: startTime,
    end_time: endTime,
    is_all_day: isAllDay,
    recurrence_rule: recurrenceRule,
    attendee_count: attendeeCount,
    category,
    raw_data: item as unknown as Record<string, unknown>,
    created_at: new Date().toISOString(),
  };
}

// ---------- ICS file parsing ----------

/**
 * Parse .ics file content and return CalendarEvent objects.
 * Uses simple regex/string parsing (no external library).
 */
export function parseICSFile(
  content: string,
  userId: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const eventBlocks = content.split('BEGIN:VEVENT');

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0];
    const event = parseICSBlock(block, userId);
    if (event) {
      events.push(event);
    }
  }

  return events;
}

function getICSField(block: string, field: string): string | null {
  // Match field, possibly with params like DTSTART;TZID=...:value
  const regex = new RegExp(`^${field}[;:](.*)$`, 'im');
  const match = block.match(regex);
  if (!match) return null;

  let value = match[1];
  // Remove params before the actual value (e.g., TZID=America/Vancouver:20251201T093000)
  const colonIdx = value.lastIndexOf(':');
  if (colonIdx !== -1 && field.startsWith('DT')) {
    value = value.substring(colonIdx + 1);
  }
  return value.trim();
}

function parseICSDateTime(raw: string): string {
  // Format: 20251201T093000Z or 20251201T093000
  const cleaned = raw.replace(/[^0-9T]/g, '');
  if (cleaned.length >= 15) {
    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6);
    const day = cleaned.substring(6, 8);
    const hour = cleaned.substring(9, 11);
    const min = cleaned.substring(11, 13);
    const sec = cleaned.substring(13, 15);
    return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
  }
  // All-day: 20251201
  if (cleaned.length >= 8) {
    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6);
    const day = cleaned.substring(6, 8);
    return `${year}-${month}-${day}T00:00:00Z`;
  }
  return new Date().toISOString();
}

function parseICSBlock(
  block: string,
  userId: string,
): CalendarEvent | null {
  const summary = getICSField(block, 'SUMMARY');
  if (!summary) return null;

  const dtStart = getICSField(block, 'DTSTART');
  const dtEnd = getICSField(block, 'DTEND');
  const description = getICSField(block, 'DESCRIPTION');
  const location = getICSField(block, 'LOCATION');
  const uid = getICSField(block, 'UID');
  const rrule = getICSField(block, 'RRULE');

  const startTime = dtStart ? parseICSDateTime(dtStart) : new Date().toISOString();
  const endTime = dtEnd ? parseICSDateTime(dtEnd) : null;
  const isAllDay = dtStart ? dtStart.length === 8 : false;
  const category = detectCategory(summary);

  return {
    id: '',
    user_id: userId,
    external_id: uid ?? null,
    calendar_connection_id: null,
    title: summary,
    description: description ?? null,
    location: location ?? null,
    start_time: startTime,
    end_time: endTime,
    is_all_day: isAllDay,
    recurrence_rule: rrule ?? null,
    attendee_count: 1,
    category,
    raw_data: null,
    created_at: new Date().toISOString(),
  };
}

// ---------- Demo data loading ----------

function generateId(): string {
  return 'demo-' + Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Load synthetic calendar data into either Supabase or return locally.
 * Uses sarah_events.json by default (the first demo persona).
 */
export async function loadDemoCalendarData(
  userId: string,
  persona: 'sarah' | 'marcus' = 'sarah',
): Promise<CalendarEvent[]> {
  const rawEvents: DemoCalendarEvent[] =
    persona === 'sarah'
      ? (sarahEvents as DemoCalendarEvent[])
      : (marcusEvents as DemoCalendarEvent[]);

  // Compute offset to center demo data around today so half the events
  // are in the past and half in the future (predictions require future events).
  const timestamps = rawEvents.map((e) => new Date(e.start_time).getTime());
  const earliest = Math.min(...timestamps);
  const latest = Math.max(...timestamps);
  const midpoint = earliest + (latest - earliest) / 2;
  const offsetMs = Date.now() - midpoint;

  const events: CalendarEvent[] = rawEvents.map((raw) => ({
    id: generateId(),
    user_id: userId,
    external_id: null,
    calendar_connection_id: null,
    title: raw.title,
    description: raw.description ?? null,
    location: raw.location ?? null,
    start_time: new Date(new Date(raw.start_time).getTime() + offsetMs).toISOString(),
    end_time: new Date(new Date(raw.end_time).getTime() + offsetMs).toISOString(),
    is_all_day: false,
    recurrence_rule: raw.recurrence_rule ?? null,
    attendee_count: raw.attendee_count,
    category: raw.category,
    raw_data: null,
    created_at: new Date().toISOString(),
  }));

  if (isSupabaseConfigured) {
    try {
      const rows = events.map(({ id: _id, ...rest }) => rest);
      await supabase.from('calendar_events').insert(rows);
    } catch { /* tables may not exist yet */ }
  }

  return events;
}
