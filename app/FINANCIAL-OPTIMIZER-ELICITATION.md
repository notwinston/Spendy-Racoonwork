# Financial Optimizer — Feature Elicitation

## Overview

The Financial Optimizer is an AI-powered financial advisor that lives inside the **AI Insights** section of the **Insights tab**. It analyzes the user's transactions, budgets, debts, subscriptions, and spending patterns to deliver actionable, personalized financial advice.

The existing Insights tab already has 8 sections including a "AI Insights" section with `AIInsightCard` components (types: `warning`, `opportunity`, `win`). The Financial Optimizer would extend this section with new insight types and possibly new dedicated sub-sections.

---

## 1. Spendable Budget Advisor

**Concept**: Tell the user how much money they can safely spend right now, factoring in their budget, goals, upcoming bills, and predicted expenses.

### Questions

**1.1 — Budget Sources**
The app currently has `useBudgetStore` with `totalBudget` and `totalSpent`. What additional data should the optimizer consider?
- [ ] Savings goals (e.g., "Save $5,000 for vacation by August")
- [ ] Emergency fund targets (e.g., "Keep $2,000 minimum in checking")
- [ ] Upcoming known bills (rent, utilities, loan payments)
- [ ] Predicted spending from calendar events (already exists in `predictionStore`)
- [ ] Income/paycheck schedule and amounts
- [ ] Other: ___

**1.2 — Spendable Calculation Method**
How should "spendable amount" be calculated?
- **Option A**: `remaining_budget - upcoming_predicted_expenses - upcoming_bills`
- **Option B**: Option A + factor in savings goal contributions
- **Option C**: Option B + maintain a configurable safety buffer (e.g., always keep $X available)
- **Option D**: Custom formula — describe: ___

**1.3 — Time Horizon**
What time frame should the spendable amount cover?
- [ ] Today only ("You can spend $42 today")
- [ ] This week ("You have $180 left for this week")
- [ ] Until next paycheck ("$320 until Friday payday")
- [ ] Rest of the month
- [ ] User-selectable time frame
- [ ] Multiple horizons shown simultaneously

**1.4 — Category Breakdown**
Should the spendable amount be broken down by category?
- **Option A**: Single total number ("You can spend $180 this week")
- **Option B**: Per-category limits ("$50 left for dining, $80 for groceries, $50 discretionary")
- **Option C**: Total + flagging categories that are close to limit

**1.5 — Update Frequency**
How often should this recalculate?
- [ ] Real-time (every time user opens Insights tab)
- [ ] Daily (as part of a daily brief)
- [ ] After each new transaction
- [ ] On-demand only (user taps to refresh)

**1.6 — User Input Requirements**
What information does the user need to provide for this to work?
- [ ] Monthly income amount(s) and schedule
- [ ] Fixed monthly expenses / bills
- [ ] Savings goals with target amounts and dates
- [ ] Minimum account balance threshold
- [ ] None — infer everything from transaction history
- [ ] Hybrid — infer what we can, prompt for what we can't

**1.7 — Onboarding Flow**
If the user needs to provide data (income, bills, goals), how should we collect it?
- **Option A**: Dedicated onboarding wizard when Financial Optimizer is first enabled
- **Option B**: Gradual prompts — ask one question at a time over multiple sessions
- **Option C**: Settings page where the user fills in their financial profile
- **Option D**: Auto-detect from transaction patterns + confirmation ("We noticed a $1,500 deposit every 2 weeks — is this your salary?")

---

## 2. Debt Priority Advisor

**Concept**: Analyze the user's debts and recommend which to pay off first based on interest rates, minimum payments, deadlines, and total cost.

### Questions

**2.1 — Debt Data Model**
What debt information should the app track per debt?
- [ ] Creditor name
- [ ] Current balance
- [ ] Interest rate (APR)
- [ ] Minimum monthly payment
- [ ] Due date (monthly)
- [ ] Payoff deadline (if any, e.g., promotional 0% APR expiration)
- [ ] Debt type (credit card, student loan, mortgage, auto loan, personal loan, medical, other)
- [ ] Is it tax-deductible? (e.g., mortgage interest, student loan interest)
- [ ] Other: ___

