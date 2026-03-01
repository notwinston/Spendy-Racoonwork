# FutureSpend — Data Ingestion Implementation Guide

> How to replace every simulated data source with real integrations.

---

## Table of Contents

1. [Transaction Ingestion via Plaid](#1-transaction-ingestion-via-plaid)
2. [Cross-Institution Tracking](#2-cross-institution-tracking)
3. [Calendar Integration](#3-calendar-integration)
4. [Camera Integration — Receipt Scanning](#4-camera-integration--receipt-scanning)
5. [Manual Calendar Entry with Price Prediction](#5-manual-calendar-entry-with-price-prediction)
6. [Architecture Summary](#6-architecture-summary)

---

## 1. Transaction Ingestion via Plaid

### Current State

`plaidService.ts` returns hardcoded "Demo Bank" data. There is no Plaid SDK, no token exchange, and `syncTransactions()` is a no-op that returns `[]`.

### What Plaid Actually Requires

Plaid does **not** allow direct client-side API calls. The flow is:

```
Mobile App  ──>  Your Backend Server  ──>  Plaid API
    │                    │
    │  (1) Link Token    │
    │  <─────────────────│
    │                    │
    │  (2) Plaid Link UI │
    │  (opens in-app)    │
    │                    │
    │  (3) Public Token  │
    │  ─────────────────>│
    │                    │
    │         (4) Exchange for Access Token
    │                    │──────────────────> Plaid
    │                    │<──────────────────
    │                    │
    │  (5) Transactions  │
    │  <─────────────────│──────────────────> Plaid /transactions/sync
```

### Implementation Steps

#### Step 1: Backend Server (Supabase Edge Function or standalone)

You need a server that holds your Plaid credentials. This cannot live in the mobile app.

**Option A: Supabase Edge Functions** (recommended for your stack)

Create three Edge Functions:

```
supabase/functions/
├── plaid-create-link-token/index.ts   # POST — creates a Link token
├── plaid-exchange-token/index.ts      # POST — exchanges public_token for access_token
└── plaid-sync-transactions/index.ts   # POST — fetches transactions for a connection
```

**Option B: Standalone Express/Fastify server** — same three endpoints, deployed to Railway/Fly/Render.

#### Step 2: Create Link Token

```typescript
// supabase/functions/plaid-create-link-token/index.ts
import { PlaidApi, Configuration, PlaidEnvironments, Products, CountryCode } from 'plaid';

const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[Deno.env.get('PLAID_ENV') ?? 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': Deno.env.get('PLAID_CLIENT_ID'),
      'PLAID-SECRET': Deno.env.get('PLAID_SECRET'),
    },
  },
}));

Deno.serve(async (req) => {
  const { userId } = await req.json();

  const response = await plaid.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'FutureSpend',
    products: [Products.Transactions],
    country_codes: [CountryCode.Ca],        // Canadian banks
    language: 'en',
    // For Canadian institutions (RBC, CIBC, TD, etc.):
    // Plaid covers them but some require OAuth redirect
    redirect_uri: 'https://your-app.com/plaid-oauth',
  });

  return Response.json({ link_token: response.data.link_token });
});
```

**Environment variables needed:**
- `PLAID_CLIENT_ID` — from Plaid dashboard
- `PLAID_SECRET` — sandbox, development, or production key
- `PLAID_ENV` — `sandbox`, `development`, or `production`

#### Step 3: Mobile App — Plaid Link

Install the React Native Plaid Link SDK:

```bash
npx expo install react-native-plaid-link-sdk
```

> **Important**: This is a native module. It will NOT work in Expo Go. You must use an EAS development build (`eas build --profile development`).

```typescript
// src/services/plaidService.ts (replace connectBank)
import { openLink, LinkSuccess } from 'react-native-plaid-link-sdk';

export async function connectBank(userId: string): Promise<{ connection: PlaidConnection; accounts: Account[] }> {
  // 1. Get link token from your backend
  const { link_token } = await fetch('YOUR_BACKEND/plaid-create-link-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  }).then(r => r.json());

  // 2. Open Plaid Link UI
  return new Promise((resolve, reject) => {
    openLink({
      tokenConfig: { token: link_token },
      onSuccess: async (success: LinkSuccess) => {
        // 3. Exchange public token via your backend
        const result = await fetch('YOUR_BACKEND/plaid-exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicToken: success.publicToken,
            institutionId: success.metadata.institution?.id,
            institutionName: success.metadata.institution?.name,
            accounts: success.metadata.accounts,
            userId,
          }),
        }).then(r => r.json());

        resolve(result);
      },
      onExit: (error) => {
        if (error) reject(error);
      },
    });
  });
}
```

#### Step 4: Exchange Token (Backend)

```typescript
// supabase/functions/plaid-exchange-token/index.ts
Deno.serve(async (req) => {
  const { publicToken, institutionId, institutionName, accounts, userId } = await req.json();

  // Exchange for permanent access token
  const exchangeResponse = await plaid.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const accessToken = exchangeResponse.data.access_token;
  const itemId = exchangeResponse.data.item_id;

  // Store encrypted access token in your database
  // CRITICAL: Never send the access_token to the client
  const { data: connection } = await supabase.from('plaid_connections').insert({
    user_id: userId,
    institution_id: institutionId,
    institution_name: institutionName,
    access_token_encrypted: encrypt(accessToken),  // Use your encryption method
    plaid_item_id: itemId,
    status: 'active',
  }).select().single();

  // Store accounts
  for (const acct of accounts) {
    await supabase.from('accounts').insert({
      user_id: userId,
      plaid_connection_id: connection.id,
      plaid_account_id: acct.id,
      name: acct.name,
      type: acct.type,
      subtype: acct.subtype,
      mask: acct.mask,
    });
  }

  return Response.json({ connection, accounts });
});
```

#### Step 5: Transaction Sync (Backend)

Plaid recommends the `/transactions/sync` endpoint (cursor-based, incremental):

```typescript
// supabase/functions/plaid-sync-transactions/index.ts
Deno.serve(async (req) => {
  const { connectionId } = await req.json();

  // Get the stored access token and cursor
  const { data: conn } = await supabase
    .from('plaid_connections')
    .select('access_token_encrypted, sync_cursor')
    .eq('id', connectionId)
    .single();

  const accessToken = decrypt(conn.access_token_encrypted);
  let cursor = conn.sync_cursor || '';
  let hasMore = true;
  const allAdded = [];
  const allModified = [];
  const allRemoved = [];

  while (hasMore) {
    const response = await plaid.transactionsSync({
      access_token: accessToken,
      cursor: cursor,
    });

    allAdded.push(...response.data.added);
    allModified.push(...response.data.modified);
    allRemoved.push(...response.data.removed);
    hasMore = response.data.has_more;
    cursor = response.data.next_cursor;
  }

  // Upsert transactions into your database
  for (const txn of allAdded) {
    await supabase.from('transactions').upsert({
      user_id: userId,
      plaid_transaction_id: txn.transaction_id,
      account_id: txn.account_id,
      amount: txn.amount,
      date: txn.date,
      merchant_name: txn.merchant_name || txn.name,
      category: mapPlaidCategory(txn.personal_finance_category),
      pending: txn.pending,
      // Plaid provides its own categorization
    }, { onConflict: 'plaid_transaction_id' });
  }

  // Save cursor for next sync
  await supabase.from('plaid_connections')
    .update({ sync_cursor: cursor, last_sync_at: new Date().toISOString() })
    .eq('id', connectionId);

  return Response.json({ added: allAdded.length, modified: allModified.length, removed: allRemoved.length });
});
```

#### Step 6: Ongoing Sync

Two approaches (use both):

1. **Plaid Webhooks** — Plaid sends `SYNC_UPDATES_AVAILABLE` to your backend when new transactions arrive. Set up a webhook endpoint that triggers the sync function.
2. **Pull on app open** — Call sync when the user opens the app or pulls to refresh on the dashboard.

### Canadian Bank Coverage

Plaid supports major Canadian institutions in production:

| Institution | Plaid Support | Notes |
|---|---|---|
| RBC Royal Bank | Yes | OAuth flow required |
| CIBC | Yes | OAuth flow required |
| TD Canada Trust | Yes | OAuth flow required |
| Scotiabank | Yes | OAuth flow required |
| BMO | Yes | OAuth flow required |
| Desjardins | Yes | OAuth flow required |
| National Bank | Yes | — |
| Tangerine | Yes | — |
| Simplii Financial | Yes | — |
| Wealthsimple | Yes | — |

> **Plaid pricing**: Sandbox is free. Production starts at $0.30/connection/month + $0.05/transaction call. There's a free tier for < 100 connections during development.

---

## 2. Cross-Institution Tracking

### The Problem

A user might have:
- RBC chequing (daily spending)
- CIBC Visa (credit card)
- TD savings account
- Wealthsimple TFSA

Each is a separate Plaid connection. You need to unify them into one financial picture.

### Implementation

#### Data Model (already in your schema)

```
plaid_connections (one per institution)
  └── accounts (one per card/account at that institution)
       └── transactions (all transactions across all accounts)
```

The key is `user_id` — all queries filter by user, not by institution.

#### Unified Dashboard Query

```typescript
// Already works with current schema — transactions table has user_id
const { data: allTransactions } = await supabase
  .from('transactions')
  .select('*, accounts!inner(name, type, plaid_connections!inner(institution_name))')
  .eq('user_id', userId)
  .order('date', { ascending: false });

// Group by institution for the "Connected Accounts" section
const byInstitution = allTransactions.reduce((acc, txn) => {
  const inst = txn.accounts.plaid_connections.institution_name;
  if (!acc[inst]) acc[inst] = [];
  acc[inst].push(txn);
  return acc;
}, {});
```

#### Account Aggregation View (new screen needed)

Build an "Accounts" screen showing:
- Total net worth (sum of all account balances)
- Per-institution breakdown with account cards
- Per-account balance, last synced time, and recent transactions
- Color-coded by account type (chequing = blue, credit = red, savings = green)

#### Duplicate Detection

When a user pays their CIBC Visa from their RBC chequing account, Plaid reports two transactions:
1. RBC: -$500 "CIBC VISA PAYMENT"
2. CIBC: +$500 "PAYMENT RECEIVED"

Handle this with transfer detection:

```typescript
function isTransfer(txn: PlaidTransaction): boolean {
  // Plaid's personal_finance_category includes TRANSFER_IN / TRANSFER_OUT
  return txn.personal_finance_category?.primary === 'TRANSFER';
}

// Filter out transfers from spending calculations
const spending = transactions.filter(t => !isTransfer(t) && t.amount > 0);
```

---

## 3. Calendar Integration

### Current State

`calendarService.ts` has real Google Calendar fetch code but it can't run because OAuth requires a native build. Apple and Outlook are Alert stubs.

### Google Calendar

#### Prerequisites
1. Google Cloud Console project with Calendar API enabled
2. OAuth 2.0 client ID (iOS + Android)
3. EAS build (not Expo Go)

#### Implementation

Install the Google Sign-In library:

```bash
npx expo install @react-native-google-signin/google-signin
```

Configure in `app.json`:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "infoPlist": {
        "CFBundleURLSchemes": ["com.googleusercontent.apps.YOUR_CLIENT_ID"]
      }
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "plugins": ["@react-native-google-signin/google-signin"]
  }
}
```

```typescript
// src/services/calendarService.ts — replace the Alert stubs
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

export async function connectGoogleCalendar(userId: string) {
  // 1. Sign in with Google
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const tokens = await GoogleSignin.getTokens();

  // 2. Store the connection
  await calendarStore.addConnection(userId, 'google', tokens.accessToken);

  // 3. Sync events (your existing syncGoogleCalendar function already works)
  await calendarStore.syncCalendar(userId, tokens.accessToken);

  return { success: true, eventCount: calendarStore.getState().events.length };
}

// Token refresh (Google tokens expire after 1 hour)
export async function refreshGoogleToken(): Promise<string> {
  const tokens = await GoogleSignin.getTokens();
  // getTokens() automatically refreshes if expired
  return tokens.accessToken;
}
```

Your existing `syncGoogleCalendar()` function in `calendarService.ts` already makes the right API calls — it just needs a valid OAuth token.

### Apple Calendar

Apple Calendar uses the device's local calendar database via `expo-calendar`. No OAuth needed — it uses iOS permission prompts.

```bash
npx expo install expo-calendar
```

```typescript
// src/services/appleCalendarService.ts
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export async function connectAppleCalendar(userId: string): Promise<CalendarEvent[]> {
  // 1. Request permission
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission denied');
  }

  // 2. Get all calendars
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // 3. Fetch events for the next 90 days
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);

  const allEvents: CalendarEvent[] = [];

  for (const cal of calendars) {
    const events = await Calendar.getEventsAsync(
      [cal.id],
      startDate,
      endDate,
    );

    for (const event of events) {
      allEvents.push({
        id: `apple-${event.id}`,
        user_id: userId,
        calendar_connection_id: `apple-${cal.id}`,
        external_id: event.id,
        title: event.title,
        description: event.notes ?? null,
        start_time: event.startDate,
        end_time: event.endDate,
        location: event.location ?? null,
        is_all_day: event.allDay,
        is_recurring: event.recurrenceRule != null,
        detected_category: detectCategory(event.title),
        source: 'apple',
        created_at: new Date().toISOString(),
      });
    }
  }

  return allEvents;
}
```

> **Note**: `expo-calendar` works in Expo Go on iOS for reading. For writing events, you need a development build.

### Microsoft Outlook / Office 365

Outlook uses Microsoft Graph API with OAuth 2.0.

```bash
npm install react-native-msal  # or use expo-auth-session
```

#### Option A: Using `expo-auth-session` (works in Expo Go for testing)

```typescript
// src/services/outlookCalendarService.ts
import * as AuthSession from 'expo-auth-session';
import { detectCategory } from './calendarService';

const TENANT_ID = 'common'; // multi-tenant
const CLIENT_ID = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID;

const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
};

export async function connectOutlookCalendar(userId: string): Promise<CalendarEvent[]> {
  // 1. OAuth flow
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'futurespend' });

  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    scopes: ['Calendars.Read', 'User.Read'],
    redirectUri,
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    throw new Error('Outlook auth cancelled');
  }

  // 2. Exchange code for token
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier! },
    },
    discovery,
  );

  const accessToken = tokenResult.accessToken;

  // 3. Fetch calendar events from Microsoft Graph
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${now}&endDateTime=${future}&$top=500&$select=subject,start,end,location,bodyPreview,isAllDay,recurrence`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const data = await response.json();

  // 4. Map to CalendarEvent
  return data.value.map((event: any) => ({
    id: `outlook-${event.id}`,
    user_id: userId,
    external_id: event.id,
    title: event.subject,
    description: event.bodyPreview ?? null,
    start_time: event.start.dateTime,
    end_time: event.end.dateTime,
    location: event.location?.displayName ?? null,
    is_all_day: event.isAllDay,
    is_recurring: event.recurrence != null,
    detected_category: detectCategory(event.subject),
    source: 'outlook',
    created_at: new Date().toISOString(),
  }));
}
```

