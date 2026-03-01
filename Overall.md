Finance App — UI Design Guidelines v2
Based on Lucas Feedback · Version 2.0 · February 2026
This document is the single source of truth for all UI/UX changes. Follow each section sequentially when redesigning screens and components.
 
 
1. Color System
The current blue/green mixed accent and mid-blue background must be replaced entirely with a cohesive dark navy palette. The UI should feel close to near-black, with a single strong dark-blue accent. Green is only permitted as a semantic positive/success color.
 
1.1 Background Layers
Use four distinct surface levels to create depth. Never use a flat single background color.
 
Layer
Token
Hex Value
Used For
Base
bg-app
#050D1A
Screen / page root — closest to black
Surface 1
bg-card
#0A1628
Default cards, nav bar, bottom tabs
Surface 2
bg-elevated
#0F2040
Modals, section headers, date pickers
Surface 3
bg-hover
#162B55
Hover states, selected list rows
Border
border-subtle
rgba(37,99,235, 0.18)
All card and panel borders

 
1.2 Accent Colors
Replace all teal, green, or mixed-blue accents with the following dark blue accent scale. Only one accent family is used across the entire product.
 
Name
Hex Value
Usage
Accent Dark
#1A3A8F
Primary accent — buttons, active states, nav indicators
Accent Bright
#2563EB
CTAs, chart lines, progress bars, links
Accent Glow
#3B82F6
Labels, stat highlights, icon fills

 
1.3 Semantic Colors
These are the only non-blue colors permitted in the UI, and only for their specific semantic meaning.
 
Name
Hex Value
Meaning
Example Use
Positive
#10B981
Under budget, gain, success
Remaining balance, goal achieved
Warning
#F59E0B
Approaching limit, caution
80–99% of budget used
Negative
#EF4444
Overspend, error, alert
Over budget, failed transaction

 
1.4 Text Colors
Name
Hex Value
Usage
Text Primary
#F0F4FF
Headings, monetary values, active labels
Text Secondary
#94A3B8
Body text, descriptions, metadata
Text Muted
#4A5568
Timestamps, disabled states, captions

 
1.5 Migration Rule
Any screen, component, or icon currently using a green or teal accent color must be updated to #2563EB (Accent Bright). Any existing "blue" background that reads as mid-blue (e.g. #1E3A5F or similar) must be darkened to #0A1628 or #050D1A. Run a global find on all hardcoded color values before implementation.
 
 
2. Typography
Updated to reflect the latest FinanceOS UI implementation. Three font families are now in use, each with a specific purpose. Apply this scale consistently across all screens.
Font Families in Use
Family
Purpose
Weights Used
Syne
Brand identity only — logo wordmark and page title bar
700, 800
DM Mono
All numeric values — balances, stats, chart axes, inline data figures
500, 600
DM Sans
Everything else — headings, body, labels, nav, buttons, captions
400, 500, 600, 700