**2.2 — Prioritization Strategies**
Which debt payoff strategies should the optimizer support?
- [ ] **Avalanche** — highest interest rate first (minimizes total interest paid)
- [ ] **Snowball** — smallest balance first (psychological wins)
- [ ] **Hybrid** — avalanche by default but surface quick wins when a small balance can be eliminated
- [ ] **Deadline-aware** — prioritize debts with expiring promotional rates or penalties
- [ ] **Custom weighting** — let user set priority weights for interest rate vs. balance vs. deadline
- [ ] Should the optimizer recommend ONE strategy or present comparisons?

**2.3 — Payment Recommendations**
How specific should payment recommendations be?
- **Option A**: Just rank the debts ("Pay off Credit Card A first, then Student Loan B")
- **Option B**: Rank + suggest specific extra payment amounts ("Pay $50 extra toward Credit Card A this month")
- **Option C**: Full payoff timeline ("If you pay $200/month extra, you'll be debt-free by March 2028, saving $3,400 in interest")

**2.4 — What-If Scenarios**
Should users be able to model scenarios?
- [ ] "What if I put an extra $100/month toward debt?"
- [ ] "What if I pay off Debt X first instead?"
- [ ] "What if I get a $2,000 bonus — where should it go?"
- [ ] "What if I consolidate debts A + B into a lower-rate loan?"
- [ ] Not needed — keep it simple with one recommendation

**2.5 — Debt Entry Method**
How does debt information get into the app?
- [ ] Manual entry form
- [ ] Detected from recurring transaction patterns (e.g., monthly payment to "Chase Credit Card")
- [ ] Plaid/bank integration (future)
- [ ] Import from a spreadsheet or CSV
- [ ] Combination: auto-detect + manual confirmation/correction

**2.6 — Debt Alerts**
What debt-related alerts should the optimizer generate?
- [ ] Upcoming due dates
- [ ] Promotional rate expiration warnings
- [ ] "You can pay off [Debt X] this month if you redirect $Y from discretionary spending"
- [ ] Interest cost milestones ("You've paid $500 in interest to Credit Card A this year")
- [ ] Debt-free date projection changes

---

## 3. Card Rewards Optimizer

**Concept**: Recommend which payment card to use for each purchase to maximize cashback, points, or rewards.

### Questions

**3.1 — Card Data Model**
What information should the app track per card?
- [ ] Card name / nickname
- [ ] Card network (Visa, Mastercard, Amex, Discover)
- [ ] Card type (credit, debit, prepaid)
- [ ] Reward type (cashback %, points per $, miles per $)
- [ ] Category bonuses (e.g., "3% on dining, 2% on groceries, 1% everything else")
- [ ] Rotating category bonuses (e.g., "5% on gas this quarter")
- [ ] Annual fee
- [ ] Sign-up bonus requirements ("Spend $3,000 in first 3 months for $500 bonus")
- [ ] Credit limit
- [ ] Current balance
- [ ] Statement closing date
- [ ] Other: ___

**3.2 — Recommendation Trigger**
When should card recommendations appear?
- [ ] Proactively before predicted spending events (from calendar predictions)
- [ ] As a persistent reference card in the Insights section
- [ ] As a notification before a known spending category (e.g., "Heading to dinner? Use Chase Sapphire for 3x points")
- [ ] Only when the user asks via the chat assistant
- [ ] At the point of transaction review ("You used Card A for groceries, but Card B would have earned 2% more")

**3.3 — Recommendation Scope**
How sophisticated should recommendations be?
- **Option A**: Simple category matching ("Use Card X for dining, Card Y for groceries")
- **Option B**: Option A + factor in rotating categories and quarterly bonus activations
- **Option C**: Option B + sign-up bonus spend tracking ("You need $800 more on Chase to hit the $500 sign-up bonus — use it for everything this month")
- **Option D**: Option C + annual fee ROI analysis ("Your Amex Gold earns you $480/year in rewards but costs $250 — net $230 value")

**3.4 — Card Entry Method**
How does card information get into the app?
- [ ] Manual entry form with reward details
- [ ] Select from a database of known card products (pre-populated reward structures)
- [ ] Plaid integration to detect cards automatically
- [ ] Scan the physical card
- [ ] Combination: ___