**Azure AD setup required:**
1. Register an app at https://portal.azure.com → App registrations
2. Add redirect URI: `futurespend://auth`
3. Add API permissions: `Calendars.Read`, `User.Read`
4. Set `EXPO_PUBLIC_MICROSOFT_CLIENT_ID` in `.env`

### Unified Calendar Store Update

Update your store to handle all three providers:

```typescript
// In calendarStore.ts — add a unified connect method
connectCalendar: async (userId: string, provider: CalendarProvider) => {
  set({ isLoading: true });
  try {
    let events: CalendarEvent[];

    switch (provider) {
      case 'google':
        events = await connectGoogleCalendar(userId);
        break;
      case 'apple':
        events = await connectAppleCalendar(userId);
        break;
      case 'outlook':
        events = await connectOutlookCalendar(userId);
        break;
    }

    // Merge with existing events (dedup by external_id)
    const existingMap = new Map(get().events.map(e => [e.external_id ?? e.id, e]));
    for (const event of events) {
      existingMap.set(event.external_id ?? event.id, event);
    }
    set({ events: Array.from(existingMap.values()) });

    // Persist to Supabase
    if (isSupabaseConfigured) {
      const rows = events.map(({ id, ...rest }) => rest);
      await supabase.from('calendar_events').upsert(rows, {
        onConflict: 'user_id,external_id,calendar_connection_id',
      });
    }
  } finally {
    set({ isLoading: false });
  }
},
```

