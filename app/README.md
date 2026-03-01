# Spendy

Spendy is an AI-powered spending prediction app built with React Native and Expo. It connects to your calendars and uses upcoming events to forecast expenses before they happen.

## Receipt Scanning

Spendy can scan physical receipts using the device camera or photo library and automatically extract transaction details.

### How It Works

1. User captures a receipt photo (camera) or picks one from gallery via `expo-image-picker`
2. The image is sent as base64 to a Vision API for structured extraction
3. The API returns parsed JSON: merchant name, date, total, subtotal, tax, tip, line items, category, and payment method
4. User reviews the parsed data on the transaction review screen
5. Confirmed transactions are persisted to Supabase `transactions` table

### Architecture

```
Camera / Gallery (expo-image-picker)
        |
        v
  receiptService.ts
   ├── captureReceipt()              -> camera capture (base64)
   ├── pickReceiptFromGallery()      -> gallery picker (base64)
   ├── parseReceiptWithGemini()      -> Vision API extraction
   ├── parseReceiptMock()            -> offline fallback
   └── createTransactionFromReceipt() -> persist to Supabase
        |
        v
  transaction-review.tsx (user confirmation)
        |
        v
  Supabase: transactions
```

### Extracted Fields

| Field | Description |
|-------|-------------|
| `merchant_name` | Store or restaurant name |
| `date` | Transaction date (YYYY-MM-DD) |
| `total` | Final amount paid |
| `subtotal` | Pre-tax amount |
| `tax` | Tax amount |
| `tip` | Tip amount (if visible) |
| `currency` | Currency code (defaults to CAD) |
| `items` | Line items with name, quantity, price |
| `category` | Auto-classified spending category |
| `payment_method` | Card type if visible on receipt |

### Offline Fallback

When the Vision API is unavailable or quota is exceeded, Spendy falls back to a mock parser that returns realistic demo data so the scanning flow remains functional.

**Key file:** `src/services/receiptService.ts`

---

## Calendar Integration

Spendy supports three calendar providers plus manual ICS file import.

### Supported Providers

| Provider | Method | Status |
|----------|--------|--------|
| Apple Calendar | `expo-calendar` native API | Full implementation |
| Google Calendar | Google Calendar REST API v3 (OAuth) | Full implementation |
| Outlook / iCal | `.ics` file import + parsing | Full implementation |

### Architecture

```
connect-calendar.tsx (onboarding)
CalendarConnectCard.tsx (in-app reconnect)
        |
        v
  calendarStore.ts (Zustand)
        |
        v
  calendarService.ts
   ├── connectAppleCalendar()   -> expo-calendar native
   ├── syncGoogleCalendar()     -> Google Calendar API v3
   ├── parseICSFile()           -> .ics string parser
   └── loadDemoCalendarData()   -> bundled JSON fixtures
        |
        v
  Supabase: calendar_connections + calendar_events
```

### Apple Calendar

Uses `expo-calendar` to access the device's native calendar store.

**How it works:**
1. Requests calendar permission via `requestCalendarPermissionsAsync()`
2. Fetches all calendars of type `EVENT`
3. Pulls events for the next 90 days from each calendar
4. Maps native events to `CalendarEvent` objects with auto-detected spending categories
5. Upserts to Supabase `calendar_events` table (if configured)

**Requirements:**
- EAS build required for real device access (Expo Go falls back to demo data)
- `expo-calendar` plugin configured in `app.json`

**Key function:** `connectAppleCalendar()` in `src/services/calendarService.ts`

### Google Calendar

Uses the Google Calendar REST API v3 with OAuth Bearer token authentication.

**How it works:**
1. Requires a valid OAuth `accessToken` (obtained outside the calendar service)
2. Fetches primary calendar events for the next 90 days via `GET /calendars/primary/events`
3. Expands recurring events (`singleEvents=true`), ordered by start time, max 250 results
4. Maps Google event format (`summary`, `start.dateTime`, `attendees`, etc.) to `CalendarEvent`
5. Auto-detects spending category from event title
6. Upserts to Supabase `calendar_events` table (if configured)

**API endpoint:**
```
https://www.googleapis.com/calendar/v3/calendars/primary/events
  ?timeMin={now}&timeMax={+90d}&singleEvents=true&orderBy=startTime&maxResults=250
```

**Key function:** `syncGoogleCalendar()` in `src/services/calendarService.ts`

### Outlook / iCal (.ics Import)

Parses standard `.ics` (iCalendar) files using a built-in regex parser (no external library).

**How it works:**
1. User uploads or provides `.ics` file content
2. Splits content on `BEGIN:VEVENT` / `END:VEVENT` blocks
3. Extracts fields: `SUMMARY`, `DTSTART`, `DTEND`, `DESCRIPTION`, `LOCATION`, `UID`, `RRULE`
4. Handles timezone params (e.g., `DTSTART;TZID=America/Vancouver:20251201T093000`)
5. Supports both datetime (`20251201T093000Z`) and all-day (`20251201`) formats
6. Auto-detects spending category from event title
7. Inserts to Supabase `calendar_events` table (if configured)

**Supports:** Outlook exports, Apple Calendar exports, Google Calendar exports, any standard RFC 5545 `.ics` file.

**Key function:** `parseICSFile()` in `src/services/calendarService.ts`

### Category Auto-Detection

All providers share a keyword-based category detector that maps event titles to spending categories:

| Category | Example Keywords |
|----------|-----------------|
| dining | lunch, dinner, coffee, restaurant, starbucks |
| groceries | grocery, costco, walmart, market |
| transport | uber, lyft, flight, parking, gas |
| entertainment | movie, concert, party, gaming |
| shopping | shop, mall, amazon, buy |
| travel | trip, hotel, airbnb, vacation |
| health | doctor, dentist, pharmacy, therapy |
| education | class, lecture, exam, university |
| fitness | gym, workout, yoga, hike |
| social | hangout, meetup, birthday, date |
| professional | meeting, interview, conference |
| bills | rent, bill, insurance, subscription |
| personal | appointment, haircut, errand |

### Database Schema

**`calendar_connections`** - Stores provider credentials per user:
- `provider`: `'google' | 'apple' | 'outlook' | 'ical'`
- `access_token_encrypted`, `refresh_token_encrypted`
- `calendar_ids`: selected calendars array
- `is_active`: toggle sync on/off
- Row Level Security: users can only access their own connections

**`calendar_events`** - Normalized event storage:
- `external_id`: provider-specific event ID
- `calendar_connection_id`: FK to `calendar_connections`
- `title`, `description`, `location`, `start_time`, `end_time`
- `is_all_day`, `recurrence_rule`, `attendee_count`
- `category`: auto-detected spending category
- Indexed on `(user_id, start_time)` for fast date range queries
- Row Level Security: users can only access their own events
- Upsert conflict resolution on `(user_id, external_id, calendar_connection_id)`

### Demo Mode

For development and demo purposes, Spendy includes bundled calendar fixtures:
- `src/data/sarah_events.json` - Sarah persona events
- `src/data/marcus_events.json` - Marcus persona events

Demo data is time-shifted so events center around the current date (half past, half future), ensuring predictions always have relevant data.

## Tech Stack

- React Native + Expo 54
- Expo Router 6 (file-based routing)
- Zustand v5 (state management)
- Supabase (auth, database, RLS)
- react-native-reanimated v4 (animations)
- expo-calendar (native calendar access)
