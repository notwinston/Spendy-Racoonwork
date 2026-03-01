// Transaction generator for FutureSpend demo personas

import {
  CalendarEvent,
  Transaction,
  createRng,
  setRng,
  randomAmount,
  randomChoice,
  randomInt,
  chance,
  iterateDays,
  formatDate,
  isWeekend,
} from './utils';
import { PersonaProfile } from './personas';

const DATE_START = new Date(2025, 11, 1); // Dec 1, 2025
const DATE_END = new Date(2026, 1, 28);   // Feb 28, 2026

/**
 * Generate transactions that correspond to calendar events with spending.
 */
function generateEventTransactions(
  events: CalendarEvent[],
  persona: PersonaProfile
): Transaction[] {
  const transactions: Transaction[] = [];

  // Map event templates to spending info from persona
  const recurringSpendingMap = new Map<string, { baseAmount: number; variancePct: number; merchant: string; category: string }>();
  for (const rec of persona.recurringEvents) {
    if (rec.spending) {
      recurringSpendingMap.set(rec.title, {
        baseAmount: rec.spending.baseAmount,
        variancePct: rec.spending.variancePct,
        merchant: rec.spending.merchant,
        category: rec.spending.spendingCategory,
      });
    }
  }

  const oneOffSpendingMap = new Map<string, { baseAmount: number; variancePct: number; merchants: string[]; category: string }>();
  for (const tmpl of persona.oneOffEvents) {
    if (tmpl.spending) {
      oneOffSpendingMap.set(tmpl.title, {
        baseAmount: tmpl.spending.baseAmount,
        variancePct: tmpl.spending.variancePct,
        merchants: tmpl.spending.merchants,
        category: tmpl.spending.spendingCategory,
      });
    }
  }

  for (const event of events) {
    const eventDate = formatDate(new Date(event.start_time));

    // Check recurring spending
    const recSpending = recurringSpendingMap.get(event.title);
    if (recSpending) {
      transactions.push({
        amount: randomAmount(recSpending.baseAmount, recSpending.variancePct),
        merchant_name: recSpending.merchant,
        category: recSpending.category as Transaction['category'],
        date: eventDate,
        is_recurring: true,
      });
      continue;
    }

    // Check one-off spending
    const oneOffSpending = oneOffSpendingMap.get(event.title);
    if (oneOffSpending) {
      transactions.push({
        amount: randomAmount(oneOffSpending.baseAmount, oneOffSpending.variancePct),
        merchant_name: randomChoice(oneOffSpending.merchants),
        category: oneOffSpending.category as Transaction['category'],
        date: eventDate,
        is_recurring: false,
      });
      continue;
    }

    // Holiday events with special spending
    if (event.title === 'Christmas Eve Dinner') {
      transactions.push({
        amount: randomAmount(45, 0.15),
        merchant_name: 'Safeway — Groceries',
        category: 'groceries',
        date: eventDate,
        is_recurring: false,
      });
    } else if (event.title === "New Year's Eve Party") {
      const isStudent = persona.name === 'Sarah Chen';
      transactions.push({
        amount: randomAmount(isStudent ? 30 : 80, 0.20),
        merchant_name: isStudent ? 'BC Liquor Store' : 'Fairmont Hotel Vancouver',
        category: 'entertainment',
        date: eventDate,
        is_recurring: false,
      });
    } else if (event.title === "Valentine's Day Dinner") {
      transactions.push({
        amount: randomAmount(140, 0.15),
        merchant_name: 'Hawksworth Restaurant',
        category: 'dining',
        date: eventDate,
        is_recurring: false,
      });
    } else if (event.title === "Galentine's Day Dinner") {
      transactions.push({
        amount: randomAmount(38, 0.20),
        merchant_name: 'Earls Kitchen',
        category: 'dining',
        date: eventDate,
        is_recurring: false,
      });
    } else if (event.title === 'Family Day' && persona.name === 'Marcus Thompson') {
      transactions.push({
        amount: randomAmount(120, 0.20),
        merchant_name: 'Whistler Blackcomb',
        category: 'travel',
        date: eventDate,
        is_recurring: false,
      });
    }
  }

  return transactions;
}

/**
 * Generate subscription transactions (monthly recurring charges).
 */
