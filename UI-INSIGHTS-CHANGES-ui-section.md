## SECTION 2: OVERALL UI CHANGES ACROSS THE APP

This section provides a comprehensive comparison of the current FutureSpend codebase UI against the target UI specified in MVP.md Section 15 (Screen-by-Screen UI Specification) and the IMPLEMENTATION-PLAN.md component lists. For every screen and shared system, it details what exists today, what the MVP spec requires, and the exact changes needed to close the gap.

---

### 2.1 Global Design System Changes

#### Current State

**Colors** (`/workspace/app/src/constants/colors.ts`, 56 lines):
- Background: `#0A1628`, Card: `#132039`, CardBorder: `#1E3054`
- Accent: `#00D09C`, AccentDark: `#00A87D`
- Status: positive `#22C55E`, warning `#FFB020`, danger `#FF4757`, info `#3B82F6`
- Burn rate colors: burnExcellent `#22C55E`, burnOnTrack `#FACC15`, burnCaution `#F97316`, burnOver `#EF4444`
- Text: textPrimary `#FFFFFF`, textSecondary `#94A3B8`, textMuted `#64748B`
- Tab bar: tabBarBackground `#0D1B2A`, tabBarBorder `#1E3054`, tabActive `#00D09C`, tabInactive `#64748B`
- Badge tiers: bronze `#CD7F32`, silver `#C0C0C0`, gold `#FFD700`, diamond `#B9F2FF`
- Health score grades: gradeAPlus through gradeF
- Overlays: overlay `rgba(10,22,40,0.8)`, overlayLight `rgba(10,22,40,0.5)`

**Typography** (`/workspace/app/src/constants/typography.ts`, 25 lines):
- Sizes: xs=10, sm=12, md=14, lg=16, xl=18, 2xl=22, 3xl=28, 4xl=34, 5xl=42
- Weights: regular 400, medium 500, semibold 600, bold 700
- Line heights: tight 1.2, normal 1.5, relaxed 1.75

**Spacing** (`/workspace/app/src/constants/spacing.ts`, 11 lines):
- xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32, 4xl=40, 5xl=48

#### Target State (MVP.md Section 15)

MVP.md specifies: `#0A1628` background, `#0F2847` card surfaces, `#00D09C` teal accent, `#FFFFFF` primary text, `#8899AA` secondary text, `#FF6B6B` destructive/over-budget red, `#FFD93D` warning yellow. Typography: Inter/SF Pro. Border radius: 16px cards, 12px buttons.

#### Changes Needed

| Token | Current | Target | Action |
|-------|---------|--------|--------|
| `card` | `#132039` | `#0F2847` | Update to match MVP spec |
| `textSecondary` | `#94A3B8` | `#8899AA` | Update to match MVP spec |
| `danger` | `#FF4757` | `#FF6B6B` | Update to match MVP spec |
| `warning` | `#FFB020` | `#FFD93D` | Update to match MVP spec |
| `cardBorder` | `#1E3054` | `#1A3A5C` | Update (referenced in Screen 2 spec) |

**New tokens needed:**
- `warningYellow: '#FFD93D'` -- used in multiple budget warning contexts
- `destructiveRed: '#FF6B6B'` -- used for over-budget states
- `chartPredictionDashed: '#00D09C'` -- for dashed prediction lines on charts
- `chartConfidenceFill: 'rgba(0,208,156,0.15)'` -- shaded confidence intervals

**Typography additions needed:**
- Add font family specification: `fontFamily: 'Inter'` or `'System'` (Inter/SF Pro as spec calls for)
- No new size tokens needed; current scale covers all spec requirements

**Spacing additions needed:**
- No gaps identified; current spacing scale is sufficient

---

### 2.2 Global Components

New shared/reusable components that need to be built, as specified in IMPLEMENTATION-PLAN.md component lists across Cycles 9, 10, 12, 13, 16, 17, and 20.

#### Components to Build

| Component | Description | Key Props | Referenced In |
|-----------|-------------|-----------|---------------|
| `SpendingTrajectoryChart` | Victory Native line chart: solid actual line, dashed budget limit, dashed prediction line, shaded confidence interval | `spent: number`, `budget: number`, `predictions: DailyPrediction[]`, `daysInMonth: number` | Cycle 9 (Dashboard) |
| `HealthScoreRing` | Large SVG circular gauge (120-140px), color gradient ring (red/yellow/green), score number center, letter grade | `score: number`, `size?: number`, `showGrade?: boolean` | Cycle 9 (Dashboard), Cycle 17 (Insights) |
| `BurnRateGauge` | Circular gauge with color-coded indicator for spending pace | `burnRate: number`, `size?: number` | Cycle 9 (Dashboard) |
| `MetricCard` | Small card showing label, value, sub-label with trend arrow | `label: string`, `value: string`, `subLabel?: string`, `trend?: 'up' \| 'down' \| 'stable'`, `color?: string` | Cycle 9 (Dashboard) |
| `AnimatedNumber` | Number that animates from 0 to target value on mount | `value: number`, `prefix?: string`, `suffix?: string`, `duration?: number` | Multiple screens |
| `ProgressRing` | SVG circular progress indicator (64px) for category budgets | `progress: number`, `size?: number`, `strokeColor?: string`, `children?: ReactNode` | Cycle 9 (Dashboard) |
| `StatusBadge` | Pill-shaped badge with icon and label, colored by status | `label: string`, `variant: 'success' \| 'warning' \| 'danger' \| 'info'`, `icon?: string` | Multiple screens |
| `SkeletonLoader` | Skeleton loading placeholder for all data views | `width?: number`, `height?: number`, `borderRadius?: number` | Cycle 20 (Polish) |
| `CategoryDonut` | Animated donut chart (Victory Native or react-native-svg) | `data: { category: string, amount: number, color: string }[]` | Cycle 17 (Insights) |
| `CCIVisualization` | Calendar Correlation Index gauge/scatter plot | `cciScore: number`, `dataPoints?: { predicted: number, actual: number }[]` | Cycle 17 (Insights) |
| `MonthComparison` | Side-by-side comparison of this month vs last month | `currentMonth: MonthData`, `previousMonth: MonthData` | Cycle 17 (Insights) |
| `SavingsProjection` | Compound growth area chart with goal markers | `monthlySavings: number`, `months: number[]`, `goals?: Goal[]` | Cycle 17 (Insights) |
| `Podium` | Top-3 display with pedestals and crown/medal icons | `entries: LeaderboardEntry[]` | Cycle 16 (Arena) |
| `NotificationBell` | Bell icon with red unread count badge | `unreadCount: number`, `onPress: () => void` | Dashboard, Plan, Arena, Insights headers |
| `DemoSwitcher` | Hidden persona switcher (triple-tap logo) | `onSwitch: (persona: string) => void` | Cycle 19 (Demo) |
| `ConfettiAnimation` | Full-screen confetti burst for celebrations | `trigger: boolean`, `onComplete?: () => void` | Arena check-in, level-up, budget set |
| `DayDetailSheet` | Draggable bottom sheet for calendar day details | `date: Date`, `events: CalendarEvent[]`, `predictions: Map`, `snapPoints: number[]` | Cycle 10 (Calendar) |