---

## 4. Camera Integration — Receipt Scanning

### Overview

User takes a photo of a receipt → OCR extracts text → LLM structures the data → creates a transaction.

### Implementation

#### Step 1: Camera + Image Picker

```bash
npx expo install expo-camera expo-image-picker
```

```typescript
// src/services/receiptService.ts
import * as ImagePicker from 'expo-image-picker';
import { createLLMAdapter } from './llm/adapter';

export async function captureReceipt(): Promise<string> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') throw new Error('Camera permission denied');

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: 'images',
    quality: 0.8,           // Balance quality vs upload size
    base64: true,           // Need base64 for LLM vision APIs
    allowsEditing: true,    // Let user crop
  });

  if (result.canceled) throw new Error('Cancelled');
  return result.assets[0].base64!;
}

export async function pickReceiptFromGallery(): Promise<string> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) throw new Error('Cancelled');
  return result.assets[0].base64!;
}
```

#### Step 2: Receipt Parsing via LLM Vision

Both Claude and Gemini support image input. This is the most accurate approach — no separate OCR step needed.

```typescript
// src/services/receiptService.ts (continued)

interface ParsedReceipt {
  merchant_name: string;
  date: string;              // YYYY-MM-DD
  total: number;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  category: EventCategory;
  payment_method: string | null;  // "Visa ending 4242"
}

export async function parseReceipt(base64Image: string): Promise<ParsedReceipt> {
  const prompt = `Analyze this receipt image and extract the following as JSON:
{
  "merchant_name": "store/restaurant name",
  "date": "YYYY-MM-DD",
  "total": 0.00,
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "currency": "CAD",
  "items": [{"name": "item", "quantity": 1, "price": 0.00}],
  "category": "one of: dining|groceries|transport|entertainment|shopping|travel|health|education|fitness|social|professional|bills|personal|other",
  "payment_method": "card type if visible, else null"
}
Return ONLY valid JSON. If a field is not visible, use null.`;

  // For Claude Vision:
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image,
            },
          },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse receipt');

  return JSON.parse(jsonMatch[0]);
}
```

