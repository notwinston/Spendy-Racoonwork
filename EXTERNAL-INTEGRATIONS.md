# FutureSpend — External Integrations (Deferred)

> **These integrations were extracted from DATA-INGESTION-PLAN.md.** They require EAS dev builds, external API credentials, or third-party accounts and are deferred until after the core app is functional with demo data.

---

## Table of Contents

1. [Transaction Ingestion via Plaid](#1-transaction-ingestion-via-plaid)
2. [Cross-Institution Tracking](#2-cross-institution-tracking)
3. [Google Calendar Integration](#3-google-calendar-integration)
4. [Microsoft Outlook Integration](#4-microsoft-outlook-integration)
5. [Unified Calendar Store Update](#5-unified-calendar-store-update)

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
    access_token_encrypted: encrypt(accessToken),
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

## 3. Google Calendar Integration

### Prerequisites
1. Google Cloud Console project with Calendar API enabled
2. OAuth 2.0 client ID (iOS + Android)
3. EAS build (not Expo Go)

### Implementation

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

### Google Cloud Setup (Step-by-Step)

#### Step 1: Create a Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top-left → **"New Project"**
3. Name it `FutureSpend` → Click **Create**
4. Make sure the new project is selected

#### Step 2: Enable the Google Calendar API
1. Go to **APIs & Services → Library**
2. Search for **"Google Calendar API"** → Click **Enable**

#### Step 3: Configure the OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** → Click **Create**
3. Fill in: App name (`FutureSpend`), support email, developer email
4. On **Scopes** page: add `calendar.readonly` and `calendar.events.readonly`
5. On **Test users** page: add your Gmail address (and teammates')

#### Step 4: Create OAuth Client IDs

**Web Client ID:**
1. Go to **Credentials** → **+ Create Credentials → OAuth client ID**
2. Type: **Web application**, Name: `FutureSpend Web`
3. Authorized redirect URI: `https://auth.expo.io/@your-expo-username/futurespend`

**iOS Client ID:**
1. **+ Create Credentials → OAuth client ID** again
2. Type: **iOS**, Name: `FutureSpend iOS`
3. Bundle ID: `com.futurespend.app`
4. Download the `.plist` file

#### Step 5: Place the plist file
Move `GoogleService-Info.plist` into `/app/` (same level as `app.json`)

#### Step 6: Add to `.env`
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-web-client-id>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<your-ios-client-id>
```

#### Step 7: EAS Dev Build (required — Google Sign-In won't work in Expo Go)
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform ios
```

---

## 4. Microsoft Outlook Integration

Outlook uses Microsoft Graph API with OAuth 2.0.

```bash
npm install react-native-msal  # or use expo-auth-session
```

### Using `expo-auth-session` (works in Expo Go for testing)

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

---

## 5. Unified Calendar Store Update

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

## API Keys / Credentials Needed

| Service | Key | Where to Get | Required? |
|---|---|---|---|
| Plaid | `PLAID_CLIENT_ID`, `PLAID_SECRET` | plaid.com/dashboard | Yes for bank data |
| Google Calendar | `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID` | console.cloud.google.com | Yes for Google Cal |
| Microsoft / Outlook | `MICROSOFT_CLIENT_ID` | portal.azure.com | Yes for Outlook |

## Build Requirements

| Feature | Expo Go? | EAS Dev Build? |
|---|---|---|
| Google Calendar OAuth | No | Yes |
| Outlook Calendar | Yes (via expo-auth-session) | Yes |
| Plaid Link | No | Yes |