---

### 2.3 Onboarding: Welcome Screen

**Current State**: `/workspace/app/app/onboarding/welcome.tsx` (138 lines)
- Displays "FutureSpend" logo text, tagline, 3 feature cards (Calendar Intelligence, Smart Predictions, Social Savings), progress dots, "Get Started" button
- Uses Ionicons for feature icons
- Simple static layout with no animations

**Target State** (MVP.md Screen 1):
- Full-screen splash with animated logo (stylized crystal ball with calendar grid overlay, Lottie animation with teal glow pulse)
- Tagline fades in word by word ("See Tomorrow, Save Today, Share Success")
- Three feature highlight cards with staggered entrance animations
- Primary CTA "Get Started" button (56px height, full width minus 32px margin)
- Secondary link: "Already have an account? Log In"

**Changes Needed**:
- Add animated logo component (Lottie or animated SVG) replacing plain text logo
- Add word-by-word tagline fade-in animation
- Add staggered entrance animations on the 3 feature cards
- Add "Already have an account? Log In" secondary link below the CTA button
- Increase CTA button height to 56px (currently 48px via Button component minHeight)
- Add session token check in AsyncStorage to auto-redirect returning users

**New Components**:
- `AnimatedLogo` -- Lottie animation with teal glow pulse (or `Animated.View` with scale/opacity)
- `StaggeredEntrance` -- Wrapper that animates children with delays

**Data Requirements**:
- Check AsyncStorage for existing session token on mount

---

### 2.4 Onboarding: Connect Calendar

**Current State**: `/workspace/app/app/onboarding/connect-calendar.tsx` (245 lines)
- Shows calendar icon, title "Connect Your Calendar", subtitle
- Four connection options as Card-wrapped buttons: Apple Calendar, Google Calendar, Upload .ics File, Use Demo Data
- Progress dots (dot 2 active), skip link
- Connected success state with event count and summary card

**Target State** (MVP.md Screen 2):
- Progress indicator (4 dots, dot 2 active) -- matches current
- Large calendar illustration (animated event blocks, Lottie or static SVG)
- Connection cards: Google Calendar (with Google "G" logo), Upload .ics (with upload icon), Demo Data (with sparkle icon and "Quick Start" badge)
- No Apple Calendar option in spec (spec lists Google Calendar, Upload .ics, Demo Data)

**Changes Needed**:
- Replace plain Ionicon calendar icon with a stylized calendar illustration (animated event blocks)
- Add Google "G" logo to Google Calendar connection card
- Add upload icon to the .ics upload card
- Add "Quick Start" badge to the Demo Data card
- Consider removing Apple Calendar option (not in spec) or keeping as bonus feature
- Style connection cards as full-width cards with `#0F2847` background, `#1A3A5C` border, 16px radius (currently using Card component which has `#132039` background)

**New Components**:
- `ConnectionCard` -- Styled card with logo, label, optional badge
- `IllustrationGraphic` -- Calendar illustration component

**Data Requirements**:
- Google OAuth client ID from environment config (already referenced in calendarStore)
- Demo calendar dataset (already implemented via loadDemoData)

---

### 2.5 Onboarding: Connect Bank

**Current State**: `/workspace/app/app/onboarding/connect-bank.tsx` (238 lines)
- Shows wallet icon, title "Connect Your Bank", subtitle
- Security badges (Bank-level encryption, Read-only access)
- "Connect Your Bank" primary button, "Use Demo Data" secondary button, "Skip for now" outline button
- Connected success state showing transaction count, recurring count, account count
- Progress dots (dot 3 active)

**Target State** (MVP.md Screen 3):
- Shield/lock illustration (animated lock closing, Lottie)
- Header: "Link Your Accounts" (not "Connect Your Bank")
- Plaid Link button (opens Plaid Link modal via `react-native-plaid-link-sdk`)
- Supported banks row: horizontal scroll of bank logos (RBC highlighted with teal border and "Featured" badge, TD, Scotiabank, BMO, CIBC, Chase)
- Three security badges: "Bank-level 256-bit encryption", "Read-only access", "Your data stays private" (currently has 2 of 3)
- "Use Sandbox Data" card for testing