#### Step 3: For Gemini Vision (alternative)

```typescript
export async function parseReceiptGemini(base64Image: string): Promise<ParsedReceipt> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: prompt },  // Same prompt as above
          ],
        }],
      }),
    },
  );

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch![0]);
}
```

#### Step 4: Receipt → Transaction

```typescript
// src/services/receiptService.ts (continued)

export async function createTransactionFromReceipt(
  userId: string,
  receipt: ParsedReceipt,
): Promise<Transaction> {
  const transaction: Omit<Transaction, 'id'> = {
    user_id: userId,
    amount: -receipt.total,  // Negative = expense
    date: receipt.date,
    merchant_name: receipt.merchant_name,
    category: receipt.category,
    description: receipt.items.map(i => i.name).join(', '),
    is_recurring: false,
    source: 'receipt_scan',
    receipt_data: receipt,  // Store full parsed receipt as JSONB
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    return data;
  }

  // Demo mode — add to local store
  return { id: `receipt-${Date.now()}`, ...transaction };
}
```

#### Step 5: UI Component

```typescript
// New screen: app/scan-receipt.tsx
// - Camera preview with "Take Photo" button
// - Or "Choose from Gallery" button
// - After capture: shows loading spinner "Analyzing receipt..."
// - Shows parsed results in editable form:
//   - Merchant name (editable)
//   - Total amount (editable)
//   - Date (editable)
//   - Category (picker)
//   - Line items (list)
// - "Save Transaction" button
// - "Retake" button if parsing looks wrong
```

