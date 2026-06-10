# Make BedVibe production-ready: real features, sign out fix, and App Store essentials

## What I'll fix and build

### 1. Sign Out always visible
- [x] Show the red **Sign Out** button on the Profile screen no matter what.
- [x] Add a small status line under your name showing whether your account is connected to the cloud.
- [x] Make sign out work locally too (clear your session) even if the cloud isn't reachable.

### 2. Real bed scoring
- [x] Photo compression already in place via `resizeForUpload`.
- [x] Friendly retry screen on failure.
- [x] Clear loading state while the AI is thinking.
- [x] Saves entry to journal on success.

### 3. Real leaderboard
- [x] Removed seeded fake users.
- [x] Shows only real premium users from Supabase.
- [x] Friendly empty state when board is quiet.
- [x] Free users see Premium upgrade card.

### 4. Weekly Recap
- [x] Recap card in Journal tab header (becomes "Sunday Recap" on Sundays).
- [x] Full-screen recap at `/recap` with shareable card.
- [x] Best score, avg, days logged, streak, funniest title.

### 5. Shareable score card
- [x] `ShareCard` component (9:16 vertical, IG-Stories ready).
- [x] `react-native-view-shot` capture + native share sheet.
- [x] Web fallback to plain text share.

### 6. Bedtime Stories & Relaxation Audio (Premium)
- [x] New **Sleep** tab.
- [x] 6 stories + 6 ambient tracks (rain, ocean, fireplace, white noise, forest, breathing).
- [x] Built-in player at `/sleep-player` with play/pause, skip 15s, sleep timer (5/15/30/45/60m).
- [x] Free users see Premium lock; first story + Soft Rain free preview.

### 7. Delete Account
- [x] **Delete my account** button below Sign Out.
- [x] Two-step destructive confirmation.
- [x] Deletes Supabase profile, clears local data, signs out.

### 8. Privacy Policy & Terms in-app
- [x] `/privacy` and `/terms` screens with full readable content.
- [x] Linked from Profile and from the Paywall footer.

### 9. Premium unlock
- [x] Paywall keeps current design and unlocks locally.
- [x] Code comment marks where to wire real IAP (RevenueCat / react-native-iap in EAS build).

### 10. Home polish
- [x] "Tonight's bedtime story" teaser card on Home.

### 11. Simplify & fix AI (June 2026)
- [x] Removed Journal tab entirely; Sleep tab now labelled "Coming Soon."
- [x] Replaced `openai/gpt-4.1-mini` with `openai/gpt-4.1-nano` (4x cheaper, faster, vision-capable).
- [x] Rewrote `result.tsx` with timeout (45s via AbortController), per-stage loading text, and a `classifyError` helper that maps failures to plain-English messages.
- [x] Error screen now shows a thumbnail of the photo that failed to analyse and a "Go home" fallback.
- [x] Updated `PaywallSheet` feature list to match the Journal removal.

## Files added
- `expo/app/(tabs)/sleep.tsx`
- `expo/app/sleep-player.tsx`
- `expo/app/privacy.tsx`
- `expo/app/terms.tsx`
- `expo/app/recap.tsx`
- `expo/components/ShareCard.tsx`
- `expo/components/WeeklyRecapCard.tsx`
- `expo/constants/sleep-content.ts`
- `expo/lib/share-card.ts`
- `expo/lib/weekly-recap.ts`

## Files updated
- `expo/app/_layout.tsx` (registered new routes)
- `expo/app/(tabs)/_layout.tsx` (added Sleep tab)
- `expo/app/(tabs)/(home)/index.tsx` (Tonight's story teaser)
- `expo/app/(tabs)/(home)/result.tsx` (real share with view-shot)
- `expo/app/(tabs)/journal.tsx` (Weekly Recap card)

## Files removed
- `expo/app/(tabs)/journal.tsx`

## Files updated (continued)
- `expo/app/(tabs)/profile.tsx` (status, sign out always, delete account, in-app legal)
- `expo/components/PaywallSheet.tsx` (in-app legal links + IAP TODO note)
- `expo/lib/leaderboard.ts` (no more fake users)
- `expo/lib/supabase.ts` (deleteOwnProfile)
- `expo/providers/AuthProvider.tsx` (deleteAccount, local-safe signOut)
- `expo/app/(tabs)/sleep.tsx` (rewritten as "Coming Soon" placeholder)
- `expo/lib/ai.ts` (new model `openai/gpt-4.1-nano`, timeout constants)
- `expo/components/PaywallSheet.tsx` (updated feature list)