**Changes Needed**:
- Update title text from "Connect Your Bank" to "Link Your Accounts"
- Replace wallet icon with shield/lock animated illustration
- Add supported banks row with horizontal scroll of bank logos, RBC highlighted
- Add third security badge: "Your data stays private"
- Update "Use Demo Data" label to "Use Sandbox Data"
- Integrate `react-native-plaid-link-sdk` for production Plaid Link modal (currently simulated with Alert)

**New Components**:
- `SupportedBanksRow` -- Horizontal scroll of bank logos with featured highlight
- `SecurityBadge` -- Row of trust badges with icons

**Data Requirements**:
- Plaid Link token (from server-side Edge Function)
- Bank logo assets

---

### 2.6 Onboarding: Set Budget

**Current State**: `/workspace/app/app/onboarding/set-budget.tsx` (168 lines)
- Shows pie-chart icon, title "Set Your Budget", subtitle
- Budget display: `$` + amount + `/month`
- Preset chips: $500, $1000, $1500, $2000, $3000, $5000
- Progress dots (dot 4 active), "Looks Good!" button

**Target State** (MVP.md Screen 4):
- Large numeric input field (48px font, editable) with "$" prefix
- Animated donut/pie chart preview showing suggested category breakdown, updating in real-time
- Category slider list: each category has icon, name, slider ($0 to budget max), dollar amount, percentage
- "Use Suggested Split" button that auto-fills sliders with recommended ratios (30% dining, 15% transport, etc.)
- "Looks Good!" button with confetti animation on tap
- Budget validation: category total must not exceed total budget

**Changes Needed**:
- Replace preset chips with an editable numeric input field (48px font, center-aligned)
- Add animated donut chart preview (Victory Native or react-native-svg) showing category breakdown
- Add scrollable category slider list with per-category budget sliders
- Add "Use Suggested Split" button with recommended ratios
- Add confetti animation on "Looks Good!" button tap
- Add budget validation (category total vs total budget warning)
- Significant UI overhaul -- this screen needs the most work among onboarding screens

**New Components**:
- `BudgetInput` -- Large editable numeric input with dollar prefix
- `PieChartPreview` -- Animated donut chart updating in real-time
- `CategorySliderList` -- Scrollable list of category rows with sliders
- `ConfettiAnimation` -- Full-screen confetti burst

**Data Requirements**:
- User income (if provided during sign-up) for suggested budget
- Transaction history (if bank connected) for realistic category suggestions
- Default category list with suggested ratios
- Budget store: `fetchBudgets`, `createBudgets` per category

---

### 2.7 Dashboard (Metrics Hub)

**Current State**: `/workspace/app/app/(tabs)/dashboard.tsx` (431 lines)
- Header with "Dashboard" title and profile avatar (via Header component)
- Hero Budget Card: "Monthly Budget" label, "$X left" amount, "of $Y budget" subtitle, linear progress bar (actual + predicted), legend, day progress
- Category Budgets: horizontal scroll of category circles with border-based progress (not SVG circular gauge), icon, name, percentage
- Metrics section: 2 metric cards (Burn Rate, Health Score) in a row
- Recent Transactions: list of last 5 transactions with icon, merchant, date, amount
- FloatingChatButton at bottom

**Target State** (MVP.md Screen 5):
- Top bar: "FutureSpend" title (not "Dashboard"), NotificationBell with unread count badge, ProfileAvatar
- Hero Budget Summary Card: "$X left" in large text (32px, color-coded by health), "of $Y budget" subtitle, SpendingTrajectoryChart (Victory Native line chart with actual solid line, budget dashed line, prediction dashed line, shaded confidence interval), BurnRateIndicator text
- Category Budget Circles: circular SVG progress indicators (64px), category icon center, progress ring color-coded, "$X left" or "$X over" label, tap to Budget Detail
- Financial Health Score Ring: large SVG circular gauge (120px), score 0-100, color gradient ring, letter grade center, tap to Insights
- Key Metric Cards: row of 3 cards -- Spending Velocity, Savings Rate, CCI (Calendar Correlation Index)
- NO Recent Transactions section (moved to Plan tab)
- NO "Metrics" section label (metrics integrated naturally)

**Changes Needed**:
- Change header title from "Dashboard" to "FutureSpend"
- Add NotificationBell component to header with unread count badge
- Replace linear progress bar with SpendingTrajectoryChart (Victory Native line chart showing actual spending curve, budget limit line, predicted trajectory, confidence interval)
- Replace border-based category circles with SVG circular progress indicators (64px, `react-native-svg`)
- Add "$X left" or "$X over" label below each category circle
- Add large Financial Health Score Ring component (120px SVG gauge with color gradient)
- Replace 2 metric cards with 3 metric cards: Spending Velocity, Savings Rate, CCI
- Remove Recent Transactions section entirely (moved to Plan tab)
- Remove "Category Budgets" and "Metrics" section title labels

**New Components**:
- `SpendingTrajectoryChart` -- Victory Native line chart with dual lines and confidence interval
- `ProgressRing` -- SVG circular progress (64px) for categories (replacing CSS border trick)
- `HealthScoreRing` -- Large SVG gauge (120px) with gradient ring and grade center
- `MetricCard` (enhanced) -- With trend arrow indicator
- `NotificationBell` -- Bell icon with red badge

**Data Requirements**:
- All current data requirements remain
- Add: CCI (Calendar Correlation Index) score computation
- Add: Savings rate computation (income - spending / income)
- Add: Notification unread count from notificationStore
- Add: Daily spending data points for trajectory chart
- Add: Prediction data points for future trajectory

---

### 2.8 Calendar View