function generateSubscriptionTransactions(persona: PersonaProfile): Transaction[] {
  const transactions: Transaction[] = [];

  for (const sub of persona.subscriptions) {
    // Generate a transaction for each month in the range
    for (let month = 11; month <= 13; month++) { // Dec=11, Jan=12, Feb=13
      const year = month <= 11 ? 2025 : 2026;
      const actualMonth = month <= 11 ? month : month - 12;
      const daysInMonth = new Date(year, actualMonth + 1, 0).getDate();
      const billDay = Math.min(sub.dayOfMonth, daysInMonth);
      const billDate = new Date(year, actualMonth, billDay);

      if (billDate >= DATE_START && billDate <= DATE_END) {
        transactions.push({
          amount: sub.amount,
          merchant_name: sub.merchant,
          category: sub.category,
          date: formatDate(billDate),
          is_recurring: true,
        });
      }
    }
  }

  return transactions;
}

/**
 * Generate grocery shopping transactions.
 */
function generateGroceryTransactions(persona: PersonaProfile): Transaction[] {
  const transactions: Transaction[] = [];
  const totalDays = Math.round((DATE_END.getTime() - DATE_START.getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = totalDays / 7;
  const targetCount = Math.round(persona.groceryWeeklyFrequency * totalWeeks);

  let generated = 0;
  for (const day of iterateDays(DATE_START, DATE_END)) {
    if (generated >= targetCount) break;

    // Prefer weekends for grocery shopping
    const shouldShop = isWeekend(day)
      ? chance(persona.groceryWeeklyFrequency / 3.5)
      : chance(persona.groceryWeeklyFrequency / 14);

    if (shouldShop) {
      transactions.push({
        amount: randomAmount(
          (persona.groceryAmountRange[0] + persona.groceryAmountRange[1]) / 2,
          0.30
        ),
        merchant_name: randomChoice(persona.groceryMerchants),
        category: 'groceries',
        date: formatDate(day),
        is_recurring: false,
      });
      generated++;
    }
  }

  return transactions;
}

/**
 * Generate transport transactions.
 */
function generateTransportTransactions(persona: PersonaProfile): Transaction[] {
  const transactions: Transaction[] = [];
  const totalDays = Math.round((DATE_END.getTime() - DATE_START.getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = totalDays / 7;
  const targetCount = Math.round(persona.transportWeeklyFrequency * totalWeeks);

  let generated = 0;
  for (const day of iterateDays(DATE_START, DATE_END)) {
    if (generated >= targetCount) break;

    // Transport more likely on weekdays
    const dailyChance = isWeekend(day)
      ? persona.transportWeeklyFrequency / 14
      : persona.transportWeeklyFrequency / 7;

    if (chance(dailyChance)) {
      transactions.push({
        amount: randomAmount(
          (persona.transportAmountRange[0] + persona.transportAmountRange[1]) / 2,
          0.30
        ),
        merchant_name: randomChoice(persona.transportMerchants),
        category: 'transport',
        date: formatDate(day),
        is_recurring: false,
      });
      generated++;
    }
  }

  return transactions;
}

/**
 * Generate miscellaneous transactions.
 */
function generateMiscTransactions(persona: PersonaProfile): Transaction[] {
  const transactions: Transaction[] = [];
  const totalDays = Math.round((DATE_END.getTime() - DATE_START.getTime()) / (1000 * 60 * 60 * 24));
  const totalMonths = totalDays / 30;
  const targetCount = Math.round(persona.miscMonthlyFrequency * totalMonths);

  let generated = 0;
  for (const day of iterateDays(DATE_START, DATE_END)) {
    if (generated >= targetCount) break;

    if (chance(persona.miscMonthlyFrequency / 30)) {
      const merch = randomChoice(persona.miscMerchants);
      transactions.push({
        amount: randomAmount((merch.amount[0] + merch.amount[1]) / 2, 0.25),
        merchant_name: merch.name,
        category: merch.category,
        date: formatDate(day),
        is_recurring: false,
      });
      generated++;
    }
  }

  return transactions;
}

/**
 * Generate random small purchases (impulse buys, vending machines, etc.)
 */
function generateImpulseTransactions(persona: PersonaProfile): Transaction[] {
  const transactions: Transaction[] = [];
  const isStudent = persona.name === 'Sarah Chen';

  const impulseOptions = isStudent
    ? [
        { merchant: 'Vending Machine — SFU', amount: [1.50, 3.50], category: 'dining' as const },
        { merchant: '7-Eleven', amount: [3, 8], category: 'dining' as const },
        { merchant: 'Dollar Tree', amount: [3, 12], category: 'shopping' as const },
        { merchant: 'SFU Bookstore', amount: [5, 25], category: 'education' as const },
      ]
    : [
        { merchant: 'Starbucks — Downtown', amount: [5, 8], category: 'dining' as const },
        { merchant: '7-Eleven', amount: [3, 10], category: 'dining' as const },
        { merchant: 'Apple Store', amount: [15, 50], category: 'shopping' as const },
        { merchant: 'Indigo Books', amount: [12, 35], category: 'shopping' as const },
      ];

  for (const day of iterateDays(DATE_START, DATE_END)) {
    if (chance(isStudent ? 0.18 : 0.15)) {
      const item = randomChoice(impulseOptions);
      transactions.push({
        amount: randomAmount((item.amount[0] + item.amount[1]) / 2, 0.25),
        merchant_name: item.merchant,
        category: item.category,
        date: formatDate(day),
        is_recurring: false,
      });
    }
  }

  return transactions;
}

/**
 * Generate quick-service restaurant / fast food transactions (lunch, snacks).
 */
function generateQuickFoodTransactions(persona: PersonaProfile): Transaction[] {
  const transactions: Transaction[] = [];
  const isStudent = persona.name === 'Sarah Chen';

  const options = isStudent
    ? [
        { merchant: 'Tim Hortons', amount: [4, 8], category: 'dining' as const },
        { merchant: 'Subway — SFU', amount: [8, 13], category: 'dining' as const },
        { merchant: 'McDonalds — Burnaby', amount: [7, 12], category: 'dining' as const },
        { merchant: 'A&W — Burnaby', amount: [8, 13], category: 'dining' as const },
        { merchant: 'SFU Dining Hall', amount: [9, 14], category: 'dining' as const },
      ]
    : [
        { merchant: 'Tim Hortons — Downtown', amount: [5, 9], category: 'dining' as const },
        { merchant: 'Chipotle — Robson', amount: [14, 18], category: 'dining' as const },
        { merchant: 'Freshii — Gastown', amount: [12, 16], category: 'dining' as const },
        { merchant: 'JJ Bean Coffee — Gastown', amount: [5, 8], category: 'dining' as const },
        { merchant: 'Sushi Garden — Downtown', amount: [12, 18], category: 'dining' as const },
      ];

  for (const day of iterateDays(DATE_START, DATE_END)) {
    // More likely on weekdays, less on weekends
    const dailyChance = isWeekend(day) ? 0.08 : 0.20;
    if (chance(dailyChance)) {
      const item = randomChoice(options);
      transactions.push({
        amount: randomAmount((item.amount[0] + item.amount[1]) / 2, 0.20),
        merchant_name: item.merchant,
        category: item.category,
        date: formatDate(day),
        is_recurring: false,
      });
    }
  }

  return transactions;
}

export function generateTransactions(
  events: CalendarEvent[],
  persona: PersonaProfile,
  seed: number
): Transaction[] {
  // Set deterministic RNG
  setRng(createRng(seed));

  const eventTxns = generateEventTransactions(events, persona);
  const subscriptionTxns = generateSubscriptionTransactions(persona);
  const groceryTxns = generateGroceryTransactions(persona);
  const transportTxns = generateTransportTransactions(persona);
  const miscTxns = generateMiscTransactions(persona);
  const impulseTxns = generateImpulseTransactions(persona);

  const quickFoodTxns = generateQuickFoodTransactions(persona);

  const allTransactions = [
    ...eventTxns,
    ...subscriptionTxns,
    ...groceryTxns,
    ...transportTxns,
    ...miscTxns,
    ...impulseTxns,
    ...quickFoodTxns,
  ];

  // Sort by date
  allTransactions.sort((a, b) => a.date.localeCompare(b.date));

  return allTransactions;
}
