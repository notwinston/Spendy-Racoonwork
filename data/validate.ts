import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = path.join(__dirname, 'output');

function loadJson(filename: string): any[] {
  return JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, filename), 'utf-8'));
}

const sarahEvents = loadJson('sarah_events.json');
const sarahTxns = loadJson('sarah_transactions.json');
const marcusEvents = loadJson('marcus_events.json');
const marcusTxns = loadJson('marcus_transactions.json');

// Check date ranges
const allDates = [...sarahEvents.map((e: any) => e.start_time), ...marcusEvents.map((e: any) => e.start_time)].sort();
console.log('Event date range:', allDates[0], 'to', allDates[allDates.length - 1]);

const allTxnDates = [...sarahTxns.map((t: any) => t.date), ...marcusTxns.map((t: any) => t.date)].sort();
console.log('Txn date range:', allTxnDates[0], 'to', allTxnDates[allTxnDates.length - 1]);

// Check amount variance
const jjBeanAmounts = sarahTxns.filter((t: any) => t.merchant_name === 'JJ Bean Coffee').map((t: any) => t.amount);
console.log('\nJJ Bean amounts:', jjBeanAmounts.slice(0, 8));

const teamLunchAmounts = marcusTxns
  .filter((t: any) => ['Nuba', 'Tacofino'].includes(t.merchant_name))
  .map((t: any) => t.amount);
console.log('Team Lunch amounts:', teamLunchAmounts.slice(0, 8));

// Recurring vs non-recurring
const sarahRecurring = sarahTxns.filter((t: any) => t.is_recurring).length;
const sarahNon = sarahTxns.filter((t: any) => t.is_recurring === false).length;
console.log('\nSarah: recurring=' + sarahRecurring + ', non-recurring=' + sarahNon);

const marcusRecurring = marcusTxns.filter((t: any) => t.is_recurring).length;
const marcusNon = marcusTxns.filter((t: any) => t.is_recurring === false).length;
console.log('Marcus: recurring=' + marcusRecurring + ', non-recurring=' + marcusNon);

// Holiday events
const holidays = ['Christmas Eve Dinner', 'Christmas Day', "New Year's Eve Party", "Galentine's Day Dinner", "Valentine's Day Dinner", 'Family Day'];
const sarahHolidays = sarahEvents.filter((e: any) => holidays.includes(e.title));
console.log('\nSarah holidays:', sarahHolidays.map((e: any) => e.title + ' (' + e.start_time.slice(0,10) + ')'));
const marcusHolidays = marcusEvents.filter((e: any) => holidays.includes(e.title));
console.log('Marcus holidays:', marcusHolidays.map((e: any) => e.title + ' (' + e.start_time.slice(0,10) + ')'));

// Validate categories
const validCats = ['dining','groceries','transport','entertainment','shopping','travel','health','education','fitness','social','professional','bills','personal','other'];
const invalidEventCats = [...sarahEvents, ...marcusEvents].filter((e: any) => !validCats.includes(e.category));
const invalidTxnCats = [...sarahTxns, ...marcusTxns].filter((t: any) => !validCats.includes(t.category));
console.log('\nInvalid event categories:', invalidEventCats.length === 0 ? 'NONE (all valid)' : invalidEventCats.length);
console.log('Invalid txn categories:', invalidTxnCats.length === 0 ? 'NONE (all valid)' : invalidTxnCats.length);

// Summary stats
console.log('\n=== FINAL VALIDATION ===');
console.log('Sarah events:', sarahEvents.length, sarahEvents.length >= 180 ? 'PASS' : 'FAIL');
console.log('Sarah transactions:', sarahTxns.length, sarahTxns.length >= 200 ? 'PASS' : 'FAIL');
console.log('Marcus events:', marcusEvents.length, marcusEvents.length >= 180 ? 'PASS' : 'FAIL');
console.log('Marcus transactions:', marcusTxns.length, marcusTxns.length >= 200 ? 'PASS' : 'FAIL');

const allPass = sarahEvents.length >= 180 && sarahTxns.length >= 200 && marcusEvents.length >= 180 && marcusTxns.length >= 200 && invalidEventCats.length === 0 && invalidTxnCats.length === 0;
console.log('\nOverall:', allPass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED');
process.exit(allPass ? 0 : 1);