**Current State**: `/workspace/app/app/(tabs)/calendar.tsx` (1124 lines)
- Header with "Calendar" title and profile avatar
- Month/Week toggle (pill-shaped segmented control)
- Month view: calendar grid with spending heatmap coloring (green/yellow/red tint), event dots, prediction "$" badge, today/selected highlighting
- Week view: list of days with events showing time, title, predicted amount
- Day detail modal (slide-up, 80% height): date header, today badge, event cards with category icon, time, location, prediction section (amount, range, confidence badge, explanation)
- Quick summary below calendar for selected day events
- Loading state and predicting banner
- FloatingChatButton

**Target State** (MVP.md Screen 6):
- View toggle: "Month" | "Week" (pill-shaped, teal active) -- matches current
- Calendar grid (month view): day cells with spending intensity gradient background (transparent to deeper teal shades), past days solid teal tint, future days dashed border + transparent predicted tint, today with teal ring + shadow, event dot indicators (up to 3, colored by category), crystal ball micro-icon for prediction days
- Week view: horizontal day columns with vertical time rows (7am-11pm), event blocks positioned by time/duration, color-coded by category
- Day Detail Bottom Sheet (draggable, snap at 40% and 85% height): DayHeader with day-of-week spending comparison badge, DayTotalCard (total actual/predicted spend + comparison to typical same-day average), EventList with time, title, location, predicted spend + confidence badge + category tag + chevron to expand, past events show prediction accuracy
- Long press on future day for quick-add manual event

**Changes Needed**:
- Replace spending heatmap colors from fixed thresholds to gradient teal intensity scale ($0=transparent, $10=faint, $50=medium, $100+=full)
- Add dashed border treatment for future days (currently no dashed border)
- Add shadow/elevation to today cell
- Replace event dot with up to 3 dots colored by category (currently single dot)
- Add crystal ball micro-icon for prediction days (currently uses "$" badge)
- Replace week view list layout with proper time-slot grid layout (vertical time rows 7am-11pm, event blocks positioned by time/duration)
- Convert day detail from Modal to a draggable bottom sheet with snap points (40% and 85%)
- Add DayTotalCard with total spend and comparison to typical same-day-of-week average
- Add prediction accuracy display for past events ("Predicted $25, Actual $22 -- 88% accurate")
- Add category tag pills to event cards
- Add chevron/expand functionality on event cards
- Add long-press gesture on future days for quick-add

**New Components**:
- `DayDetailSheet` -- Draggable bottom sheet with snap points (replacing Modal)
- `DayTotalCard` -- Total spend card with day-of-week comparison
- `WeekTimeline` -- Time-slot grid layout replacing list layout
- `PredictionAccuracyBadge` -- Shows predicted vs actual for past events

**Data Requirements**:
- Historical daily spending averages by day of week (for comparison metrics)
- Spending intensity thresholds for heatmap coloring
- Category colors for multi-dot indicators
- Transaction data mapped to dates for past event accuracy

---

### 2.9 Budget Detail View

**Current State**: `/workspace/app/app/budget-detail.tsx` (338 lines)
- Custom header with back button, category name + "Budget"
- Progress card: category icon (56px circle), "$X / $Y" amount, linear progress bar (color-coded), "$X remaining" or "$X over budget" text
- Stats row: Burn Rate, Daily Avg, Projected (3 metric cards)
- Monthly Trend: bar chart with 6 hardcoded months (Oct-Mar), current month highlighted
- Transactions list: merchant name, date, amount, limited to 10 items

**Target State** (MVP.md Screen 7):
- Category header: back button, large category icon (40px), category name (24px bold), "Budget: $X/month" subtitle
- Progress section: full-width rounded progress bar (12px height), color-coded fill, "$X spent of $Y" above, percentage right-aligned, animated fill on load, "$Z remaining" or "$Z over budget" below
- Key Metrics Row: 3 cards -- Avg/Transaction, Frequency (transactions/week), MoM Change (month-over-month %)
- Spending Trend Chart: Victory Native line chart showing last 6 months, budget limit horizontal dashed line, current month partially filled with prediction extension
- Transaction List: section header with count badge and sort toggle (Date/Amount), transaction rows with merchant, date, amount, linked calendar event indicator, scrollable with pull-to-load-more (paginated, 20 per page)
- "Adjust Budget" FAB: circular teal button with pencil icon, bottom-right, opens budget adjustment modal with slider

**Changes Needed**:
- Change stats row metrics from (Burn Rate, Daily Avg, Projected) to (Avg/Transaction, Frequency, MoM Change)
- Replace bar chart with Victory Native line chart showing 6-month trend with budget limit dashed line
- Add animated fill on progress bar load
- Add sort toggle (Date/Amount) to transaction list header
- Add linked calendar event indicator (small calendar icon) to transaction rows
- Add pagination (pull to load more, 20 per page) to transaction list
- Add "Adjust Budget" FAB (circular teal button, pencil icon) with slider modal
- Remove hardcoded month data and use real historical data

**New Components**:
- `AdjustBudgetFAB` -- Floating action button with budget slider modal
- `TrendLineChart` -- Victory Native line chart for 6-month trend
- `SortToggle` -- Date/Amount sort toggle for transaction list

**Data Requirements**:
- Average transaction amount per category
- Transaction frequency (per week) per category
- Month-over-month spending delta per category
- 6 months of historical category spending data (currently hardcoded)
- Linked calendar events for transactions
- Paginated transaction data

---

### 2.10 Transaction Review

**Current State**: `/workspace/app/app/transaction-review.tsx` (668 lines)
- Custom header with back button, "Review Transactions" title
- Progress bar showing reviewed/total count
- Transaction cards: icon, merchant (large), date, amount (red), category badge (tappable), recurring badge
- Action buttons row: "Looks Good" (primary), "Category", "Recurring", "Exclude"
- Category picker modal (slide-up): scrollable list of 14 categories with icons
- Empty state: "All caught up!" with checkmark
- Loading state

