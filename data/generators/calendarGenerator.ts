// Calendar event generator for FutureSpend demo personas

import {
  CalendarEvent,
  createRng,
  setRng,
  random,
  randomChoice,
  randomInt,
  chance,
  iterateDays,
  formatDateTime,
  dateAtTime,
  addMinutes,
  isDayOfWeek,
  isWeekend,
  weekOfMonth,
  shuffle,
} from './utils';
import { PersonaProfile, RecurringEvent, OneOffEventTemplate } from './personas';

const DATE_START = new Date(2025, 11, 1); // Dec 1, 2025
const DATE_END = new Date(2026, 1, 28);   // Feb 28, 2026

// SFU winter semester: classes start ~Jan 5, 2026
const SFU_SEMESTER_START = new Date(2026, 0, 5);
// Classes don't run during winter break
const WINTER_BREAK_START = new Date(2025, 11, 15);
const WINTER_BREAK_END = new Date(2026, 0, 4);

function isInWinterBreak(date: Date): boolean {
  return date >= WINTER_BREAK_START && date <= WINTER_BREAK_END;
}

function isSchoolDay(date: Date): boolean {
  // Classes run Mon-Fri, outside winter break, from Dec 1 to Dec 14 and Jan 5 onwards
  if (isWeekend(date)) return false;
  if (isInWinterBreak(date)) return false;
  return true;
}

function generateRecurringEvents(
  persona: PersonaProfile,
  isStudent: boolean
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const rec of persona.recurringEvents) {
    let biweeklyCounter = 0;
    const teamLunchLocations = [
      'Nuba — Gastown', 'Tacofino — Gastown', 'Meat & Bread — Gastown',
      'Bao Down — Gastown', 'Ramen Danbo — Robson', 'Japadog — Burrard',
      'Sushi Mura — Robson', 'Earls Kitchen — Yaletown',
    ];

    for (const day of iterateDays(DATE_START, DATE_END)) {
      const dow = day.getDay();

      // Check if this event should fire on this day
      if (!rec.schedule.daysOfWeek?.includes(dow)) continue;

      // For student events, respect school schedule
      if (isStudent && rec.category === 'education' && !isSchoolDay(day)) continue;

      // For student gym, skip during winter break if desired
      if (isStudent && rec.title.includes('Gym') && isInWinterBreak(day)) {
        if (chance(0.6)) continue; // less gym during break
      }

      // For professional events (standups, etc.), skip weekends and holidays
      if (rec.category === 'professional' && (isWeekend(day))) continue;

      // Biweekly scheduling
      if (rec.schedule.type === 'biweekly') {
        biweeklyCounter++;
        if (biweeklyCounter % 2 !== 0) continue;
      }

      // Monthly scheduling by week of month
      if (rec.schedule.type === 'monthly') {
        if (rec.schedule.weekOfMonth !== undefined && weekOfMonth(day) !== rec.schedule.weekOfMonth) continue;
      }

      // Skip ~5% of events randomly (realistic missed events)
      if (chance(0.05)) continue;

      const start = dateAtTime(day, rec.startHour, rec.startMinute);
      const end = addMinutes(start, rec.durationMinutes);

      // Vary the location for team lunches
      let location = rec.location;
      if (rec.title === 'Team Lunch' && !isStudent) {
        location = randomChoice(teamLunchLocations);
      }

      events.push({
        title: rec.title,
        description: rec.description,
        location,
        start_time: formatDateTime(start),
        end_time: formatDateTime(end),
        attendee_count: rec.attendeeCount,
        category: rec.category,
        is_recurring: true,
        recurrence_rule: rec.recurrenceRule,
      });
    }
  }

  return events;
}

function generateOneOffEvents(persona: PersonaProfile): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const totalDays = Math.round((DATE_END.getTime() - DATE_START.getTime()) / (1000 * 60 * 60 * 24));
  const totalMonths = totalDays / 30;

  for (const template of persona.oneOffEvents) {
    const targetCount = Math.round(template.monthlyFrequency * totalMonths);

    // Special handling for Friday Night Out — only on Fridays
    const isFridayNight = template.title === 'Friday Night Out';

    let generated = 0;
    const usedDates = new Set<string>();

    // Collect eligible days
    const eligibleDays: Date[] = [];
    for (const day of iterateDays(DATE_START, DATE_END)) {
      if (isFridayNight) {
        if (day.getDay() === 5) eligibleDays.push(new Date(day));
      } else if (template.preferWeekend && isWeekend(day)) {
        eligibleDays.push(new Date(day));
      } else if (!template.preferWeekend && !isWeekend(day)) {
        eligibleDays.push(new Date(day));
      } else if (!template.preferWeekend && isWeekend(day) && chance(0.2)) {
        eligibleDays.push(new Date(day));
      } else if (template.preferWeekend && !isWeekend(day) && chance(0.15)) {
        eligibleDays.push(new Date(day));
      }
    }

    // Shuffle using seeded RNG
    shuffle(eligibleDays);

    for (const day of eligibleDays) {
      if (generated >= targetCount) break;
      const dateKey = day.toISOString().slice(0, 10);
      if (usedDates.has(dateKey)) continue;

      // Skip winter break for student social events? Nah, students go out more during break
      usedDates.add(dateKey);

      const startHour = randomInt(template.startHourRange[0], template.startHourRange[1]);
      const start = dateAtTime(day, startHour, randomInt(0, 3) * 15);
      const end = addMinutes(start, template.durationMinutes);
      const location = randomChoice(template.locations);
      const attendees = randomInt(template.attendeeCountRange[0], template.attendeeCountRange[1]);

      events.push({
        title: template.title,
        description: template.description,
        location,
        start_time: formatDateTime(start),
        end_time: formatDateTime(end),
        attendee_count: attendees,
        category: template.category,
        is_recurring: false,
        recurrence_rule: null,
      });

      generated++;
    }
  }

  return events;
}