#### Schema Addition

Add a `receipt_data` JSONB column to the transactions table:

```sql
ALTER TABLE transactions ADD COLUMN receipt_data JSONB;
ALTER TABLE transactions ADD COLUMN source TEXT DEFAULT 'manual';
-- source values: 'plaid', 'receipt_scan', 'manual', 'csv_import'
```

### Cost Considerations

- **Claude Vision**: ~$0.002-0.005 per receipt (depends on image size)
- **Gemini Vision**: Free tier covers ~1,500 requests/day; paid tier is ~$0.001/receipt
- Consider caching: if the user re-scans the same receipt, detect duplicates by merchant + amount + date

---

## 5. Manual Calendar Entry with Price Prediction

### The Feature

User types: "Lunch at Earls on Friday" → app creates a calendar event AND immediately predicts "$35-55, dining, 85% confidence".

### Implementation

#### Step 1: Natural Language Event Parser

Use your existing LLM adapter to parse free-text into structured event data:

```typescript
// src/services/eventParserService.ts
import { createLLMAdapter } from './llm/adapter';

interface ParsedEvent {
  title: string;
  date: string;            // ISO date
  time: string | null;     // HH:mm or null
  duration_minutes: number;
  location: string | null;
  category: EventCategory;
  predicted_amount: number;
  prediction_low: number;
  prediction_high: number;
  confidence: number;
}

export async function parseNaturalLanguageEvent(
  input: string,
  userTimezone: string = 'America/Vancouver',
): Promise<ParsedEvent> {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().toLocaleDateString('en', { weekday: 'long' });

  const prompt = `Parse this into a calendar event with spending prediction. Today is ${dayOfWeek}, ${today}. Timezone: ${userTimezone}.

