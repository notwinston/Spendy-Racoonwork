// Main entry point for generating FutureSpend synthetic data

import * as fs from 'fs';
import * as path from 'path';
import { sarahChen, marcusThompson } from './generators/personas';
import { generateCalendarEvents } from './generators/calendarGenerator';
import { generateTransactions } from './generators/transactionGenerator';

const OUTPUT_DIR = path.join(__dirname, 'output');

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function writeJson(filename: string, data: unknown): void {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`  Written: ${filepath}`);
}

function main(): void {
  ensureOutputDir();
  console.log('FutureSpend Synthetic Data Generator');
  console.log('====================================\n');

  // --- Sarah Chen ---
  console.log('Generating data for Sarah Chen...');
  const sarahEvents = generateCalendarEvents(sarahChen, 1001);
  console.log(`  Calendar events: ${sarahEvents.length}`);

  const sarahTransactions = generateTransactions(sarahEvents, sarahChen, 2001);
  console.log(`  Transactions: ${sarahTransactions.length}`);

  writeJson('sarah_events.json', sarahEvents);
  writeJson('sarah_transactions.json', sarahTransactions);

  // --- Marcus Thompson ---
  console.log('\nGenerating data for Marcus Thompson...');
  const marcusEvents = generateCalendarEvents(marcusThompson, 3001);
  console.log(`  Calendar events: ${marcusEvents.length}`);

  const marcusTransactions = generateTransactions(marcusEvents, marcusThompson, 4001);
  console.log(`  Transactions: ${marcusTransactions.length}`);

  writeJson('marcus_events.json', marcusEvents);
  writeJson('marcus_transactions.json', marcusTransactions);

  // --- Summary ---
  console.log('\n====================================');
  console.log('Summary:');
  console.log(`  Sarah:  ${sarahEvents.length} events, ${sarahTransactions.length} transactions`);
  console.log(`  Marcus: ${marcusEvents.length} events, ${marcusTransactions.length} transactions`);

  // Validate minimums
  const issues: string[] = [];
  if (sarahEvents.length < 180) issues.push(`Sarah events: ${sarahEvents.length} < 180 minimum`);
  if (marcusEvents.length < 180) issues.push(`Marcus events: ${marcusEvents.length} < 180 minimum`);
  if (sarahTransactions.length < 200) issues.push(`Sarah transactions: ${sarahTransactions.length} < 200 minimum`);
  if (marcusTransactions.length < 200) issues.push(`Marcus transactions: ${marcusTransactions.length} < 200 minimum`);

  if (issues.length > 0) {
    console.log('\nWARNINGS:');
    for (const issue of issues) {
      console.log(`  ! ${issue}`);
    }
  } else {
    console.log('\nAll minimum counts met!');
  }

  // Category distribution
  console.log('\nSarah event categories:');
  printCategoryDistribution(sarahEvents.map(e => e.category));
  console.log('\nMarcus event categories:');
  printCategoryDistribution(marcusEvents.map(e => e.category));

  console.log('\nSarah transaction categories:');
  printCategoryDistribution(sarahTransactions.map(t => t.category));
  console.log('\nMarcus transaction categories:');
  printCategoryDistribution(marcusTransactions.map(t => t.category));

  console.log('\nDone!');
}

function printCategoryDistribution(categories: string[]): void {
  const counts: Record<string, number> = {};
  for (const cat of categories) {
    counts[cat] = (counts[cat] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sorted) {
    const pct = ((count / categories.length) * 100).toFixed(1);
    console.log(`    ${cat}: ${count} (${pct}%)`);
  }
}

main();