**3.5 — Multi-Card Strategy**
Should the optimizer account for card interactions?
- [ ] Utilization ratio optimization ("Keep each card below 30% utilization for credit score")
- [ ] Statement date optimization ("Put this purchase on Card B — its statement closes tomorrow")
- [ ] Not needed — just optimize for rewards

---

## 4. Subscription Manager

**Concept**: Detect, track, and advise on the user's subscriptions. Flag overlapping services, unused subscriptions, and opportunities to save.

### Questions

**4.1 — Subscription Detection**
How should the app identify subscriptions?
- [ ] Auto-detect from recurring transaction patterns (same merchant, similar amount, regular interval)
- [ ] User manually tags transactions as subscriptions
- [ ] Match against a known database of subscription services
- [ ] Combination of auto-detect + manual confirmation

**4.2 — Overlap Detection Rules**
How should "overlapping" subscriptions be defined?
- [ ] Same category (e.g., two video streaming services)
- [ ] Known service overlaps (e.g., "Spotify + Apple Music" or "Netflix + Hulu + Disney+")
- [ ] Services that include features of other services (e.g., "YouTube Premium includes YouTube Music — you can cancel Spotify")
- [ ] Should the app maintain a curated overlap database, or use AI to detect overlaps?

**4.3 — "Unused" Subscription Detection**
How should the app determine if a subscription is unused or underused?
- [ ] Transaction frequency analysis (paying monthly but no associated usage transactions)
- [ ] User self-reports usage level
- [ ] Time since last use prompt ("You haven't used Audible in 3 months — still want to keep it?")
- [ ] Cost-per-use analysis if usage data is available
- [ ] Just flag all subscriptions periodically for user review

**4.4 — Subscription Advice Depth**
How detailed should subscription advice be?
- **Option A**: Simple list with total monthly cost ("You spend $127/month on 8 subscriptions")
- **Option B**: Option A + overlap and unused flags
- **Option C**: Option B + specific cancellation savings ("Cancel Hulu and HBO Max, save $28/month — you already have Netflix and Disney+")
- **Option D**: Option C + alternative suggestions ("Switch from Spotify Premium to YouTube Music, which is included in your YouTube Premium")

**4.5 — Subscription Categories**
What subscription categories should be tracked?
- [ ] Streaming (video, music, audiobooks)
- [ ] Software/Apps (cloud storage, productivity, VPN)
- [ ] News/Media (newspapers, magazines)
- [ ] Fitness/Health (gym, meditation apps, meal plans)
- [ ] Gaming (Xbox Game Pass, PS Plus, cloud gaming)
- [ ] Food delivery memberships (DashPass, Uber One, Instacart+)
- [ ] Shopping memberships (Amazon Prime, Walmart+, Costco)
- [ ] Financial services (credit monitoring, budgeting tools)
- [ ] Education (Coursera, Skillshare, LinkedIn Learning)
- [ ] Other: ___

**4.6 — Annual Subscription Tracking**
Should the app handle annual subscriptions differently?
- [ ] Amortize annual costs to monthly view ("Amazon Prime: $139/year = $11.58/month")
- [ ] Alert before annual renewal dates ("Your Amazon Prime renews in 14 days for $139")
- [ ] Track free trial expirations ("Your Audible free trial ends in 5 days")
- [ ] All of the above

---

## 5. Duplicate Transaction Detector

**Concept**: Alert the user when potential duplicate or fraudulent transactions are detected.

### Questions

**5.1 — Detection Criteria**
What should trigger a duplicate/fraud alert?
- [ ] Same merchant + same amount within X hours
- [ ] Same merchant + same amount + same day
- [ ] Same amount from different merchants within a short window
- [ ] Unusually large transactions compared to history at that merchant
- [ ] Transactions at merchants the user has never used before
- [ ] Transactions in unusual geographic locations
- [ ] Multiple small transactions in rapid succession (card testing pattern)
- [ ] Other: ___

**5.2 — Time Window for Duplicates**
What time window should define "potential duplicate"?
- [ ] Same calendar day
- [ ] Within 1 hour
- [ ] Within 4 hours
- [ ] Within 24 hours
- [ ] Configurable by user