Input: "${input}"

Return JSON:
{
  "title": "event title",
  "date": "YYYY-MM-DD",
  "time": "HH:mm or null",
  "duration_minutes": 60,
  "location": "venue name or null",
  "category": "dining|groceries|transport|entertainment|shopping|travel|health|education|fitness|social|professional|bills|personal|other",
  "predicted_amount": 0.00,
  "prediction_low": 0.00,
  "prediction_high": 0.00,
  "confidence": 0.85
}

For spending prediction, consider:
- Restaurant meals: lunch $15-35, dinner $30-80, fast food $8-15
- Coffee shops: $5-10
- Groceries: $40-120
- Movies: $15-25
- Gym: $0-50/month
- Gas: $40-80
- Shopping: varies widely, estimate conservatively

If the venue is known (e.g., "Earls", "Cactus Club"), use typical price ranges for that establishment.
Return ONLY valid JSON.`;

  const adapter = createLLMAdapter();
  const response = await adapter.predict(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch![0]);
}
```

#### Step 2: Mock Version (No API Key)

```typescript
// src/services/eventParserService.ts — add fallback

const VENUE_PRICES: Record<string, { low: number; high: number; category: EventCategory }> = {
  // Vancouver restaurants
  'earls': { low: 25, high: 55, category: 'dining' },
  'cactus club': { low: 30, high: 60, category: 'dining' },
  'joeys': { low: 25, high: 50, category: 'dining' },
  'white spot': { low: 15, high: 30, category: 'dining' },
  'tim hortons': { low: 4, high: 12, category: 'dining' },
  'starbucks': { low: 5, high: 10, category: 'dining' },
  'mcdonalds': { low: 8, high: 15, category: 'dining' },
  'subway': { low: 8, high: 15, category: 'dining' },
  // Add more venues...
};

const ACTIVITY_PRICES: Record<string, { low: number; high: number; category: EventCategory }> = {
  'lunch': { low: 15, high: 35, category: 'dining' },
  'dinner': { low: 30, high: 75, category: 'dining' },
  'breakfast': { low: 10, high: 25, category: 'dining' },
  'coffee': { low: 4, high: 8, category: 'dining' },
  'movie': { low: 15, high: 25, category: 'entertainment' },
  'concert': { low: 40, high: 150, category: 'entertainment' },
  'gym': { low: 0, high: 15, category: 'fitness' },
  'yoga': { low: 15, high: 25, category: 'fitness' },
  'groceries': { low: 40, high: 120, category: 'groceries' },
  'shopping': { low: 25, high: 100, category: 'shopping' },
  'uber': { low: 10, high: 30, category: 'transport' },
  'gas': { low: 40, high: 80, category: 'transport' },
  'haircut': { low: 25, high: 60, category: 'personal' },
  'dentist': { low: 50, high: 200, category: 'health' },
  'doctor': { low: 0, high: 50, category: 'health' },
};

function parseEventLocally(input: string): ParsedEvent {
  const lower = input.toLowerCase();

  // Find venue match
  let priceInfo = null;
  for (const [venue, info] of Object.entries(VENUE_PRICES)) {
    if (lower.includes(venue)) {
      priceInfo = info;
      break;
    }
  }

  // Fall back to activity match
  if (!priceInfo) {
    for (const [activity, info] of Object.entries(ACTIVITY_PRICES)) {
      if (lower.includes(activity)) {
        priceInfo = info;
        break;
      }
    }
  }

  priceInfo = priceInfo ?? { low: 10, high: 50, category: 'other' as EventCategory };
  const mid = (priceInfo.low + priceInfo.high) / 2;

  // Parse date ("friday", "tomorrow", "next tuesday", etc.)
  const date = parseFuzzyDate(lower);

  return {
    title: input,
    date: date.toISOString().split('T')[0],
    time: extractTime(lower),
    duration_minutes: 60,
    location: extractVenue(lower),
    category: priceInfo.category,
    predicted_amount: Math.round(mid * 100) / 100,
    prediction_low: priceInfo.low,
    prediction_high: priceInfo.high,
    confidence: priceInfo === VENUE_PRICES[Object.keys(VENUE_PRICES).find(v => lower.includes(v))!] ? 0.8 : 0.6,
  };
}
```

