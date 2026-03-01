// Persona definitions for FutureSpend demo data

import { EventCategory } from './utils';

export interface Subscription {
  name: string;
  merchant: string;
  amount: number;
  category: EventCategory;
  dayOfMonth: number; // billing day
}

export interface RecurringEvent {
  title: string;
  description: string;
  location: string;
  durationMinutes: number;
  category: EventCategory;
  attendeeCount: number;
  recurrenceRule: string;
  // Schedule: which days this occurs
  schedule: {
    type: 'weekly' | 'biweekly' | 'monthly';
    daysOfWeek?: number[]; // 0=Sun, 1=Mon, ...
    weekOfMonth?: number;  // for monthly events (0-indexed)
    dayOfMonth?: number;   // for monthly events by date
  };
  // Spending info (null if no spending)
  spending: {
    baseAmount: number;
    variancePct: number;
    merchant: string;
    spendingCategory: EventCategory;
  } | null;
  // Time range
  startHour: number;
  startMinute: number;
}

export interface OneOffEventTemplate {
  title: string;
  description: string;
  locations: string[];
  durationMinutes: number;
  category: EventCategory;
  attendeeCountRange: [number, number];
  spending: {
    baseAmount: number;
    variancePct: number;
    merchants: string[];
    spendingCategory: EventCategory;
  } | null;
  // Scheduling
  preferWeekend: boolean;
  preferEvening: boolean;
  monthlyFrequency: number; // average times per month
  startHourRange: [number, number];
}

export interface PersonaProfile {
  name: string;
  age: number;
  occupation: string;
  monthlyIncome: number;
  monthlyBudget: number;
  location: string;
  subscriptions: Subscription[];
  recurringEvents: RecurringEvent[];
  oneOffEvents: OneOffEventTemplate[];
  groceryMerchants: string[];
  groceryAmountRange: [number, number];
  groceryWeeklyFrequency: number;
  transportMerchants: string[];
  transportAmountRange: [number, number];
  transportWeeklyFrequency: number;
  miscMerchants: { name: string; amount: [number, number]; category: EventCategory }[];
  miscMonthlyFrequency: number;
}