function generateHolidayEvents(isStudent: boolean): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Christmas Eve
  events.push({
    title: 'Christmas Eve Dinner',
    description: 'Family dinner',
    location: isStudent ? 'Home — Burnaby' : 'Family Home — Richmond',
    start_time: formatDateTime(dateAtTime(new Date(2025, 11, 24), 17, 0)),
    end_time: formatDateTime(dateAtTime(new Date(2025, 11, 24), 21, 0)),
    attendee_count: isStudent ? 5 : 8,
    category: 'social',
    is_recurring: false,
    recurrence_rule: null,
  });

  // Christmas Day
  events.push({
    title: 'Christmas Day',
    description: 'Christmas celebrations',
    location: isStudent ? 'Home — Burnaby' : 'Family Home — Richmond',
    start_time: formatDateTime(dateAtTime(new Date(2025, 11, 25), 10, 0)),
    end_time: formatDateTime(dateAtTime(new Date(2025, 11, 25), 18, 0)),
    attendee_count: isStudent ? 5 : 8,
    category: 'social',
    is_recurring: false,
    recurrence_rule: null,
  });

  // New Year's Eve
  events.push({
    title: "New Year's Eve Party",
    description: "NYE celebrations",
    location: isStudent ? 'Friend\'s Place — Vancouver' : 'Fairmont Hotel — Vancouver',
    start_time: formatDateTime(dateAtTime(new Date(2025, 11, 31), 20, 0)),
    end_time: formatDateTime(dateAtTime(new Date(2026, 0, 1), 1, 0)),
    attendee_count: isStudent ? 8 : 12,
    category: 'entertainment',
    is_recurring: false,
    recurrence_rule: null,
  });

  // Valentine's Day (Feb 14)
  if (!isStudent) {
    events.push({
      title: "Valentine's Day Dinner",
      description: "Special dinner",
      location: 'Hawksworth Restaurant — Downtown',
      start_time: formatDateTime(dateAtTime(new Date(2026, 1, 14), 19, 0)),
      end_time: formatDateTime(dateAtTime(new Date(2026, 1, 14), 22, 0)),
      attendee_count: 2,
      category: 'social',
      is_recurring: false,
      recurrence_rule: null,
    });
  } else {
    events.push({
      title: "Galentine's Day Dinner",
      description: "Dinner with friends",
      location: 'Earls Kitchen — Brentwood',
      start_time: formatDateTime(dateAtTime(new Date(2026, 1, 13), 18, 30)),
      end_time: formatDateTime(dateAtTime(new Date(2026, 1, 13), 21, 0)),
      attendee_count: 5,
      category: 'social',
      is_recurring: false,
      recurrence_rule: null,
    });
  }

  // Family Day (BC — 3rd Monday of Feb)
  events.push({
    title: 'Family Day',
    description: 'BC statutory holiday — day off',
    location: isStudent ? 'Home' : 'Whistler — BC',
    start_time: formatDateTime(dateAtTime(new Date(2026, 1, 16), 10, 0)),
    end_time: formatDateTime(dateAtTime(new Date(2026, 1, 16), 17, 0)),
    attendee_count: isStudent ? 4 : 2,
    category: isStudent ? 'social' : 'travel',
    is_recurring: false,
    recurrence_rule: null,
  });

  return events;
}

export function generateCalendarEvents(persona: PersonaProfile, seed: number): CalendarEvent[] {
  // Set deterministic RNG
  setRng(createRng(seed));

  const isStudent = persona.name === 'Sarah Chen';

  const recurring = generateRecurringEvents(persona, isStudent);
  const oneOff = generateOneOffEvents(persona);
  const holidays = generateHolidayEvents(isStudent);

  const allEvents = [...recurring, ...oneOff, ...holidays];

  // Sort by start time
  allEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return allEvents;
}
