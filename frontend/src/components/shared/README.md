# src/components/shared/ — Shared Components

Components in this folder are used across multiple pages. They are generic enough to work in different contexts.

## Files

### Layout.jsx
The persistent app shell. Renders the Navbar and a `<main>` area where the current page appears via React Router's `<Outlet>`. Every authenticated page is a child of Layout.

### Navbar.jsx
Top navigation bar with logo, nav links, and user menu. Uses React Router's `<NavLink>` which automatically applies an "active" style to the link that matches the current URL.

### ProtectedRoute.jsx
An auth guard wrapper. If the user is not logged in, it redirects to `/login`. Wrap any route element with this to make it require authentication.

### CountdownBanner.jsx
Shows a warning banner when a pick deadline is approaching (within 48 hours). Uses `setInterval` inside `useEffect` to tick every second. The interval is cleaned up when the component unmounts.

### SharedComponents.jsx
Groups several small shared components in one file to avoid many tiny files:
- **PhaseGate** — renders children only if the current tournament phase is in `allowedPhases`, otherwise shows a lock message
- **LoadingSpinner** — animated spinner for loading states. Has `sm`, `md`, `lg` size variants
- **PlayerCard** — a button-shaped card for a single player. Shows name, team, position badge, and points. Has selected and disabled states
- **TeamBadge** — flag emoji + country name/code. Used in group cards, bracket slots, etc.

## Design conventions

- All components use **Tailwind CSS** utility classes directly in JSX (no separate CSS files)
- Custom reusable class combinations (like `.card`, `.btn-primary`) are defined in `src/styles/globals.css` under `@layer components`
- Components never import from each other — they import from context, hooks, mocks, and utils only
- Every component that fetches data handles the `isLoading` and `isError` states explicitly

## Adding a new shared component

1. Create the file in this folder
2. Document what it does, its props, and when to use it with a JSDoc comment at the top
3. Export it as a named export (not default) so it can be co-located with other small components if needed
4. Add it to this README