// ============================================================
// Sarah Chen — University Student
// ============================================================
export const sarahChen: PersonaProfile = {
  name: 'Sarah Chen',
  age: 21,
  occupation: 'SFU CompSci Student / Part-time Starbucks Barista',
  monthlyIncome: 1200,
  monthlyBudget: 1000,
  location: 'Near SFU Burnaby Campus',

  subscriptions: [
    { name: 'Spotify Premium', merchant: 'Spotify', amount: 10.99, category: 'entertainment', dayOfMonth: 5 },
    { name: 'Netflix (shared)', merchant: 'Netflix', amount: 5.00, category: 'entertainment', dayOfMonth: 12 },
    { name: 'Adobe CC Student', merchant: 'Adobe', amount: 15.00, category: 'education', dayOfMonth: 18 },
    { name: 'iCloud 50GB', merchant: 'Apple', amount: 1.00, category: 'bills', dayOfMonth: 22 },
  ],

  recurringEvents: [
    // MWF classes at SFU
    {
      title: 'CMPT 354 — Database Systems',
      description: 'Lecture with Prof. Liu',
      location: 'SFU Burnaby — AQ 3150',
      durationMinutes: 80,
      category: 'education',
      attendeeCount: 1,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE',
      schedule: { type: 'weekly', daysOfWeek: [1, 3] },
      spending: null,
      startHour: 9, startMinute: 30,
    },
    {
      title: 'CMPT 371 — Networking',
      description: 'Lecture with Prof. Fels',
      location: 'SFU Burnaby — TASC 9204',
      durationMinutes: 80,
      category: 'education',
      attendeeCount: 1,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
      schedule: { type: 'weekly', daysOfWeek: [1, 3, 5] },
      spending: null,
      startHour: 11, startMinute: 30,
    },
    {
      title: 'CMPT 307 — Data Structures',
      description: 'Lecture with Prof. Kabanets',
      location: 'SFU Burnaby — AQ 3005',
      durationMinutes: 80,
      category: 'education',
      attendeeCount: 1,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU,TH',
      schedule: { type: 'weekly', daysOfWeek: [2, 4] },
      spending: null,
      startHour: 10, startMinute: 30,
    },
    // Study groups 2x/week at coffee shops
    {
      title: 'Study Group — Databases',
      description: 'Group study session with classmates',
      location: 'JJ Bean Coffee — Commercial Drive',
      durationMinutes: 120,
      category: 'education',
      attendeeCount: 4,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU',
      schedule: { type: 'weekly', daysOfWeek: [2] },
      spending: { baseAmount: 7.50, variancePct: 0.20, merchant: 'JJ Bean Coffee', spendingCategory: 'dining' },
      startHour: 14, startMinute: 0,
    },
    {
      title: 'Study Group — Algorithms',
      description: 'Weekly algorithm practice session',
      location: 'Waves Coffee House — Burnaby',
      durationMinutes: 120,
      category: 'education',
      attendeeCount: 3,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=TH',
      schedule: { type: 'weekly', daysOfWeek: [4] },
      spending: { baseAmount: 8.00, variancePct: 0.20, merchant: 'Waves Coffee House', spendingCategory: 'dining' },
      startHour: 15, startMinute: 0,
    },
    // Gym 3x/week
    {
      title: 'Gym — SFU Recreation',
      description: 'Workout session',
      location: 'SFU Recreation Centre',
      durationMinutes: 75,
      category: 'fitness',
      attendeeCount: 1,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
      schedule: { type: 'weekly', daysOfWeek: [1, 3, 5] },
      spending: null, // included in SFU fees
      startHour: 17, startMinute: 0,
    },
    // Starbucks shifts on weekends
    {
      title: 'Starbucks Shift',
      description: 'Part-time barista shift',
      location: 'Starbucks — Lougheed Town Centre',
      durationMinutes: 480,
      category: 'professional',
      attendeeCount: 1,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA',
      schedule: { type: 'weekly', daysOfWeek: [6] },
      spending: null, // earning money, not spending
      startHour: 8, startMinute: 0,
    },
    {
      title: 'Starbucks Shift',
      description: 'Part-time barista shift',
      location: 'Starbucks — Lougheed Town Centre',
      durationMinutes: 360,
      category: 'professional',
      attendeeCount: 1,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=SU',
      schedule: { type: 'weekly', daysOfWeek: [0] },
      spending: null,
      startHour: 10, startMinute: 0,
    },
    // CMPT 354 Lab / Tutorial on Fridays
    {
      title: 'CMPT 354 — Lab',
      description: 'Database Systems lab session',
      location: 'SFU Burnaby — CSIL Lab',
      durationMinutes: 110,
      category: 'education',
      attendeeCount: 1,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=FR',
      schedule: { type: 'weekly', daysOfWeek: [5] },
      spending: null,
      startHour: 14, startMinute: 30,
    },
    // Meal prep / cooking (Sunday evenings)
    {
      title: 'Meal Prep',
      description: 'Weekly meal prep for the week',
      location: 'Home — Burnaby',
      durationMinutes: 90,
      category: 'personal',
      attendeeCount: 1,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=SU',
      schedule: { type: 'weekly', daysOfWeek: [0] },
      spending: null,
      startHour: 18, startMinute: 0,
    },
  ],

  oneOffEvents: [
    // Friday night outings
    {
      title: 'Friday Night Out',
      description: 'Night out with friends',
      locations: ['Fantacity Karaoke — Burnaby', 'Cineplex — Metropolis at Metrotown', 'Score on Davie — Vancouver', 'Craft Beer Market — False Creek', 'Rec Room — Burnaby'],
      durationMinutes: 180,
      category: 'entertainment',
      attendeeCountRange: [3, 6],
      spending: { baseAmount: 45, variancePct: 0.25, merchants: ['Fantacity Karaoke', 'Cineplex Theatres', 'Score on Davie', 'Craft Beer Market', 'Rec Room'], spendingCategory: 'entertainment' },
      preferWeekend: false, // specifically Friday
      preferEvening: true,
      monthlyFrequency: 3.5,
      startHourRange: [19, 21],
    },
    // Boba / bubble tea runs
    {
      title: 'Boba Run',
      description: 'Bubble tea with friends',
      locations: ['CoCo Fresh Tea — Metrotown', 'Chatime — Burnaby', 'Tiger Sugar — Burnaby', 'The Alley — Burnaby'],
      durationMinutes: 30,
      category: 'dining',
      attendeeCountRange: [2, 3],
      spending: { baseAmount: 7, variancePct: 0.20, merchants: ['CoCo Fresh Tea', 'Chatime', 'Tiger Sugar', 'The Alley'], spendingCategory: 'dining' },
      preferWeekend: false,
      preferEvening: false,
      monthlyFrequency: 4,
      startHourRange: [12, 17],
    },
    // Brunch with friends
    {
      title: 'Brunch with Friends',
      description: 'Weekend brunch catch-up',
      locations: ['Jam Cafe — Beatty St', 'OEB Breakfast Co. — Yaletown', 'Cafe Medina — Beatty St', 'Deacon\'s Corner — Main St', 'Nero Belgian Waffle Bar — Fraser St'],
      durationMinutes: 90,
      category: 'social',
      attendeeCountRange: [2, 5],
      spending: { baseAmount: 25, variancePct: 0.20, merchants: ['Jam Cafe', 'OEB Breakfast Co.', 'Cafe Medina', 'Deacon\'s Corner', 'Nero Waffle Bar'], spendingCategory: 'dining' },
      preferWeekend: true,
      preferEvening: false,
      monthlyFrequency: 2,
      startHourRange: [10, 12],
    },
    // Monthly haircut
    {
      title: 'Haircut',
      description: 'Monthly haircut appointment',
      locations: ['Great Clips — Lougheed', 'Supercuts — Brentwood'],
      durationMinutes: 45,
      category: 'personal',
      attendeeCountRange: [1, 1],
      spending: { baseAmount: 35, variancePct: 0.10, merchants: ['Great Clips', 'Supercuts'], spendingCategory: 'personal' },
      preferWeekend: true,
      preferEvening: false,
      monthlyFrequency: 1,
      startHourRange: [11, 15],
    },
    // Occasional shopping
    {
      title: 'Shopping Trip',
      description: 'Shopping at Metrotown',
      locations: ['Metropolis at Metrotown', 'Uniqlo — Metrotown', 'H&M — Metrotown'],
      durationMinutes: 120,
      category: 'shopping',
      attendeeCountRange: [1, 3],
      spending: { baseAmount: 40, variancePct: 0.30, merchants: ['Uniqlo', 'H&M', 'Muji', 'Daiso'], spendingCategory: 'shopping' },
      preferWeekend: true,
      preferEvening: false,
      monthlyFrequency: 1.5,
      startHourRange: [13, 16],
    },
    // Dentist / health
    {
      title: 'Dentist Appointment',
      description: 'Dental checkup',
      locations: ['SFU Dental Clinic', 'Burnaby Dental Centre'],
      durationMinutes: 60,
      category: 'health',
      attendeeCountRange: [1, 1],
      spending: { baseAmount: 20, variancePct: 0.15, merchants: ['SFU Dental Clinic', 'Burnaby Dental Centre'], spendingCategory: 'health' },
      preferWeekend: false,
      preferEvening: false,
      monthlyFrequency: 0.33, // once every 3 months
      startHourRange: [9, 14],
    },
    // Coffee runs (random, not part of study group)
    {
      title: 'Coffee Run',
      description: 'Quick coffee break',
      locations: ['Starbucks — SFU', 'Tim Hortons — Burnaby', 'Blenz Coffee — SFU'],
      durationMinutes: 30,
      category: 'dining',
      attendeeCountRange: [1, 2],
      spending: { baseAmount: 5.50, variancePct: 0.20, merchants: ['Starbucks', 'Tim Hortons', 'Blenz Coffee'], spendingCategory: 'dining' },
      preferWeekend: false,
      preferEvening: false,
      monthlyFrequency: 8,
      startHourRange: [8, 16],
    },
    // Quick lunch on campus
    {
      title: 'Campus Lunch',
      description: 'Quick lunch between classes',
      locations: ['SFU Dining Hall', 'Tim Hortons — SFU', 'Subway — SFU'],
      durationMinutes: 30,
      category: 'dining',
      attendeeCountRange: [1, 2],
      spending: { baseAmount: 10, variancePct: 0.20, merchants: ['SFU Dining Hall', 'Tim Hortons', 'Subway'], spendingCategory: 'dining' },
      preferWeekend: false,
      preferEvening: false,
      monthlyFrequency: 5,
      startHourRange: [11, 13],
    },
  ],

  groceryMerchants: ['T&T Supermarket — Metrotown', 'Save-On-Foods — Burnaby', 'No Frills — Kingsway', 'Walmart Supercentre — Burnaby'],
  groceryAmountRange: [25, 65],
  groceryWeeklyFrequency: 2,

  transportMerchants: ['Compass Card — TransLink', 'Evo Car Share'],
  transportAmountRange: [3, 15],
  transportWeeklyFrequency: 4,

  miscMerchants: [
    { name: 'Amazon.ca', amount: [10, 45], category: 'shopping' },
    { name: 'Shoppers Drug Mart', amount: [8, 25], category: 'personal' },
    { name: 'London Drugs', amount: [10, 30], category: 'personal' },
    { name: 'BC Hydro', amount: [35, 55], category: 'bills' },
    { name: 'Telus Mobility', amount: [40, 55], category: 'bills' },
  ],
  miscMonthlyFrequency: 4,
};

