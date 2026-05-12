# src/pages/ — Page Components

Each file in this folder corresponds to one route in the application (defined in `src/App.jsx`).

## Page inventory

| File | Route | Description |
|------|-------|-------------|
| `AuthPage.jsx` | `/login`, `/register` | Login and registration (shared component, `mode` prop switches between them) |
| `DashboardPage.jsx` | `/dashboard` | Entry overview, creation, and scoring reference |
| `GroupStagePage.jsx` | `/group-stage` | Pick group winners and runners-up for all 12 groups |
| `BracketPage.jsx` | `/bracket` | Pick knockout round winners (Round of 32 through Final) |
| `SquadPage.jsx` | `/squad` | Pick formation + 11 players for the tournament squad |
| `LeaderboardPage.jsx` | `/leaderboard` | Global ranked leaderboard |
| `NotFoundPage.jsx` | `*` (catch-all) | 404 page |

## Conventions

- **Pages are dumb coordinators** — they fetch data (via hooks) and pass it down to smaller components. Heavy UI logic lives in child components
- **Pages handle top-level loading/error states** — if the main data for a page is loading, the page renders a `<LoadingSpinner>`. If there's an error, the page shows an error message
- **Pages use PhaseGate** to lock themselves based on the current tournament phase
- **Sub-components** that are only used by one page are defined at the bottom of that page's file (see `GroupCard` in `GroupStagePage.jsx`). Once a sub-component is needed by a second page, it moves to `components/shared/` or its own feature folder

## Building new pages

1. Create `YourPage.jsx` in this folder
2. Add a `<Route path="/your-path" element={<YourPage />}>` in `App.jsx`
3. Add a nav link in `Navbar.jsx` if it should appear in the top nav
4. Write the page JSDoc comment explaining what the page does and its data dependencies
