# Saved Views, Score Slider Fix, and Email Notifications

## Context

The score slider doesn't work (router.push on every onChange tick causes re-renders). User wants to save filter combinations as named views, toggle notifications per view, and get email alerts when new events match. Resend API key provided.

---

## Step 1: Fix Score Slider + Add Text Input

**File: `src/app/(dashboard)/events/filters.tsx`**
- Add `sliderValue` local state (synced with `currentMinScore` via useEffect)
- Range input: `onChange` only updates local state, `onMouseUp`/`onTouchEnd` triggers `updateFilter`
- Add small `<input type="number" min=0 max=100 step=5>` next to slider for exact value entry (updates on blur/Enter)
- Increase slider width from `w-20` to `w-28`

## Step 2: Saved Views Schema + Migration

**New file: `src/db/schema/saved-views.ts`**
```
saved_views:
  id: serial PK
  userId: text FK -> users.id (cascade delete)
  name: text NOT NULL
  filters: jsonb NOT NULL default '{}'
  notifyEnabled: boolean NOT NULL default false
  createdAt: timestamp
  updatedAt: timestamp

  unique(userId, name)
  index(userId)
```

**Modify: `src/db/schema/index.ts`** — add export

**Run:** `npx drizzle-kit push` to apply

## Step 3: Saved Views API

**New file: `src/app/api/saved-views/route.ts`** (GET + POST)
- Pattern: follow `src/app/api/watchlist/route.ts`
- GET: list user's saved views
- POST: create view with `{ name, filters, notifyEnabled? }`

**New file: `src/app/api/saved-views/[id]/route.ts`** (PATCH + DELETE)
- PATCH: update name, filters, or notifyEnabled
- DELETE: remove view (verify ownership)

## Step 4: Saved Views UI

**Modify: `src/app/(dashboard)/events/filters.tsx`**
- Fetch saved views on mount via `useEffect` → `GET /api/saved-views`
- Add views dropdown (select) above filter row — selecting a view pushes its filter params to URL
- "Save View" button (bookmark icon) → inline name input + save button → POST to API
- Notification toggle (bell icon) per view → PATCH notifyEnabled
- Delete option per view

## Step 5: View-Based Notification Matching

**New file: `src/lib/notifications/view-matcher.ts`**
- `checkSavedViewMatches(newEventIds: number[]): Promise<number>`
- Fetch all views with `notifyEnabled = true`
- Fetch new events with their venue/genre/segment/status/scores
- Match each event against each view's filters
- Create `new_event` notification for matches
- If user has `emailNotifications` enabled → queue email

**Modify: `src/services/ticketmaster/scanner.ts`**
- After `checkWatchlistMatches(newEventIds)` call, add `checkSavedViewMatches(newEventIds)`

## Step 6: Email via Resend

**Install:** `npm install resend`

**Add to `.env.local`:** `RESEND_API_KEY=re_jiGC3Px1_LBQdRTmZ2fy2ngn1x3q4jHjY`

**New file: `src/lib/email/resend.ts`**
- Resend client wrapper, `sendNotificationEmail(to, subject, html)`
- From: `onboarding@resend.dev` (Resend sandbox)

**New file: `src/lib/email/templates.ts`**
- `newEventMatchEmail(events, viewName)` → HTML email template

**Integrate into `view-matcher.ts`:**
- After creating in-app notifications, batch email per user (one email listing all matching events)
- Check `userPreferences.emailNotifications && userPreferences.notifyNewEvents`

---

## Files Summary

| File | Action |
|------|--------|
| `src/app/(dashboard)/events/filters.tsx` | Fix slider, add text input, add saved views UI |
| `src/db/schema/saved-views.ts` | New table |
| `src/db/schema/index.ts` | Add export |
| `src/app/api/saved-views/route.ts` | New: GET + POST |
| `src/app/api/saved-views/[id]/route.ts` | New: PATCH + DELETE |
| `src/lib/notifications/view-matcher.ts` | New: match events to saved views |
| `src/services/ticketmaster/scanner.ts` | Wire in view-matcher |
| `src/lib/email/resend.ts` | New: Resend wrapper |
| `src/lib/email/templates.ts` | New: email templates |
| `package.json` | Add resend |
| `.env.local` | Add RESEND_API_KEY |

## Verification

1. Slider: drag smoothly, type exact score, URL updates only on release/blur
2. Save a view → appears in dropdown → load it → filters restore
3. Toggle notifications on a view → trigger scan → check notification appears
4. Email: verify email arrives at dylanjohnyoung@hotmail.com after scan matches a notified view