Critical rule: DM Mono must be used for ALL numeric display values regardless of size. Never render financial figures in Syne or DM Sans.
Type Scale
Role
Font
Size
Weight
Color
Example Use
BRAND
Logo / Wordmark
Syne
20px
800 ExtraBold
#F0F4FF
App name in sidebar — Syne is only permitted here and in the page title bar
Page Title Bar
Syne
18px
700 Bold
#F0F4FF
Top bar page title (Dashboard, Plan, Insights)
NUMERIC DISPLAY  —  DM MONO ONLY
Display Large
DM Mono
28–36px
500 Medium
#F0F4FF
KPI card values, hero balances, large scores — letter-spacing: -0.5px
Display Medium
DM Mono
18px
500 Medium
#F0F4FF
Budget summary stats (Spent · Budget · Remaining) — letter-spacing: -0.3px
Inline Value
DM Mono
13–14px
600–700
#F0F4FF
Category amounts, allocation dollar figures, recurring amounts
Chart Axis
DM Mono
10px
400 Regular
#4A5568
Date labels and axis ticks on all charts
HEADINGS  —  DM SANS
Heading 2 / Card Title
DM Sans
14–15px
700 Bold
#F0F4FF
Section headings, card titles, category list header
Heading 3 / Sub-title
DM Sans
13–14px
600 SemiBold
#F0F4FF
Category names, user name, predict card titles, goal names
BODY  —  DM SANS
Body / Navigation
DM Sans
14px
500 Medium
#94A3B8
Nav item labels, body descriptions, card sub-text
Body Small
DM Sans
12–13px
400 Regular
#94A3B8
Card sub-lines, prediction body copy, comparison notes
LABELS & TAGS  —  DM SANS
Card Label
DM Sans
10px
700 Bold
#4A5568
KPI card category label — ALL CAPS, letter-spacing: 1.2px
Metric Label
DM Sans
10px
700 Bold
#4A5568
Insights metric card label — ALL CAPS, letter-spacing: 1px
Section Divider
DM Sans
11px
700 Bold
#4A5568
Sidebar nav labels, section dividers — ALL CAPS, letter-spacing: 1.2–1.5px
Tier / Badge
DM Sans
12px
700 Bold
#F59E0B
Tier chips (Gold Saver), streak badge — color varies by semantic meaning
Sort / Tab
DM Sans
10–13px
600–700
#FFFFFF
Sort toggle buttons, tab switcher labels (active: white on #1A3A8F)
Trend Indicator
DM Sans
11–12px
700 Bold
Semantic
Delta badges — #10B981 positive, #EF4444 negative, #F59E0B warning
CAPTION  —  DM SANS
Caption / Meta
DM Sans
10–11px
500 Medium
#4A5568
Timestamps, chart sub-labels, category percentage, secondary metadata
Sub-label
DM Sans
11–12px
600 SemiBold
#4A5568
Predict card sub-title, user tier in sidebar footer, rec due dates

Implementation Notes
1.  Syne is restricted to brand use (logo + page title bar only). Do not use Syne for card values, stats, or any numeric content.
2.  Any element showing a currency, percentage, ratio, or score must use DM Mono at weight 500 or 600. This includes inline figures within body sentences.
3.  letter-spacing: -0.5px applies to all DM Mono display sizes 18px and above to compensate for monospace character spacing.
4.  ALL CAPS text must always use letter-spacing of at least 1px. Never render ALL CAPS labels without tracking.
5.  Semantic colors for trend indicators: Positive #10B981 · Warning #F59E0B · Negative #EF4444. These are the only non-blue text colors permitted outside of standard text tokens.
6.  Minimum body text size is 12px at weight 400. Do not render descriptive body copy below this size.
 
 
3. Dashboard Page
 
3.1 Monthly Budget Time Chart  [NEW]
Add a time chart directly above the monthly budget total number. This is the primary new visual element on the Dashboard.
 
SPECIFICATION
• Chart type: area chart or sparkline with a gradient fill under the line
• X-axis: days of the current month (1 through end of month)
• Y-axis: cumulative spend amount
• Dotted horizontal line at the budget limit, colored #F59E0B (Warning)
• Future days (from today onward): render bars at 20% opacity to show projected space
• Tapping any bar or point shows a tooltip with that day's spend amount
• Below the chart, show three summary stats in a row: Spent · Budget · Remaining
 
COLORS
• Chart fill gradient: from rgba(37,99,235,0.3) at top to transparent at base
• Chart line: #2563EB
• Budget limit line: #F59E0B, dashed
• Remaining amount label: #10B981 if positive, #EF4444 if overspent
 
3.2 Category List Ordering  [CHANGED]
The category list on the dashboard must support two sort modes. Provide a toggle or segmented control labeled '$ Amount | A–Z' at the top-right of the categories section.
 
• By Spending (default): Highest spend first — surfaces biggest expenses immediately
• Alphabetical: A–Z ordering — easier to scan for a specific category by name
• Persist the user's preference in local storage across sessions
 
3.3 Rank / Social Widget  [NEW]
Add a compact social rank card to the Dashboard, below the budget summary. All peer comparison data must be anonymized and opt-in.
 
• Rank card: Show the user's percentile among all users — e.g. 'You're in the top 23% of savers this month'
• Percentile bar: A horizontal progress bar showing position within the full range
• Streak badge: Displayed in the page header — e.g. '🔥 4-month streak under budget'
• Comparison callout: One contextual insight — e.g. 'Your dining spend is 18% lower than similar users'
• Leaderboard (opt-in): Friend list ranked by savings rate percentage, not absolute dollar amounts
 
Privacy rule: Never display another user's raw dollar figures. Show percentages and rank positions only. Provide an anonymous mode where the user appears as 'User #N'.
 
 
4. Plan Tab

4.1 New Goal / Modify Goal Flow  [NEW]
Replace the static goal display with a full Goal Editor. Access via a prominent '+ New Goal' button and an edit icon on each existing goal. The flow has three steps.
 
Step 1 — Set Monthly Budget Limit
• Single large numeric input, centered on screen
• Display the previous month's actual spend below as a reference (e.g. 'Last month: $2,340')
• Primary CTA: 'Set Budget' button in #2563EB
 
Step 2 — Category Allocation Sliders
• Each spending category has its own labeled slider row
• The slider controls the percentage of total budget allocated to that category
• Display both the percentage and computed dollar amount simultaneously, updating live as the slider moves
– Example: 'Food — 28% · $700'
• Sliders snap in 1% increments; allow double-tap to type a custom value
• Running total bar at the bottom shows remaining unallocated budget
– Default color: #2563EB
– Above 95% allocated: turn #F59E0B (Warning)
– Above 100% allocated: turn #EF4444 (Negative) and disable the Save button
 
Step 3 — Savings Goals
• Support multiple simultaneous saving goals (e.g. Emergency Fund, Vacation, New Laptop)
• Each goal requires: name, target amount, target date, monthly contribution amount
• Show a projected completion date that recalculates dynamically based on the contribution input
• '+ Add another goal' link below the current goal list
• Goals can be reordered, paused, or deleted individually
 
4.2 Recurring Expenses — Relocated to Insights  [CHANGED]
Move the recurring expenses module out of the Plan tab and into the Insights tab. Rationale:
 
• Recurring expenses are observed historical data, not a planning input
• Plan should contain only forward-looking budget configuration and goal-setting
• In Insights, recurring expenses can be paired with predictive projections (e.g. 'Your subscriptions will cost $180 this quarter')
 
 
5. Insights Tab
 
Refer to the formatted insights tab document
 
6. Social & Rank System
 
6.1 Rank Tiers
Define savings rank tiers based on savings rate. Display the user's current tier and a progress bar to the next tier on the Dashboard rank card.
 
Tier
Savings Rate
Accent Color
Badge Label
Bronze
< 5%
#CD7F32
🥉 Getting Started
Silver
5–15%
#94A3B8
🥈 On Track
Gold
15–25%
#F59E0B
🥇 Saver
Platinum
25–40%
#3B82F6
💎 Super Saver
Diamond
> 40%
#8B5CF6
🔷 Financial Elite

 
6.2 Friend Leaderboard (Opt-in)
• Users must explicitly opt in and invite friends — this is never auto-enrolled
• Ranked by savings rate percentage only — never by dollar amounts
• Show: rank position, tier badge, and this month's savings rate per user
• Anonymous mode available — user appears as 'User #7' instead of their name
 
7. Predictive Features
7.1 End-of-Month Spend Forecast
Project total spend by month-end based on current velocity. Show this on the Dashboard time chart as a dashed line extending from today to the end of the month.
 
• Formula: (Spent so far ÷ Days elapsed) × Total days in month
• Render confidence range as a translucent shaded band around the projection line
• If projected total exceeds budget: show a red warning callout — e.g. 'At this pace, you'll overspend by $340'
• If on track: show a green note — e.g. 'You're on pace to save $210 this month'
 
7.2 Anomaly & Overspend Alerts
• Push notification when a category exceeds 80% of its allocated budget mid-month
• In-app banner for any single transaction that is 2× the average for that category
• Weekly digest summary — e.g. 'You spent 40% more on dining this week than your average'
 
7.3 Bill & Cash Flow Prediction
• Detect recurring expenses and predict future billing dates automatically
• Show a 30-day cash flow calendar view in Insights — e.g. '$14.99 Netflix due Feb 12'
• Flag pay periods with unusually high predicted outflows before they occur

7.4 Goal Achievement Prediction
• For each savings goal, show a dynamic ETA based on current contribution rate
• Example: 'At your current rate, you'll reach your Vacation goal in 8 months (Oct 2026)'
• Offer a suggestion: 'Add $50/month to hit it 2 months earlier'
• One-tap 'Accept' to update the contribution in the goal editor
 
7.5 Smart Category Budget Suggestions
• After 3 months of data, analyze actuals and suggest adjusted category budgets
• Example: 'Your food spend has averaged $580 for 3 months — consider adjusting your budget from $400 to $580'
• One-tap 'Accept Suggestion' to update that category's budget allocation
• Dismissed suggestions should not resurface for 30 days
 
8. Component Specifications
 
8.1 Spacing & Border Radius
Token
Value
Usage
radius-sm
6px
Badges, tags, small chips
radius-md
10px
Buttons, input fields
radius-lg
14px
Cards, panels, list containers
radius-xl
20px
Modals, bottom sheets
spacing-xs
4px
Inline gaps between icons and text
spacing-sm
8–12px
Internal card padding
spacing-md
16–24px
Section padding, between-card gaps
spacing-lg
32–48px
Page-level vertical spacing

 
8.2 Button Styles
Variant
Background
Text Color
Used For
Primary
#2563EB
#FFFFFF
Main CTAs — Set Budget, Save Goal, Confirm
Secondary
rgba(37,99,235,0.12)
#3B82F6
Alternative actions, secondary options
Ghost
Transparent
#94A3B8
Cancel, dismiss, tertiary actions
Danger
rgba(239,68,68,0.12)
#EF4444
Delete goal, clear data, destructive actions

 
8.3 Chart Color Sequence
When multiple categories appear in the same chart, apply these colors in order. Do not use any other colors for chart series.
 
Order
Hex
Name
1st
#2563EB
Blue (primary accent)
2nd
#10B981
Green (positive semantic)
3rd
#8B5CF6
Purple
4th
#F59E0B
Amber (warning semantic)
5th
#EC4899
Pink
6th
#06B6D4
Cyan

 