**Target State** (MVP.md Screen 8):
- Transaction card: merchant name (24px bold), amount (40px bold), full date/time, category tag pill, account source ("Chase Checking ****7735" with bank icon)
- Actions row (4 buttons): Exclude (X icon), Split (scissors icon -- divide amount across categories/people), Recurring (repeat icon with frequency picker), Review (checkmark)
- Category Override: category picker with scrollable grid
- Notes field: text input with "Add a note..." placeholder
- Calendar Event Link: if matched, show event title/date/location and prediction accuracy; if not matched, "Link to Event" button
- Swipe gestures: swipe left to mark reviewed (green flash), swipe right to flag for later (yellow flash)

**Changes Needed**:
- Increase merchant name font to 24px and amount font to 40px
- Add account source line ("Chase Checking ****7735" with bank icon)
- Add "Split" action button (scissors icon) that opens split transaction modal
- Add notes text input field below category section
- Add Calendar Event Link section: show linked event with prediction accuracy or "Link to Event" search button
- Add swipe gestures: left to review (green flash), right to flag (yellow flash)
- Rename "Looks Good" to "Review" with checkmark icon

**New Components**:
- `SplitTransactionModal` -- Modal to divide amount across categories or people
- `NotesInput` -- Text input for transaction notes
- `LinkedEventCard` -- Shows matched calendar event with prediction accuracy
- `SwipeableRow` -- Swipe gesture handler with color flash feedback

**Data Requirements**:
- Account metadata (bank name, last 4 digits) from Plaid connection
- Linked calendar event data (if transaction is matched to an event)
- Prediction data for linked events (predicted vs actual amount)
- Notes field in transaction model

---

### 2.11 Plan Screen

**Current State**: `/workspace/app/app/(tabs)/plan.tsx` (886 lines)
- Header with "Plan" title and profile avatar
- Upcoming Predictions section: summary card (total predicted spend, event count), prediction cards with icon, event title, date, amount, confidence bar + label
- Scan a Receipt section: Camera/Gallery buttons, parsed receipt display with save
- Savings Rules section: monthly goal display, "Round up transactions" toggle, "Save the difference" toggle
- Recurring Expenses section: summary card (est. monthly recurring), recurring expense cards with icon, merchant, frequency, next date, amount
- Transaction Review section: "Review Transactions" card linking to transaction-review screen
- FloatingChatButton

**Target State** (MVP.md Screen 9):
- Top bar: "Plan" title, NotificationBell with badge, ProfileAvatar
- Upcoming Spending Predictions: section header with "See All" link, 3 prediction cards (event title, time/date, predicted amount, confidence badge with color, calendar icon)
- Budget Planning Tools: category budget adjustment cards with slider, spent/remaining progress bar, AI-suggested adjustment hint; "Set Savings Goal" button; Goal progress card
- Smart Savings Rules: "Save the Difference" toggle with settings (rounding rules, minimum save, destination account); configurable rules cards (round up, save on low-spend days, auto-save % on payday)
- Upcoming Recurring Expenses: horizontal scroll of RecurringChip items (service logo, name, amount, "in X days" countdown, border color by proximity)
- Transaction Review Queue: latest unreviewed transaction card with "Mark as Reviewed" button; "All caught up!" state

**Changes Needed**:
- Add NotificationBell to header
- Add "See All" link to Upcoming Predictions section header
- Add Budget Planning Tools section: per-category adjustment cards with sliders, AI suggestion hints, "Set Savings Goal" button, goal progress card
- Enhance Smart Savings Rules: add rounding amount config, minimum save amount, destination account selector, additional rule types (save on low-spend days, auto-save % on payday)
- Replace vertical recurring expense cards with horizontal scroll of compact RecurringChip items showing days-until-charge countdown
- Enhance Transaction Review section: show latest unreviewed transaction inline with "Mark as Reviewed" button (currently just links to separate screen)
- Remove "Scan a Receipt" section (not in MVP.md spec for Plan screen -- receipt scanning is a separate concern)

**New Components**:
- `BudgetAdjustmentCard` -- Category budget card with slider + AI hint
- `SetSavingsGoalModal` -- Goal creation flow (target amount, date, monthly contribution)
- `GoalProgressCard` -- Goal progress bar with projected completion
- `RecurringChip` -- Compact horizontal chip for recurring expense
- `InlineReviewCard` -- Inline transaction review with "Mark as Reviewed"

**Data Requirements**:
- Budget adjustment history
- Savings goals and progress
- Smart savings rule configurations (more than current round-up and save-difference)
- Recurring transaction schedule with days-until-charge calculation
- AI-generated budget adjustment suggestions (from Claude)

---

### 2.12 Arena (Gamification & Social Hub)

**Current State**: `/workspace/app/app/(tabs)/arena.tsx` (411 lines)
- Header with "Arena" title and profile avatar
- 4-tab internal navigation: "My Progress", "Challenges", "Leaderboard", "Friends"
- My Progress tab: level card (level, XP, XP bar, XP remaining), streak card (flame icon, streak count, best streak, check-in button), badges section (grid of earned/locked badges)
- Challenges tab: active challenges list, browse challenges catalog with join button
- Leaderboard tab: ranked list with rank, avatar, name, level, XP
- Friends tab: friend code display, add friend input, pending requests with accept button, friends list, circles list

