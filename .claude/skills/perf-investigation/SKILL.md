---
name: perf-investigation
description: Triage a perf issue in the Expo / React Native app. Focus on Reanimated worklets, FlatList, React Query cache, and Zustand selector churn.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# perf-investigation

## When to use

- "Frame drops when scrolling `<screen>`"
- "Animation jank on `<surface>`"
- "App feels slow on first launch"
- "Too many re-renders in `<component>`"
- "Bundle size growing"

## Steps

1. **Read the rules.** Load `.claude/rules/react-native.md` (lists,
   animations) and `.claude/rules/clean-code.md` (function size).

2. **Reproduce.** Use a dev build (`pnpm mobile android` / `pnpm mobile ios`). For
   animation jank, enable the Reanimated profiler via Flipper or
   `console.log` inside the worklet. For list perf, capture
   `onMomentumScrollEnd` and `getItemLayout` timing.

3. **Spawn a focused `reviewer` + Explore** to map the surface in
   question. The reviewer flags the canonical perf anti-patterns
   listed below.

4. **Fix in priority order:**

   ### 1. Reanimated worklet violations (highest impact)

   - Anything that captures JS-thread state in `useAnimatedStyle`
     must be wrapped in `useSharedValue` / derived worklet-side.
   - Don't call `setState` from a worklet. Use `runOnJS` only when
     absolutely required.
   - Avoid `withTiming(..., { duration: 0 })` no-ops that still
     schedule a frame.

   ### 2. FlatList / FlashList misconfiguration

   - Always set `estimatedItemSize` on `FlashList`.
   - For `FlatList`, set `getItemLayout` when row height is fixed.
   - Enable `removeClippedSubviews` (default for FlashList).
   - Never pass an inline `renderItem={({ item }) => <Row ... />}` —
     lift to a stable component reference so FlashList can memoise.
   - Use `keyExtractor` with a stable primitive id (not the whole
     item object).

   ### 3. React Query cache misses

   - `staleTime` defaults to 0. For data that doesn't change on a
     millisecond timescale, set `staleTime: 30_000` (or 60_000).
   - `refetchOnWindowFocus: true` is correct for `me` and
     `subscription-status`, but expensive on every query. Don't apply
     globally.

   ### 4. Zustand selector churn

   - Use `createSelectors` (the project's helper) to read a single
     slice. Reading the whole store triggers re-render on any change.
   - For derived data, prefer `useMemo` over re-deriving in render.

   ### 5. Bundle / cold start

   - Lazy-import heavy components with `React.lazy` (use sparingly
     — Metro doesn't always tree-shake well with it).
   - Move static assets to `assets/` and reference via `require()` so
     Metro can fingerprint them.

5. **Measure again.** Compare the same dev build before/after. Reanimated
   has a perf panel; Flipper's React DevTools shows render counts;
   `console.time` / `console.timeEnd` around suspect blocks is fine
   during dev.

6. **Commit.** `/commit`. Prefix: `perf(<surface>):` with the metric
   you improved (e.g. `reduced jank from 12 dropped frames to 0 on
   settings scroll`).

## Don't

- Don't ship `useEffect`-driven re-renders as a "fix" for derived state.
  Compute on render.
- Don't wrap every `useAnimatedStyle` in `useMemo` — the worklet
  machinery already memoises when inputs are stable. Profile first.
- Don't apply `staleTime` to user-mutating queries. They must be
  fresh.
- Don't use `React.memo` defensively. Profile first.
