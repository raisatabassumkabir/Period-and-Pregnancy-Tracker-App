---
paths:
  - apps/mobile/src/components/**
  - apps/mobile/src/app/**
  - apps/mobile/src/hooks/**
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# React Native / Expo rules

Applies to UI code.

## Styling

- **NativeWind v4 only.** Use `className` for every style. Never `StyleSheet.create`.
- Tailwind config lives in `tailwind.config.js`; lint enforces class order via
  `eslint-plugin-tailwindcss` (warn).
- Dark mode is automatic — use the `dark:` variant.

## Components

- Functional components with hooks. No class components.
- Props as `interface Props`, not `React.FC<Props>`. Destructure inline.
- File names: **kebab-case** for utility/hook files (`use-register-logic.ts`),
  **PascalCase** for component default exports (`RegisterForm.tsx`).
- Component function: ≤ 90 lines (project rule). If it grows, split.
- Default to named exports; default only when the file is the screen entry
  (e.g. `app/login.tsx` default-exports the screen component).

## State and side effects

- Server state: React Query (`useQuery`, `useMutation`, `react-query-kit`).
- Client state: Zustand via `createSelectors` helper in `src/lib/utils.ts`.
- Side effects: custom hooks, not in-render.
- `useEffect`: minimise. Prefer derived state.

## Auth gating

- The root layout in `src/app/_layout.tsx` is reactive to `useAuth.status`.
- Do **not** add per-screen `if (!user) navigation.replace(...)`. The root layout
  handles redirects.
- For nested gates, use the `(app)/_layout.tsx` pattern.

## Animations

- Reanimated 3.19 — keep worklets on the UI thread via `useAnimatedStyle`.
- Moti for declarative sequences. Reusable wrappers in `src/components/animations/`.
- Never toggle a `shadow-*` utility inside a runtime-changing `className`
  (css-interop crashes the screen). Toggle colour; keep shadows constant.

## Lists

- `FlashList` from `@shopify/flash-list` is the default list. Configure
  `estimatedItemSize` for known row heights.
- For `FlatList`, set `getItemLayout` whenever row height is fixed; enable
  `removeClippedSubviews`.
- No anonymous functions in `renderItem` / `keyExtractor`.

## Navigation

- Expo Router file-based. New screen = new file under `src/app/`.
- Use `<Link href="...">` for navigation, never `navigation.navigate(...)`
  in the imperative sense. The root layout is the only place that
  imperatively redirects.

## Icons

- `lucide-react-native` only. Import as `import { Foo } from 'lucide-react-native'`.

## Forms

- React Hook Form + Zod resolver. Schema in the same file as the form.
- One `FormField` (in `src/components/ui/`) and one `ErrorBanner` per form
  — extracted, not re-defined.