**Target State** (MVP.md Screen 10):
- Top bar: "Arena" title, NotificationBell, ProfileAvatar
- Internal tabs: "My Progress" | "Challenges" | "Leaderboard" | "Friends & Circles"
- My Progress: Level header card with level title (e.g., "Money Manager"), XP progress bar + "X XP to next level"; Stats row (3 cards: Streak/Total XP/Badges count); Multiple streak types (daily, weekly budget, savings) with flame animation growing by streak length; Badge grid (4-column) with earned (colorful + glow) and locked (silhouette + lock) badges, tap for detail modal; Floating CheckIn button (pulsing, conditional)
- Challenges tab: Active challenges with progress bar, days remaining, participant mini avatar stack, XP reward; Browse catalog grouped by type (solo/circle/global) with difficulty level
- Leaderboard tab: Scope selector (Friends | Inner Circle | Global), circle dropdown, metric selector (Savings Rate | Streak | Health Score | Challenge Wins), period toggle (This Week | This Month); Podium display (3 pedestals with crown/medal icons, animated entrance); Ranked list (positions 4+) with trend arrows; Sticky "Your Position" card at bottom
- Friends & Circles tab: Friend code in large monospace + copy + share + QR code; Add friend input + scan QR; Friends list with avatar, name, streak badge, last active, nudge button; Pending requests; Circles with member count, mini avatar stack, type badge, tap for circle detail; Circle detail screen with mini leaderboard and "Start Challenge" button; Discover Friends button

**Changes Needed**:
- Add NotificationBell to header
- Rename "Friends" tab to "Friends & Circles"
- My Progress tab:
  - Add level title (e.g., "Money Manager") based on level
  - Add Stats Row (3 metric cards: Streak, Total XP, Badges count) -- currently missing
  - Add multiple streak types (weekly budget, savings) -- currently only daily check-in
  - Add flame animation that grows with streak length (small <7, medium 7-30, large 30+)
  - Add glow animation on earned badges
  - Add badge detail modal (icon, name, description, date earned, XP reward, rarity %)
  - Make CheckIn button floating and pulsing (currently inline)
- Challenges tab:
  - Add progress bar, days remaining badge, participant mini avatar stack to challenge cards
  - Add difficulty level to challenge catalog
  - Group browse challenges by type (solo/circle/global)
- Leaderboard tab:
  - Replace simple ranked list with Podium display (top 3 with pedestals, crown/medal icons)
  - Add scope selector (Friends | Inner Circle | Global) with sub-tabs
  - Add circle dropdown (visible on Inner Circle tab)
  - Add metric selector (Savings Rate | Streak | Health Score | Challenge Wins)
  - Add period toggle (This Week | This Month)
  - Add trend arrows to ranked list entries
  - Add sticky "Your Position" card at bottom of screen
- Friends & Circles tab:
  - Add QR code display + scan QR button
  - Add share button (native share sheet)
  - Add streak badge and last active timestamp to friend rows
  - Add nudge button on each friend row
  - Add circle type badge and mini avatar stack to circle cards
  - Add circle detail screen with mini leaderboard and "Start Challenge"
  - Add "Discover Friends" button with contacts sync

**New Components**:
- `LevelTitle` -- Title based on level (from level titles mapping)
- `StatsRow` -- 3 metric cards (Streak, Total XP, Badges)
- `FlameAnimation` -- Lottie flame that grows with streak length
- `BadgeDetailModal` -- Detail modal for badge info
- `PodiumDisplay` -- Top-3 pedestals with crown/medal icons
- `LeaderboardScopeSelector` -- Friends/Inner Circle/Global tabs
- `MetricSelector` -- Dropdown for metric selection
- `PeriodToggle` -- This Week/This Month pill toggle
- `YourRankCard` -- Sticky bottom card showing user's position
- `QRCodeDisplay` -- QR code for friend code
- `ScanQRButton` -- Camera QR scanner
- `NudgeButton` -- Send encouragement to friend
- `CircleDetail` -- Full circle detail screen
- `DiscoverFriendsButton` -- Contacts sync, share link, username search

**Data Requirements**:
- Level titles mapping (level -> title name)
- Multiple streak types (daily, weekly_budget, savings)
- Badge detail info (description, date earned, XP reward, rarity %)
- Leaderboard data for multiple scopes, metrics, and periods
- User's rank and trend data
- QR code generation from friend code
- Friend last-active timestamps
- Nudge rate limiting (3/friend/day)
- Circle type metadata

---

### 2.13 Insights Screen (cross-ref Section 1)

> **See Section 1 for detailed metrics, calculations, and AI-generated insight specifications.** This sub-section covers screen-level UI changes only.

**Current State**: `/workspace/app/app/(tabs)/insights.tsx` (354 lines)
- Header with "Insights" title and profile avatar
- Financial Health Score: score card with label, score ring (100x100, border-based circle, letter grade center), score value
- Score Breakdown: 4 rows (Burn Rate, Budget Adherence, Consistency, Savings Rate) with progress bars and score/max labels
- Weekly Spending Trend: simple bar chart (6 weeks) with amounts and week labels
- Category Breakdown: horizontal bar chart rows with category icon, name, bar, amount, percentage
- AI Recommendations: insight cards with bulb icon and text
- Savings Projection: savings label, 4 projection items (1/3/6/12 months) with amounts

**Target State** (MVP.md Screen 12):
- Top bar: "Insights" title, NotificationBell, ProfileAvatar
- Financial Health Score Card (hero): large SVG circular gauge (140px), color gradient ring (red 0-40, yellow 40-70, green 70-100), score number center (48px bold), "Financial Health Score" label, 4 breakdown rows (Budget Adherence, Savings Consistency, Spending Predictability, Debt Management) with progress bars + scores, trend indicator ("Up 5 pts from last month")
- Spending Trend Charts: period toggle (Weekly | Monthly | 6-Month), Victory Native line chart with actual solid teal line, budget limit gray dashed line, shaded over/under areas, tappable data points
- Category Breakdown: animated donut chart with color-coded segments, center text shows total, tap segment to highlight; category legend below with color swatch, name, amount, percentage
- AI-Generated Insights & Recommendations: insight cards with icon, title (14px bold), body (12px), action button ("Adjust Budget", "Set Alert", "View Details"); actionable recommendation cards with specific dollar amounts and projected impact ("Cancel unused Adobe CC -- save $54.99/month ($660/year)"), "Apply" and "Dismiss" buttons
- Calendar Correlation Index (CCI) Visualization: CCI score card with scatter plot or paired bar chart (predicted vs actual), highlight most/least accurate days
- Savings Projections: compound growth area chart with optimistic/baseline/conservative scenarios, goal milestones marked on timeline
- Spending Comparison: side-by-side this month vs last month, total spending change %, per-category comparison bars, "Best improvement" and "Needs attention" highlights