**5.3 — Alert Severity Levels**
Should alerts have different severity levels?
- **Option A**: Binary — either flag it or don't
- **Option B**: Tiered — "Likely duplicate" vs. "Possible duplicate" vs. "Unusual activity"
- **Option C**: Risk score (0-100) with configurable threshold for notifications

**5.4 — User Actions on Alert**
What should the user be able to do when alerted?
- [ ] Confirm as legitimate (dismiss alert)
- [ ] Mark as duplicate (for personal tracking)
- [ ] Flag as fraud (mark for follow-up)
- [ ] Contact bank directly from the app
- [ ] Add merchant to a "known duplicates" whitelist (e.g., split-tab restaurant charges)
- [ ] Snooze alert for this merchant

**5.5 — False Positive Handling**
How should the system learn from false positives?
- [ ] User dismissals train the detection model per merchant
- [ ] Whitelist specific merchant + amount patterns
- [ ] No learning — keep detection rules static
- [ ] Track false positive rate and surface it to the user

---

## 6. Predictive Balance Alert

**Concept**: Project the user's future account balance based on current spending trends and alert them before they hit dangerous thresholds.

### Questions

**6.1 — Projection Method**
How should future balance be projected?
- [ ] Simple linear trend (current daily spend rate extrapolated)
- [ ] Weighted trend (recent days weighted more heavily)
- [ ] Pattern-based (factor in known bills, paydays, and recurring expenses)
- [ ] AI/LLM-based projection using full spending history
- [ ] Multiple methods with confidence intervals