// ============================================================
// Marcus Thompson — Young Professional
// ============================================================
export const marcusThompson: PersonaProfile = {
  name: 'Marcus Thompson',
  age: 26,
  occupation: 'Junior Developer at Vancouver Startup',
  monthlyIncome: 4200,
  monthlyBudget: 3000,
  location: 'Downtown Vancouver',

  subscriptions: [
    { name: 'Netflix Premium', merchant: 'Netflix', amount: 15.49, category: 'entertainment', dayOfMonth: 3 },
    { name: 'Spotify Premium', merchant: 'Spotify', amount: 10.99, category: 'entertainment', dayOfMonth: 5 },
    { name: 'Adobe Creative Cloud', merchant: 'Adobe', amount: 54.99, category: 'professional', dayOfMonth: 8 },
    { name: 'AWS Personal', merchant: 'Amazon Web Services', amount: 12.00, category: 'professional', dayOfMonth: 1 },
    { name: 'GitHub Pro', merchant: 'GitHub', amount: 4.00, category: 'professional', dayOfMonth: 10 },
    { name: 'Equinox Membership', merchant: 'Equinox', amount: 49.99, category: 'fitness', dayOfMonth: 1 },
    { name: 'Disney+', merchant: 'Disney+', amount: 7.99, category: 'entertainment', dayOfMonth: 15 },
    { name: 'iCloud 200GB', merchant: 'Apple', amount: 2.99, category: 'bills', dayOfMonth: 22 },
    { name: 'Notion Personal Pro', merchant: 'Notion', amount: 8.00, category: 'professional', dayOfMonth: 12 },
    { name: 'LinkedIn Premium', merchant: 'LinkedIn', amount: 29.99, category: 'professional', dayOfMonth: 20 },
    { name: 'YouTube Premium', merchant: 'YouTube', amount: 13.99, category: 'entertainment', dayOfMonth: 7 },
    { name: 'ChatGPT Plus', merchant: 'OpenAI', amount: 20.00, category: 'professional', dayOfMonth: 14 },
  ],

  recurringEvents: [
    // Daily standup
    {
      title: 'Daily Standup',
      description: 'Team standup meeting',
      location: 'Office — Gastown (Slack Huddle)',
      durationMinutes: 15,
      category: 'professional',
      attendeeCount: 8,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      schedule: { type: 'weekly', daysOfWeek: [1, 2, 3, 4, 5] },
      spending: null,
      startHour: 10, startMinute: 0,
    },
    // Team lunches 2x/week
    {
      title: 'Team Lunch',
      description: 'Lunch with the dev team',
      location: 'Nuba — Gastown',
      durationMinutes: 75,
      category: 'social',
      attendeeCount: 5,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU',
      schedule: { type: 'weekly', daysOfWeek: [2] },
      spending: { baseAmount: 26, variancePct: 0.20, merchant: 'Nuba', spendingCategory: 'dining' },
      startHour: 12, startMinute: 0,
    },
    {
      title: 'Team Lunch',
      description: 'Lunch with colleagues',
      location: 'Tacofino — Gastown',
      durationMinutes: 60,
      category: 'social',
      attendeeCount: 4,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=TH',
      schedule: { type: 'weekly', daysOfWeek: [4] },
      spending: { baseAmount: 22, variancePct: 0.20, merchant: 'Tacofino', spendingCategory: 'dining' },
      startHour: 12, startMinute: 30,
    },
    // Gym 5x/week
    {
      title: 'Gym — Equinox',
      description: 'Morning workout',
      location: 'Equinox — Coal Harbour',
      durationMinutes: 60,
      category: 'fitness',
      attendeeCount: 1,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      schedule: { type: 'weekly', daysOfWeek: [1, 2, 3, 4, 5] },
      spending: null, // membership subscription covers it
      startHour: 7, startMinute: 0,
    },
    // Sprint planning every other Monday
    {
      title: 'Sprint Planning',
      description: 'Biweekly sprint planning meeting',
      location: 'Office — Gastown Conference Room',
      durationMinutes: 120,
      category: 'professional',
      attendeeCount: 10,
      recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO',
      schedule: { type: 'biweekly', daysOfWeek: [1] },
      spending: null,
      startHour: 13, startMinute: 0,
    },
    // Sprint retro every other Friday
    {
      title: 'Sprint Retro',
      description: 'Biweekly retrospective',
      location: 'Office — Gastown Conference Room',
      durationMinutes: 60,
      category: 'professional',
      attendeeCount: 10,
      recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=FR',
      schedule: { type: 'biweekly', daysOfWeek: [5] },
      spending: null,
      startHour: 15, startMinute: 0,
    },
    // Monthly board game night
    {
      title: 'Board Game Night',
      description: 'Monthly board game night with friends',
      location: 'Stormcrow Tavern — Commercial Drive',
      durationMinutes: 180,
      category: 'social',
      attendeeCount: 6,
      recurrenceRule: 'FREQ=MONTHLY;BYDAY=2FR',
      schedule: { type: 'monthly', daysOfWeek: [5], weekOfMonth: 1 },
      spending: { baseAmount: 15, variancePct: 0.20, merchant: 'Stormcrow Tavern', spendingCategory: 'entertainment' },
      startHour: 19, startMinute: 0,
    },
  ],

  oneOffEvents: [
    // Dates 1-2x/month
    {
      title: 'Dinner Date',
      description: 'Date night dinner',
      locations: ['Miku Restaurant — Coal Harbour', 'Kissa Tanto — Chinatown', 'Osteria Savio Volpe — Fraser St', 'AnnaLena — Kitsilano', 'Bao Bei — Chinatown', 'L\'Abattoir — Gastown'],
      durationMinutes: 120,
      category: 'social',
      attendeeCountRange: [2, 2],
      spending: { baseAmount: 100, variancePct: 0.20, merchants: ['Miku Restaurant', 'Kissa Tanto', 'Osteria Savio Volpe', 'AnnaLena', 'Bao Bei', 'L\'Abattoir'], spendingCategory: 'dining' },
      preferWeekend: true,
      preferEvening: true,
      monthlyFrequency: 1.5,
      startHourRange: [18, 20],
    },
    // Weekend activities
    {
      title: 'Weekend Hike',
      description: 'Hiking trip',
      locations: ['Grouse Grind — North Vancouver', 'Lynn Canyon — North Vancouver', 'Quarry Rock — Deep Cove', 'Pacific Spirit Regional Park', 'Lighthouse Park — West Vancouver'],
      durationMinutes: 240,
      category: 'fitness',
      attendeeCountRange: [1, 4],
      spending: null,
      preferWeekend: true,
      preferEvening: false,
      monthlyFrequency: 2,
      startHourRange: [8, 10],
    },
    // Happy hour with coworkers
    {
      title: 'Happy Hour — Team',
      description: 'After-work drinks with the team',
      locations: ['Alibi Room — Gastown', 'Steamworks Brew Pub — Gastown', 'The Cambie — Gastown', 'Revel Room — Gastown'],
      durationMinutes: 120,
      category: 'social',
      attendeeCountRange: [4, 8],
      spending: { baseAmount: 35, variancePct: 0.25, merchants: ['Alibi Room', 'Steamworks Brew Pub', 'The Cambie', 'Revel Room'], spendingCategory: 'dining' },
      preferWeekend: false,
      preferEvening: true,
      monthlyFrequency: 2,
      startHourRange: [17, 18],
    },
    // Quarterly team offsite
    {
      title: 'Team Offsite',
      description: 'Quarterly team building event',
      locations: ['Whistler — BC', 'Harrison Hot Springs — BC', 'Tofino — BC'],
      durationMinutes: 480,
      category: 'professional',
      attendeeCountRange: [12, 15],
      spending: { baseAmount: 150, variancePct: 0.15, merchants: ['AirBnB', 'Whistler Blackcomb', 'Harrison Hot Springs Resort'], spendingCategory: 'travel' },
      preferWeekend: false,
      preferEvening: false,
      monthlyFrequency: 0.33,
      startHourRange: [9, 10],
    },
    // Concerts / entertainment
    {
      title: 'Concert',
      description: 'Live music event',
      locations: ['Commodore Ballroom — Granville St', 'Orpheum Theatre — Granville St', 'Rickshaw Theatre — East Hastings', 'Vogue Theatre — Granville St'],
      durationMinutes: 180,
      category: 'entertainment',
      attendeeCountRange: [2, 4],
      spending: { baseAmount: 65, variancePct: 0.25, merchants: ['Ticketmaster', 'Live Nation', 'Eventbrite'], spendingCategory: 'entertainment' },
      preferWeekend: true,
      preferEvening: true,
      monthlyFrequency: 0.75,
      startHourRange: [19, 21],
    },
    // Barber
    {
      title: 'Barber Appointment',
      description: 'Monthly haircut',
      locations: ['Barber & Co — Gastown', 'Noble Barbershop — Main St'],
      durationMinutes: 45,
      category: 'personal',
      attendeeCountRange: [1, 1],
      spending: { baseAmount: 45, variancePct: 0.10, merchants: ['Barber & Co', 'Noble Barbershop'], spendingCategory: 'personal' },
      preferWeekend: true,
      preferEvening: false,
      monthlyFrequency: 1,
      startHourRange: [10, 14],
    },
    // Coffee meetings
    {
      title: 'Coffee Meeting',
      description: 'Networking coffee chat',
      locations: ['Revolver Coffee — Gastown', 'Timbertrain Coffee — Gastown', 'Pallet Coffee — Coal Harbour'],
      durationMinutes: 60,
      category: 'professional',
      attendeeCountRange: [2, 2],
      spending: { baseAmount: 6.50, variancePct: 0.20, merchants: ['Revolver Coffee', 'Timbertrain Coffee', 'Pallet Coffee'], spendingCategory: 'dining' },
      preferWeekend: false,
      preferEvening: false,
      monthlyFrequency: 3,
      startHourRange: [9, 15],
    },
    // Dentist
    {
      title: 'Dentist Appointment',
      description: 'Dental checkup',
      locations: ['Pacific Dental — Downtown', 'Burrard Dental Centre'],
      durationMinutes: 60,
      category: 'health',
      attendeeCountRange: [1, 1],
      spending: { baseAmount: 25, variancePct: 0.15, merchants: ['Pacific Dental', 'Burrard Dental Centre'], spendingCategory: 'health' },
      preferWeekend: false,
      preferEvening: false,
      monthlyFrequency: 0.33,
      startHourRange: [9, 14],
    },
  ],

  groceryMerchants: ['Whole Foods — Cambie', 'Save-On-Foods — Davie St', 'IGA — Robson St', 'Urban Fare — Coal Harbour'],
  groceryAmountRange: [45, 120],
  groceryWeeklyFrequency: 2,

  transportMerchants: ['Compass Card — TransLink', 'Uber', 'Evo Car Share'],
  transportAmountRange: [5, 25],
  transportWeeklyFrequency: 3,

  miscMerchants: [
    { name: 'Amazon.ca', amount: [15, 80], category: 'shopping' },
    { name: 'Best Buy', amount: [20, 100], category: 'shopping' },
    { name: 'Shoppers Drug Mart', amount: [10, 35], category: 'personal' },
    { name: 'BC Hydro', amount: [45, 75], category: 'bills' },
    { name: 'Telus Mobility', amount: [65, 85], category: 'bills' },
    { name: 'Dry Cleaner — Gastown', amount: [15, 30], category: 'personal' },
    { name: 'London Drugs', amount: [10, 40], category: 'personal' },
  ],
  miscMonthlyFrequency: 5,
};