**Changes Needed**:
- Add NotificationBell to header
- Replace border-based score ring with SVG circular gauge (140px) with color gradient
- Increase score number font to 48px
- Change breakdown rows from (Burn Rate, Budget Adherence, Consistency, Savings Rate) to (Budget Adherence, Savings Consistency, Spending Predictability, Debt Management)
- Add trend indicator ("Up X pts from last month") to health score card
- Replace simple bar chart with Victory Native line chart with period toggle (Weekly/Monthly/6-Month)
- Replace horizontal bar chart category breakdown with animated donut chart + legend list
- Enhance AI Recommendations: add action buttons ("Adjust Budget", "Set Alert", "View Details", "Apply", "Dismiss"), add specific dollar amounts and projected impact to recommendations
- Add Calendar Correlation Index (CCI) section with score card and visualization (scatter plot or paired bar chart)
- Replace simple savings projection list with compound growth area chart with multiple scenarios and goal markers
- Add Month-over-Month comparison section with change %, per-category bars, best/worst highlights

**New Components**:
- `HealthScoreGauge` -- Large SVG circular gauge (140px) with gradient ring
- `SpendingTrendChart` -- Victory Native line chart with period toggle
- `CategoryDonut` -- Animated donut chart with interactive segments
- `AIInsightCard` -- Enhanced card with action buttons
- `AIRecommendationCard` -- Actionable card with Apply/Dismiss buttons
- `CCIVisualization` -- CCI score card with scatter/bar chart
- `SavingsGrowthChart` -- Compound growth area chart with scenarios
- `MonthComparison` -- Side-by-side month comparison card

**Data Requirements**:
- Spending Predictability score (new calculation)
- Debt Management score (new calculation, if applicable)
- Historical health score for trend indicator
- Period-based spending data (weekly, monthly, 6-month)
- Donut chart data (category amounts and colors)
- CCI calculation from prediction accuracy data
- Savings projection scenarios (optimistic/baseline/conservative)
- Month-over-month comparison metrics (total change, per-category)
- AI recommendation data from Claude with dollar amounts and impact projections

---

### 2.14 Settings & Profile

**Current State**: `/workspace/app/app/settings.tsx` (538 lines)
- Custom header with close button (X), "Settings" title
- Profile section: avatar (72px, person icon, accent border), editable display name (with pencil icon), email, friend code (with copy-to-clipboard)
- Connected Accounts: Google Calendar and Bank Account rows with connection status, chevron for management
- Notifications section: "View All" link to notifications screen, 5 toggle rows (Spending Alerts, Budget Warnings, Social Nudges, Challenge Updates, Streak Reminders)
- Privacy section: visibility selector (Public/Friends Only/Private), share spending toggle, anonymous leaderboard toggle
- Sign Out button (outline, danger border color)

**Target State** (MVP.md Screen 13):
- Profile header: large avatar (80px) with camera overlay icon (tap to change photo), display name (20px bold), email, "Edit Profile" button
- Connected Accounts: Calendar row (sync status + last sync timestamp + re-sync/disconnect), Bank row (bank name + last 4 digits + status + last sync + "Manage" chevron), "+ Add Account" button
- Budget Settings: row with budget icon, "Budget Settings" label, current total budget preview, chevron to budget editor
- Notification Preferences: toggle rows for Spending Predictions, Budget Alerts, Streak Reminders, Social Updates, Weekly Reports, Transaction Alerts (6 categories vs current 5)
- Privacy Settings: toggle rows for Show on Leaderboards, Share Streak Data, Savings Rate Visible, Activity Status; Data Export button
- App Preferences: Theme selector (Dark/Light/System), Currency selector, Timezone selector
- About Section: app version, Terms of Service, Privacy Policy, Open Source Licenses
- Delete Account button (red text, multi-step confirmation with "DELETE" typing)

**Changes Needed**:
- Increase avatar size from 72px to 80px
- Add camera overlay icon on avatar for photo change
- Add "Edit Profile" button (modal for name, avatar, email changes)
- Add last sync timestamps to calendar and bank connection rows
- Add "+ Add Account" button for additional calendar/bank connections
- Add Budget Settings row linking to budget editor
- Add "Weekly Reports" and "Transaction Alerts" notification toggles (2 new categories)
- Replace current privacy toggles with spec toggles: Show on Leaderboards, Share Streak Data, Savings Rate Visible, Activity Status
- Add "Export My Data" button (JSON/CSV download)
- Add App Preferences section: Theme selector (Dark/Light/System), Currency selector, Timezone selector
- Add About section: app version, Terms/Privacy links, Open Source Licenses
- Add "Delete Account" button with multi-step confirmation (type "DELETE" to confirm)

**New Components**:
- `AvatarPicker` -- Avatar with camera overlay, opens image picker
- `EditProfileModal` -- Modal for editing name, email, avatar
- `ThemeSelector` -- Dark/Light/System option selector
- `CurrencySelector` -- Currency picker
- `TimezoneSelector` -- Timezone picker with auto-detection
- `DataExportButton` -- Generate and download user data
- `DeleteAccountConfirmation` -- Multi-step deletion flow with text confirmation