#### Step 3: Quick-Add UI

```typescript
// Add to plan.tsx or as a new component
// - Text input with placeholder "Lunch at Earls on Friday..."
// - As user types, debounce 500ms then show prediction preview:
//   [🍽 Dining]  $25 - $55  (85% confidence)
// - "Add to Calendar" button creates the event + prediction
// - Shows in calendar with prediction badge immediately
```

#### Step 4: Learning from History

Over time, improve predictions by using the user's actual spending data:

```typescript
export function getPersonalizedPrediction(
  merchant: string,
  category: EventCategory,
  transactions: Transaction[],
): { low: number; high: number; average: number } {
  // Find past transactions at this merchant
  const pastAtMerchant = transactions.filter(
    t => t.merchant_name?.toLowerCase().includes(merchant.toLowerCase()),
  );

  if (pastAtMerchant.length >= 3) {
    const amounts = pastAtMerchant.map(t => Math.abs(t.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    return { low: min * 0.9, high: max * 1.1, average: avg };
  }

  // Fall back to category average
  const categoryTxns = transactions.filter(t => t.category === category);
  if (categoryTxns.length >= 5) {
    const amounts = categoryTxns.map(t => Math.abs(t.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    return { low: avg * 0.5, high: avg * 1.5, average: avg };
  }

  // Fall back to defaults
  return ACTIVITY_PRICES[category] ?? { low: 10, high: 50, average: 30 };
}
```

