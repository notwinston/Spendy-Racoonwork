Insights Tab Design Guideline

Navigation
The app contains 5 main tabs: Overview · This Month · Trends · Savings · Insights

1. Overview
The first widget. Gives users a quick read on their financial health and month-to-date numbers.

1.1 Financial Health Card
Layout: Two-column horizontal card
Left Column
Right Column
Score (large numeral)
Score breakdown
Grade label (e.g. "B+")
Category progress bars

Design Notes
Card label reads "Financial Health" — not "Financial Health Score"
Label text color: white (high contrast on dark card background)
Do not show a "Score Breakdown" section title — the breakdown lives inline to the right
Right column: rescale progress bars and text to match the card's height; no overflow

1.2 Month Summary KPIs
Three stat chips displayed in a horizontal row below the health card.
Metric
Display
Total Income
Positive value
Total Expenses
Value (can be styled in red)
Net
Delta value (green if positive, red if negative)


1.3 Days Until Budget Runs Out (Warning Chip)
A predictive chip surfaced on this screen only
Based on current spending pace for the month
Style as a warning chip (amber/red tint) — not a section or card

2. This Month
Detailed breakdown of income, spending, and savings progress for the current month.

2.1 KPI Row
Same three metrics as Overview (Income / Expenses / Net), but displayed in expanded card format at the top of the screen.

2.2 Spending Breakdown
Component: Pie chart + category list
Pie Chart
Sections represent spending categories
Each section has a distinct color tied to its category
Category List (below the chart)
For each category, display:
Color swatch — matches the pie chart section
Category name
Amount spent vs. budget (e.g. $800 / $1,000)
Progress bar — fills proportionally to budget used
Fill color: green by default
Overspent: switch fill to red

2.3 Insight Chips
Surface spending callouts as inline chips — not a separate section or list.
Format example:
 ↑ You spent 10% more on coffee than last month
Place chips contextually near the relevant category or inline below the KPI row.

2.4 Savings Goal Progress
Component: Horizontal progress bar per goal
White-filled section = amount already saved
Green-filled section = progress added this month
Background track represents the total goal amount
Do not use a circular/radial indicator — keep it horizontal.

3. Trends
Two stacked widgets showing income and spending patterns over time.

3.1 Widget 1 — Income vs. Spending Chart
Time Frame Toggle (pill/tab style, top of widget)
 Weekly · Monthly · Yearly
Chart — Two layers on a single canvas:
Layer
Type
Color
Income
Bar chart
Green
Spending
Bar chart
Stacked, category color-coded
Net Income
Line overlay (optional toggle)
White or accent color

Supporting Metrics (displayed above or beside the chart):
MoM change — how much expenses increased/decreased vs. last month (shown as a % or $ delta)
Directional arrow indicating trend

3.2 Widget 2 — Net Income / Spending Breakdown Toggle
Toggle: Net Income View · Spending Breakdown View
Header Row (both views):
Period label — e.g. Jan 1 – Sep 11, 2025
MoM or YoY change metric with directional arrow

Net Income View
Chart: Vertical bar chart; X = month, Y = net income
Bar color: green if positive, red if negative
Show total net income for the year-to-date period

Spending Breakdown View
Chart: Stacked vertical bar chart; X = month, Y = total spending
Each bar section is color-coded by category
Legend: Displayed below the chart — color swatch + category name for each category
Show total spending for the year-to-date period

4. Savings
Tracks progress toward savings goals, with projections and scenario modeling.

4.1 Overall Progress Bar
Component: Full-width horizontal progress bar
Section
Visual
Already saved
White fill
Projected next month
Grey fill (extends past white)
Remaining to goal
Empty track

The grey "projected" section gives users a passive nudge — no interaction required.

4.2 Savings Rate Metric
Displayed as a prominent stat near the top of the screen.
Formula: (Amount saved this month ÷ Total income this month) × 100
 Example: Savings Rate: 18%

4.3 Projection Table
Static table shown below the overall bar.
Timeframe
Projected Balance
1 Month
$X,XXX
3 Months
$X,XXX
6 Months
$X,XXX
1 Year
$X,XXX

Assumes user maintains current savings pace.

4.4 "What If" Slider
An interactive contribution slider that updates projections in real time.
Input: Monthly contribution amount (draggable slider or editable field)
Output: Projection table values update live as slider moves
Place directly above or below the projection table

4.5 Per-Goal Cards
One card per savings goal, displayed below the overall bar.
Each card includes:
Goal name
Horizontal progress bar (same white/green style as Section 4.1)
Current saved amount vs. goal target

5. Insights
Surface anomalies, patterns, and personalized recommendations. Each insight type is its own card or section.

5.1 Anomaly Detection
Flag unusual spending spikes.
Format:
 ⚠ Your dining spend this week is 3× your average
Include brief context in the chip or card — not just a raw number.

5.2 Account Split Analysis
Show which accounts or cards are driving the most spend. Useful for users with multiple cards.
Suggested display: Horizontal bar or ranked list with account name, spend amount, and % of total.

5.3 Spending Personality
A gamified card showing the user's spending "type" (e.g. The Foodie, The Homebody).
Include history of past personalities (month-by-month) to show change over time
This adds replayability — users can track how their behavior shifts

5.4 Improvement Suggestions
Automated tips generated from category and trend data.
Format example:
 💡 You're consistently over budget on subscriptions — here's what's recurring
List specific recurring charges where relevant.

6. Other Metrics & Components (Cross-Screen)
These elements may appear across multiple screens.

6.1 Recurring vs. Discretionary Split
Separate fixed costs (rent, subscriptions) from variable spending.
Helps users identify what's actually controllable
Can surface as a stat chip on Overview or as a section in This Month

6.2 Top Merchant List
Within category breakdowns (This Month screen), show the top 3–5 merchants per category.
Example:
Food & Drink — $420 spent
Starbucks — $85
Whole Foods — $210
DoorDash — $125
More actionable than category totals alone.