**Data Requirements**:
- Last sync timestamps for calendar and bank connections
- Current budget total for preview
- App version from app.json
- Theme preference persistence
- Currency and timezone settings
- Data export generation capability

---

### 2.15 Floating AI Chat (Global Overlay)

**Current State**:

`FloatingChatButton` (`/workspace/app/src/components/FloatingChatButton.tsx`, 46 lines):
- Circular teal button (56px), chat bubble icon, positioned bottom-right (bottom: 90, right: 20)
- Conditionally renders based on `isOpen` state from chatStore
- Renders `ChatSheet` component
- Drop shadow with accent color

`ChatSheet` (`/workspace/app/src/components/ChatSheet.tsx`, 561 lines):
- Slide-up bottom sheet (70% screen height) with spring animation
- Drag handle + swipe-to-dismiss via PanResponder
- Header: sparkles icon, "AI Assistant" title, close button
- Message list: user bubbles (teal, right-aligned), assistant bubbles (card color, left-aligned), with timestamps
- Typing indicator: 3 animated pulsing dots
- Context-aware suggested chips (per-screen: dashboard, calendar, plan, arena, insights)
- Input bar: rounded text input, circular send button
- KeyboardAvoidingView support

**Target State** (MVP.md Global Overlay section):
- Floating button: same 56px teal circle with chat icon, positioned 16px from right, 90px from bottom
- Pulse/glow animation when AI has proactive insights (budget alert, spending anomaly)
- Button dismissible by swiping to edge (snaps to half-visible state)
- Bottom sheet: ~80% screen height (currently 70%)
- Header: AI avatar (crystal ball icon, 32px) + "AI Assistant" title + "Powered by Claude" subtitle (12px) + close button
- Context-aware chips change per screen (already implemented)
- Message list: supports markdown rendering (bold, lists, code blocks), supports inline charts/cards for financial data
- Inline financial data cards in AI responses that navigate to relevant screens on tap
- Chat session stored in Supabase for cross-session persistence

**Changes Needed**:
- Add pulse/glow animation on FloatingChatButton when proactive insights are available
- Add swipe-to-edge dismiss behavior on FloatingChatButton (snap to half-visible state, tap to restore)
- Increase sheet height from 70% to 80% of screen
- Replace sparkles icon with crystal ball AI avatar (32px)
- Add "Powered by Claude" subtitle below "AI Assistant"
- Add markdown rendering support in assistant message bubbles
- Add inline chart/card rendering capability in AI responses
- Add tap-to-navigate on financial data cards within AI responses
- Add cross-session chat persistence via Supabase `chat_messages` table

**New Components**:
- `PulseAnimation` -- Teal glow pulse on the FAB
- `MarkdownBubble` -- Markdown-capable message bubble (bold, lists, code blocks)
- `InlineFinancialCard` -- Embeddable financial data card in chat messages
- `SwipeToEdge` -- Gesture handler for FAB dismissal

**Data Requirements**:
- Proactive insight flags (from prediction/budget system to trigger pulse)
- Cross-session chat history (Supabase `chat_messages` table)
- Screen-specific financial context for Claude API calls (budget status, recent transactions, predictions, calendar events)

---

### 2.16 Navigation Changes

**Current State**: `/workspace/app/app/(tabs)/_layout.tsx` (67 lines)
- 5 bottom tabs: Dashboard, Calendar, Plan, Arena, Insights
- Tab icons (Ionicons): grid, calendar, navigate-circle, trophy, bulb
- Active: teal color (`Colors.tabActive`), inactive: gray (`Colors.tabInactive`)
- Tab bar: dark background (`Colors.tabBarBackground`), border top, 80px height, 20px bottom padding, 8px top padding
- Label style: xs font size, medium weight
- All tab screens have `headerShown: false`

Additional navigation routes (stack screens):
- `/settings` -- Settings/Profile screen
- `/budget-detail` -- Budget Detail screen (with `category` query param)
- `/transaction-review` -- Transaction Review screen
- `/notifications` -- Notifications screen
- `/onboarding/welcome` -- Welcome screen
- `/onboarding/connect-calendar` -- Connect Calendar
- `/onboarding/connect-bank` -- Connect Bank
- `/onboarding/set-budget` -- Set Budget

**Target State** (MVP.md):
- 5 bottom tabs: Dashboard, Calendar, Plan, Arena, Insights -- matches current
- Tab icons: grid, calendar, target/crosshair, trophy, lightbulb/chart -- Plan icon differs
- Same active/inactive color scheme
- Profile avatar in header on ALL tab screens provides navigation to Settings -- currently implemented via Header component
- NotificationBell in header on all tab screens for notification access -- not yet implemented
- Deep links from notifications to relevant screens

**Changes Needed**:
- Change Plan tab icon from `navigate-circle` to `target` or `crosshair` (MVP spec says "target/crosshair icon")
- Add NotificationBell to the shared Header component (currently Header only has title + profile avatar)
- Add deep link support for notifications (each notification navigates to relevant screen)
- Add circle detail screen route (for Arena circles)
- Add challenge detail screen route (for Arena challenges)
- Add badge collection full-screen route (for Arena "View All" badges)
- Add goal detail screen route (for Plan savings goals)
- Consider adding auth flow routes if not already handled (login, signup)

**New Routes to Add**:
| Route | Purpose |
|-------|---------|
| `/arena/circle-detail` | Circle detail with mini leaderboard |
| `/arena/challenge-detail` | Challenge detail with progress and leaderboard |
| `/arena/badges` | Full badge collection screen |
| `/plan/savings-goal` | Savings goal detail/editor |
| `/plan/budget-editor` | Full budget editor (same as onboarding Set Budget but editable) |

---

*End of Section 2*