---

## 6. Architecture Summary

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Plaid    │  │  Google   │  │  Apple   │  │Outlook │ │
│  │  (banks)  │  │ Calendar  │  │ Calendar │  │Calendar│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │              │              │             │      │
│  ┌────┴──────────────┴──────────────┴─────────────┴───┐ │
│  │              Your Backend Server                    │ │
│  │  (Supabase Edge Functions or Express)               │ │
│  │  - Token exchange    - Webhook handlers             │ │
│  │  - Encrypted storage - Transaction sync             │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │                                  │
│  ┌────────────────────┴───────────────────────────────┐ │
│  │              Supabase PostgreSQL                     │ │
│  │  transactions | calendar_events | accounts          │ │
│  │  plaid_connections | calendar_connections            │ │
│  └────────────────────┬───────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────┐
│                 MOBILE APP                               │
│                       │                                  │
│  ┌────────────────────┴───────────────────────────────┐ │
│  │              Zustand Stores                         │ │
│  │  transactionStore | calendarStore | predictionStore │ │
│  └──────┬──────────────────┬──────────────────┬───────┘ │
│         │                  │                  │         │
│  ┌──────┴─────┐   ┌───────┴───────┐   ┌──────┴──────┐ │
│  │  Receipt   │   │  Manual Entry  │   │    LLM      │ │
│  │  Scanner   │   │  NL Parser     │   │  Predictions│ │
│  │ (camera +  │   │ "lunch at x"   │   │ (Claude /   │ │
│  │  LLM OCR)  │   │  → $25-$55     │   │  Gemini)    │ │
│  └────────────┘   └────────────────┘   └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### API Keys / Credentials Needed

| Service | Key | Where to Get | Required? |
|---|---|---|---|
| Plaid | `PLAID_CLIENT_ID`, `PLAID_SECRET` | plaid.com/dashboard | Yes for bank data |
| Google Calendar | `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID` | console.cloud.google.com | Yes for Google Cal |
| Microsoft / Outlook | `MICROSOFT_CLIENT_ID` | portal.azure.com | Yes for Outlook |
| Claude (Anthropic) | `CLAUDE_API_KEY` | console.anthropic.com | Yes for receipt scanning + predictions |
| Gemini (Google AI) | `GEMINI_API_KEY` | aistudio.google.com | Alternative to Claude |
| Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | supabase.com dashboard | Yes for persistence |

### Build Requirements

| Feature | Expo Go? | EAS Dev Build? | Production Build? |
|---|---|---|---|
| Demo mode (current) | Yes | Yes | Yes |
| Google Calendar OAuth | No | Yes | Yes |
| Apple Calendar | Partial (read) | Yes | Yes |
| Outlook Calendar | Yes (via expo-auth-session) | Yes | Yes |
| Plaid Link | No | Yes | Yes |
| Camera (receipt scan) | Yes | Yes | Yes |
| Push notifications | No | Yes | Yes |

### Migration Order

Recommended implementation sequence:

1. **Supabase setup** — Create project, run migrations, set env vars. Enables persistence for everything.
2. **Camera + Receipt scanning** — Highest user delight, works in Expo Go, only needs an LLM API key.
3. **Apple Calendar** — `expo-calendar` mostly works in Expo Go. Lowest friction calendar integration.
4. **Manual event entry + price prediction** — Pure frontend + LLM, no native modules needed.
5. **EAS dev build** — Transition from Expo Go. Unlocks native modules.
6. **Google Calendar OAuth** — Requires EAS build + Google Cloud setup.
7. **Outlook Calendar** — Requires Azure AD app registration.
8. **Plaid integration** — Requires backend server + Plaid account + EAS build. Most complex.
9. **Cross-institution tracking** — Builds on Plaid, mostly a UI/query layer on top.
