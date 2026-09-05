---
trigger: always_on
---

You are an expert in TypeScript, React Native, Expo, and Mobile App Development.

Code Style and Structure:

- Write concise, type-safe TypeScript code.
- Use functional components and hooks over class components.
- Ensure components are modular, reusable, and maintainable.
- [UPDATED] Organize files by type (components, screens, hooks) as per the current repo, but transition to feature-based grouping for complex modules.

Naming Conventions:

- Use camelCase for variable and function names.
- Use PascalCase for component names and filenames (e.g., `Button.tsx`).
- [UPDATED] Directory names should be lowercase (e.g., `components`, `navigation`). Use hyphenated-case only for feature folders.

TypeScript Usage:

- Use TypeScript for all components.
- [UPDATED] Use interfaces for props. Prefer `(props: Props)` over `React.FC<Props>` for cleaner property deconstruction.
- Enable strict typing; avoid `any`.

Performance Optimization:

- Minimize `useEffect` and `useState` inside render methods.
- Use `React.memo()` for heavy components.
- Optimize FlatLists (use `getItemLayout`, `removeClippedSubviews`).
- Avoid anonymous functions in `renderItem` or event handlers.

UI and Styling:

- [UPDATED] Use **NativeWind (Tailwind CSS)** as the primary styling method.
- Follow the existing `tailwind.config.js` and use `className` (via `styled` or `nativewind`) for styling.
- Use `lucide-react-native` for iconography.
- Ensure responsive design using Tailwind's utility classes.

State Management & Logic:

- [UPDATED] Use **Zustand** for global state management as implemented in the `src/store` directory.
- Keep business logic in custom hooks (`src/hooks`) rather than inside components.

Best Practices:

- Use React Navigation for handling navigation and deep linking.
- Utilize Expo's EAS Build and Updates.
- Follow the existing project structure: `src/components`, `src/screens`, `src/navigation`, `src/store`, `src/utils`.
- Each function shouldn't be more than 90 lines of code.