**6.2 — Alert Thresholds**
What balance thresholds should trigger alerts?
- [ ] User-defined minimum balance (e.g., "Alert me if projected to drop below $500")
- [ ] Percentage of monthly budget remaining (e.g., "Alert when less than 10% of budget remains")
- [ ] Days until zero at current rate
- [ ] Insufficient funds prediction for known upcoming bills
- [ ] Multiple configurable thresholds
- [ ] Smart thresholds (auto-calculated based on user's expense patterns)

**6.3 — Alert Timing**
When should the balance prediction alert fire?
- [ ] X days before the projected low point
- [ ] As soon as the projection dips below threshold
- [ ] Daily in the morning brief
- [ ] Weekly forecast summary
- [ ] Only when the projection changes significantly from yesterday

**6.4 — Alert Content**
What information should the alert include?
- **Option A**: Just the warning ("Your balance may fall below $500 by March 22")
- **Option B**: Warning + cause ("...due to upcoming rent ($1,200) and current spending rate")
- **Option C**: Warning + cause + action ("...Consider reducing dining out this week to stay above $500")
- **Option D**: Warning + cause + action + visualization (mini chart showing projected balance curve)

**6.5 — Account Scope**
Which accounts should be included in balance projections?
- [ ] Primary checking account only
- [ ] All linked accounts combined
- [ ] Per-account projections
- [ ] User selects which accounts to monitor

**6.6 — Income Consideration**
Should balance projections factor in expected income?
- [ ] Yes — include known/predicted income deposits
- [ ] Optional — user can toggle income inclusion
- [ ] No — project based on expenses only (conservative approach)

---

## 7. Impulse Spending Pattern Detector

**Concept**: Identify patterns in the user's spending behavior that correlate with impulsive or emotional purchases, and alert them proactively.

### Questions

**7.1 — Pattern Types**
Which impulse spending patterns should the detector look for?
- [ ] **Time-of-day**: Late-night spending spikes (e.g., "You tend to overspend after 10pm")
- [ ] **Day-of-week**: Weekend vs. weekday patterns
- [ ] **Emotional triggers**: Spending spikes after payday
- [ ] **Post-event**: Spending after social events or stressful calendar events
- [ ] **Category clusters**: Rapid succession of purchases in the same category
- [ ] **Amount escalation**: Progressively larger purchases within a session
- [ ] **Merchant patterns**: Frequent small purchases at specific merchants (e.g., in-app purchases)
- [ ] **Seasonal**: Holiday spending spikes, sale season behavior
- [ ] Other: ___

**7.2 — Detection Sensitivity**
How sensitive should pattern detection be?
- **Option A**: Conservative — only flag very clear patterns (high confidence, many data points)
- **Option B**: Moderate — flag likely patterns with some tolerance for noise
- **Option C**: Aggressive — flag anything that looks like it could be a pattern
- **Option D**: User-configurable sensitivity slider

**7.3 — Minimum Data Requirement**
How much transaction history is needed before impulse detection activates?
- [ ] 2 weeks of data
- [ ] 1 month of data
- [ ] 3 months of data (for seasonal patterns)
- [ ] Adaptive — start with basic patterns, add complex ones as data grows

**7.4 — Alert Timing**
When should impulse spending alerts fire?
- [ ] **Preventive**: Before the pattern window (e.g., at 9:30pm: "You tend to overspend late at night. Be mindful!")
- [ ] **Real-time**: When a potential impulse purchase is detected
- [ ] **Retrospective**: In daily/weekly summaries ("Last week you spent $85 on late-night purchases")
- [ ] All of the above at different confidence levels

**7.5 — Alert Tone**
What tone should impulse spending alerts use?
- **Option A**: Neutral/informational ("Your spending patterns show increased activity after 10pm")
- **Option B**: Gentle nudge ("Hey! Just a heads up — you tend to spend more late at night. Take a moment before checking out")
- **Option C**: Motivational ("You saved $45 last week by skipping late-night purchases! Keep it up")
- **Option D**: Configurable by user (some people want direct, some want gentle)

**7.6 — Cooldown Period**
How often should the same pattern alert be shown?
- [ ] Once per occurrence window (e.g., once per evening)
- [ ] Once per day
- [ ] Once per week
- [ ] Adaptive — reduce frequency if user dismisses repeatedly

**7.7 — Privacy Sensitivity**
Impulse spending detection touches sensitive behavioral data. How should this be handled?
- [ ] All analysis happens on-device only
- [ ] Analysis can use LLM (data sent to Gemini) for better pattern detection
- [ ] User explicitly opts into impulse detection as a separate feature toggle
- [ ] Show the user exactly what data is being analyzed and what patterns were found

---

## 8. UI & Integration Design

**Concept**: How all of the above features manifest in the Insights tab UI.

### Questions

**8.1 — Placement Within Insights Tab**
The current Insights tab has 8 sections. Where should Financial Optimizer insights appear?

Current sections:
1. Financial Health Score (hero)
2. Burn Rate & Velocity
3. Calendar Correlation Index
4. Surprise Spend & Cost Variance
5. Spending Trends
6. **AI Insights** (currently has warning/opportunity/win cards)
7. Savings Projection
8. Month-over-Month Comparison

Options:
- **Option A**: Expand the existing "AI Insights" section (section 6) with new card types
- **Option B**: Create a new dedicated "Financial Optimizer" section between sections 5 and 6
- **Option C**: Create a separate scrollable sub-tab within Insights (e.g., "Overview" | "Optimizer")
- **Option D**: Mix — some insights go in the existing AI Insights section, complex features (debt, subscriptions) get their own sections
- **Option E**: Dedicated full-screen modal/sheet accessible from a button in the AI Insights section

**8.2 — Card Types for AIInsightCard**
The existing `AIInsightCard` supports 3 types: `warning`, `opportunity`, `win`. Should new types be added for Financial Optimizer?
- [ ] `debt` — debt-related advice (with a specific icon/color)
- [ ] `subscription` — subscription management alerts
- [ ] `fraud` — duplicate/fraud detection alerts
- [ ] `balance` — predictive balance warnings
- [ ] `impulse` — impulse spending pattern alerts
- [ ] `reward` — card rewards optimization tips
- [ ] Keep existing 3 types and map optimizer insights into warning/opportunity/win

**8.3 — Insight Priority & Ordering**
When multiple optimizer insights are active, how should they be ordered?
- [ ] By urgency (fraud alerts first, then balance warnings, then optimization tips)
- [ ] By potential dollar impact (highest savings opportunity first)
- [ ] By recency (newest insights first)
- [ ] By user preference (user pins/prioritizes certain categories)
- [ ] AI-ranked by relevance to user's current situation

**8.4 — Insight Density**
How many optimizer insights should be visible at once?
- [ ] Show all active insights (could be 10+)
- [ ] Show top 3-5, with "See All" expansion
- [ ] Show 1 "hero" insight prominently + 2-3 secondary
- [ ] Carousel / horizontally scrollable cards
- [ ] Paginated with daily rotation

**8.5 — Actionability**
Should insights have inline actions?
- [ ] Just informational text (user acts on their own)
- [ ] Action button on each card (e.g., "View Debt Plan", "Cancel Subscription", "Review Transaction")
- [ ] Deep links to relevant app sections or settings
- [ ] Quick actions (swipe to dismiss, swipe to act)
- [ ] Chat handoff ("Tap to discuss this with AI assistant")

**8.6 — Detail Views**
Should complex features have dedicated detail screens?
- [ ] **Debt Dashboard**: Full screen with debt list, payoff timeline, interest saved
- [ ] **Subscription Manager**: Full screen with subscription list, overlap map, total cost
- [ ] **Card Wallet**: Full screen with cards, per-category recommendations, reward tracking
- [ ] **Balance Forecast**: Full screen with projection chart, scenario modeling
- [ ] Keep everything in-line within Insights tab (no separate screens)

**8.7 — Notification Integration**
The app has `notificationStore` with types like `spending_alert`, `budget_warning`. Should Financial Optimizer use:
- [ ] Existing notification types (extend current categories)
- [ ] New notification types (e.g., `debt_alert`, `subscription_alert`, `fraud_alert`, `balance_warning`, `impulse_alert`)
- [ ] Both — in-app Insights cards + push notifications for urgent items
- [ ] User configures per-feature which ones become push notifications

**8.8 — Feature Toggles**
Should each optimizer feature be individually toggleable?
- [ ] Yes — granular toggles for each of the 7 features
- [ ] Grouped toggles (e.g., "Spending Alerts" covers balance + impulse, "Debt & Subscriptions" covers both)
- [ ] All-or-nothing Financial Optimizer toggle
- [ ] On by default with ability to mute specific insight types

**8.9 — Empty States**
What should the UI show when a feature has no data yet?
- **Option A**: Hide the section entirely until relevant data exists
- **Option B**: Show a placeholder card explaining the feature and how to activate it ("Add your debts to get payoff recommendations")
- **Option C**: Show with demo/sample data that updates once real data is available
- **Option D**: Progressive reveal — show features as the app learns enough about the user

---

## 9. Data Architecture

### Questions

**9.1 — New Data Models**
Which new data models/stores are needed? (Check all that apply)
- [ ] `Debt` model (balance, rate, minimum payment, type, etc.)
- [ ] `PaymentCard` model (name, rewards structure, limits, etc.)
- [ ] `Subscription` model (merchant, amount, frequency, category, status, etc.)
- [ ] `FinancialProfile` model (income, pay schedule, savings goals, etc.)
- [ ] `OptimizerInsight` model (type, content, priority, action, status, etc.)
- [ ] `SpendingPattern` model (pattern type, confidence, time window, etc.)

**9.2 — Data Persistence**
Where should Financial Optimizer data be stored?
- [ ] Zustand stores with AsyncStorage persistence (current pattern)
- [ ] Supabase backend (for future sync)
- [ ] Local SQLite database
- [ ] Combination: Zustand for runtime state, AsyncStorage for persistence

**9.3 — AI/LLM Usage**
Which features should use the LLM (Gemini) vs. local computation?
- [ ] **LLM**: Natural language insight generation, complex pattern detection, personalized advice tone
- [ ] **Local**: Duplicate detection, balance projection math, subscription overlap matching, debt calculations
- [ ] **Hybrid**: Local computation for data, LLM for presenting insights in natural language
- [ ] Let the LLM do everything (simpler but more API calls and higher cost)

**9.4 — Gemini API Budget Concerns**
Given the current quota issues with Gemini, how should we manage API usage for the optimizer?
- [ ] Batch all optimizer insights into a single daily LLM call
- [ ] Cache insights and only regenerate when underlying data changes
- [ ] Use local computation for everything, only use LLM for the chat assistant
- [ ] Priority queue — only send the highest-value insights to LLM for natural language generation
- [ ] Configurable: user sets how often AI insights refresh

---

## 10. Rollout & Priority

### Questions

**10.1 — Feature Priority**
Rank these features in order of implementation priority (1 = first, 7 = last):
- [ ] Spendable Budget Advisor
- [ ] Debt Priority Advisor
- [ ] Card Rewards Optimizer
- [ ] Subscription Manager
- [ ] Duplicate Transaction Detector
- [ ] Predictive Balance Alert
- [ ] Impulse Spending Pattern Detector

**10.2 — MVP Scope**
For the first release, which features should be included?
- **Option A**: All 7 features in basic form
- **Option B**: Top 3 by user impact (which 3?)
- **Option C**: Start with detection-only features (duplicates, impulse, balance) since they need no new user input
- **Option D**: Start with the features that have the most existing data support (balance alerts, impulse detection — both can work from existing transaction history)

**10.3 — Phased Rollout**
Should features be released in phases?
- **Phase 1**: Features using only existing transaction data (no new user input needed)
- **Phase 2**: Features requiring light user input (debt entry, card entry)
- **Phase 3**: Features requiring ongoing user engagement (subscription reviews, card recommendations at purchase time)

---

## Decision Log

| # | Question | Decision | Date | Notes |
|---|----------|----------|------|-------|
| 1.1 | Budget sources | All: savings goals, emergency fund, upcoming bills, calendar predictions, income/paycheck schedule | 2026-03-01 | |
| 1.2 | Calculation method | Full formula: remaining_budget - predicted_expenses - bills - savings_contributions - safety_buffer | 2026-03-01 | |
| 1.3 | Time horizon | Multiple horizons: today, this week, and until next paycheck shown simultaneously | 2026-03-01 | |
| 1.4 | Category breakdown | Total + category flags (show total spendable + flag categories near their limit) | 2026-03-01 | |
| 1.5 | Update frequency | After each transaction | 2026-03-01 | |
| 1.6 | User input requirements | Onboarding wizard | 2026-03-01 | Dedicated setup flow when Financial Optimizer is first enabled |
| 1.7 | Onboarding flow | Onboarding wizard | 2026-03-01 | Same as 1.6 |
| 2.1 | Debt data model | All: core fields + payoff deadline + tax deductible flag + credit limit | 2026-03-01 | |
| 2.2 | Prioritization strategies | Compare all: side-by-side comparison of avalanche, snowball, deadline-aware | 2026-03-01 | |
| 2.3 | Payment recommendations | Full payoff timeline + specific extra payment amounts | 2026-03-01 | Both depth levels |
| 2.4 | What-if scenarios | Extra monthly payment + reorder priorities | 2026-03-01 | |
| 2.5 | Debt entry method | Manual entry only | 2026-03-01 | |
| 2.6 | Debt alerts | Due date reminders, promo rate expiration, quick win opportunities | 2026-03-01 | No interest milestones |
| 3.1 | Card data model | Core + rewards + annual fee + limits | 2026-03-01 | No rotating bonuses or sign-up tracking in data model |
| 3.2 | Recommendation trigger | Persistent reference card in Insights section | 2026-03-01 | |
| 3.3 | Recommendation scope | Full optimization: category + rotating + sign-up + annual fee ROI | 2026-03-01 | |
| 3.4 | Card entry method | Database + manual (pick from known cards or manually add custom) | 2026-03-01 | |
| 3.5 | Multi-card strategy | Both: utilization optimization + statement date optimization | 2026-03-01 | |
| 4.1 | Subscription detection | Manual tagging | 2026-03-01 | User tags transactions as subscriptions |
| 4.2 | Overlap detection rules | Category-based (flag multiple subscriptions in same category) | 2026-03-01 | |
| 4.3 | Unused detection | User self-reports usage level | 2026-03-01 | |
| 4.4 | Subscription advice depth | List + overlap flags | 2026-03-01 | |
| 4.5 | Subscription categories | Not explicitly selected | 2026-03-01 | Use all categories from elicitation doc |
| 4.6 | Annual subscription tracking | All: amortize to monthly + renewal date alerts + free trial tracking | 2026-03-01 | |
| 5.1 | Detection criteria | New merchant + large amount, rapid small transactions | 2026-03-01 | Not same-merchant duplicates |
| 5.2 | Time window | Configurable by user | 2026-03-01 | |
| 5.3 | Alert severity | Tiered: 'Likely duplicate' / 'Possible duplicate' / 'Unusual activity' | 2026-03-01 | |
| 5.4 | User actions on alert | Confirm legitimate + flag as fraud | 2026-03-01 | No whitelist or snooze |
| 5.5 | False positive handling | Static rules (no learning) | 2026-03-01 | |
| 6.1 | Projection method | Pattern-based (bills, paydays, recurring, calendar predictions) | 2026-03-01 | |
| 6.2 | Alert thresholds | User-defined minimum + insufficient for bills + days until zero | 2026-03-01 | |
| 6.3 | Alert timing | As soon as projected (immediate when projection dips below threshold) | 2026-03-01 | |
| 6.4 | Alert content | Warning + cause + action (actionable advice included) | 2026-03-01 | |
| 6.5 | Account scope | Per-account projections | 2026-03-01 | |
| 6.6 | Income consideration | Yes — include known/predicted income deposits | 2026-03-01 | |
| 7.1 | Pattern types | Post-payday, category clusters, day-of-week, merchant frequency | 2026-03-01 | No time-of-day, no escalation, no seasonal |
| 7.2 | Detection sensitivity | Moderate (flag likely patterns with noise tolerance) | 2026-03-01 | |
| 7.3 | Minimum data requirement | Adaptive (start basic, add complex patterns as data grows) | 2026-03-01 | |
| 7.4 | Alert timing | Preventive + retrospective (no real-time) | 2026-03-01 | |
| 7.5 | Alert tone | Gentle nudge | 2026-03-01 | |
| 7.6 | Cooldown period | Once per occurrence window | 2026-03-01 | |
| 7.7 | Privacy sensitivity | On-device + explicit opt-in | 2026-03-01 | All analysis local, user opts in separately |
| 8.1 | Placement | New dedicated "Financial Optimizer" section in Insights tab | 2026-03-01 | |
| 8.2 | Card types | New specific types: debt, subscription, fraud, balance, impulse, reward | 2026-03-01 | Each with unique icons/colors |
| 8.3 | Priority & ordering | By dollar impact (highest potential savings first) | 2026-03-01 | |
| 8.4 | Insight density | Top 3-5 with "See All" expansion | 2026-03-01 | |
| 8.5 | Actionability | Informational only (no action buttons) | 2026-03-01 | |
| 8.6 | Detail views | Debt Dashboard + Card Wallet + Balance Forecast (no Subscription Manager screen) | 2026-03-01 | |
| 8.7 | Notification integration | New types (debt_alert, fraud_alert, etc.) + user configures which become push | 2026-03-01 | |
| 8.8 | Feature toggles | Granular (individual toggle per feature) | 2026-03-01 | |
| 8.9 | Empty states | Placeholder cards for production; demo data for demo mode | 2026-03-01 | |
| 9.1 | New data models | All 6: Debt, PaymentCard, Subscription, FinancialProfile, OptimizerInsight, SpendingPattern | 2026-03-01 | |
| 9.2 | Data persistence | Zustand + Supabase (already in place) | 2026-03-01 | |
| 9.3 | AI/LLM usage | Hybrid: local math for calculations, Gemini for NL insight text (already implemented) | 2026-03-01 | |
| 9.4 | Gemini API budget | Cache + change detection (only regenerate when data changes) | 2026-03-01 | |
| 10.1 | Feature priority | 1. Spendable Budget, 2. Balance Alert, 3. Impulse, 4. Debt, 5. Duplicates, 6. Subs, 7. Cards | 2026-03-01 | |
| 10.2 | MVP scope | Top 2 polished: Spendable Budget Advisor + Predictive Balance Alert | 2026-03-01 | |
| 10.3 | Phased rollout | Phase 1: Budget + Balance (MVP), Phase 2: Impulse + Debt, Phase 3: Duplicates + Subs + Cards | 2026-03-01 | |
