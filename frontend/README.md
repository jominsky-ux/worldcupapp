# World Cup Fantasy 2026 — Frontend

A React single-page application for picking World Cup brackets and fantasy player squads.

---

## Tech stack

| Tool | Purpose |
|------|---------|
| **React 18** | UI component library |
| **Vite** | Dev server and build tool (replaces Create React App) |
| **React Router v6** | Client-side routing (page navigation without full reloads) |
| **TanStack React Query** | Server-state management (data fetching, caching, refetching) |
| **Tailwind CSS** | Utility-first CSS framework |
| **date-fns** | Date formatting and countdown calculations |
| **Axios** | HTTP client for API calls (not yet wired — mocks used in dev) |
| **@sentry/react** | Frontend error tracking and session replay (disabled if `VITE_SENTRY_DSN` is unset) |

---

## Getting started

### Prerequisites
- Node.js 20 or later
- npm 10 or later

### Install dependencies
```bash
cd frontend
npm install
```

### Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). The app hot-reloads when you save files.

### Build for production
```bash
npm run build
```
Output goes to `dist/`. Deploy this folder to AWS S3 + CloudFront.

In CI, `deploy-frontend` (see [`.github/workflows/deploy.yaml`](../.github/workflows/deploy.yaml)) only runs when a push to `main` touches `frontend/**` (or the workflow file itself), excluding `frontend/README.md` — backend-only and docs-only changes don't trigger a rebuild/redeploy of the frontend.

**SPA routing in production:** since this is a client-side-routed app (React Router) served as static files from S3 via CloudFront, the CloudFront distribution (`E2N04CWD7X7GAY`) has a custom error response mapping HTTP 404 → `/index.html` (response code 200). Without this, directly navigating to or refreshing a route like `/group-stage` or `/squad` would hit S3 (the origin is the S3 *website* endpoint, which 404s on missing keys) before React Router ever loads, and the browser would see a raw 404 instead of the app. This is a one-time CloudFront distribution setting — it isn't managed by any file in this repo and won't be reset by future deploys (`deploy-frontend` only syncs `dist/` to S3 and invalidates the cache; it doesn't touch distribution config).

---

## Project structure

```
frontend/
├── index.html              # HTML entry point — React mounts into <div id="root">
├── vite.config.js          # Vite build config + dev server proxy to Java backend
├── tailwind.config.js      # Design tokens (colors, fonts, shadows)
├── src/
│   ├── main.jsx            # App entry — wraps everything in providers
│   ├── App.jsx             # Route definitions
│   ├── component-tree.mermaid  # Visual component diagram (see below)
│   ├── styles/
│   │   └── globals.css     # Global CSS + Tailwind directives + reusable classes
│   ├── pages/              # One component per route/page
│   ├── components/
│   │   └── shared/         # Components used across multiple pages
│   ├── context/            # Global state (auth, active entry)
│   ├── hooks/              # React Query data-fetching hooks
│   ├── mocks/              # Fake data that mimics backend API responses
│   └── utils/              # Pure helper functions (scoring math, formatting)
```

---

## Component tree

The diagram below shows how every component, context, hook, and mock file fits together. Render it with any Mermaid-compatible viewer (GitHub renders it natively in `.md` files; VS Code with the Mermaid extension; or paste into [mermaid.live](https://mermaid.live)).

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#0A1628', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#C9A84C', 'lineColor': '#888780', 'secondaryColor': '#1E3460', 'tertiaryColor': '#F4F6FA'}}}%%
flowchart TD
    ROOT["main.jsx\nQueryClientProvider · BrowserRouter\nAuthProvider · EntryProvider"]

    ROOT --> APP["App.jsx\nRoute definitions"]

    APP --> AUTH_PAGE["AuthPage\n/login · /register"]
    APP --> LAYOUT["Layout.jsx\nProtectedRoute wrapper"]

    AUTH_PAGE --> LOGIN["LoginForm"]
    AUTH_PAGE --> REG["RegisterForm"]

    LAYOUT --> NAV["Navbar"]
    LAYOUT --> BANNER["CountdownBanner\nDeadline timer"]
    LAYOUT --> OUTLET["React Router Outlet\n↓ current page renders here"]

    OUTLET --> DASH["DashboardPage\n/dashboard"]
    OUTLET --> GROUP["GroupStagePage\n/group-stage"]
    OUTLET --> BRACKET["BracketPage\n/bracket"]
    OUTLET --> SQUAD["SquadPage\n/squad"]
    OUTLET --> LEADER["LeaderboardPage\n/leaderboard"]

    DASH --> ENTRY_CARD["EntryCard\n× up to 3"]
    DASH --> CREATE_ENTRY["CreateEntry\nname input form"]

    GROUP --> GROUP_CARD["GroupCard\n× 12 groups\nFlag + 1st/2nd radios"]
    GROUP --> THIRD_PANEL["ThirdPlacePanel\n8 picks · flag chips"]

    BRACKET --> BRACKET_TREE["BracketTree\n⚠ planned"]
    BRACKET_TREE --> MATCHUP["MatchupSlot\n× 31 matchups"]

    SQUAD --> SQUAD_BUILDER["Player grid\nPosition filter · Search\n4-per-team limit"]
    SQUAD_BUILDER --> PLAYER_CARD["PlayerCard\nselected · disabled states"]
    PLAYER_CARD --> STATS_MODAL["PlayerMatchStatsModal\nper-game table · opponent + date"]

    LEADER --> SCORE_TABLE["ScoreTable"]
    SCORE_TABLE --> RANK_ROW["RankRow\n× N users"]
    RANK_ROW --> ENTRY_MODAL["EntryDetailModal\ngroup/3rd/bracket/squad breakdown\nsquad ordered by position"]

    subgraph SHARED["Shared components  —  used across pages"]
        direction LR
        PR["ProtectedRoute\nAuth guard"]
        PG["PhaseGate\nLock by tournament phase"]
        TB["TeamBadge\nFlag emoji + name"]
        PC["PlayerCard"]
        PMSM["PlayerMatchStatsModal"]
        EDM["EntryDetailModal"]
        LS["LoadingSpinner\nsm · md · lg"]
    end

    subgraph CONTEXT["Context providers  —  global state"]
        direction LR
        AUTH_CTX["AuthContext\nuser · token · login · logout"]
        ENTRY_CTX["EntryContext\nentries · activeEntry · phase\nsaveGroupPick · saveThirdPlacePicks\nsaveSquadPick · saveBracketPick"]
    end

    subgraph HOOKS["React Query hooks  —  data fetching"]
        direction LR
        H1["useGroups()"]
        H2["usePlayers(filters)"]
        H3["useLeaderboard()"]
        H4["useTournamentInfo()"]
        H5["useSaveGroupPicks()"]
        H6["usePlayerPoints()"]
        H7["usePlayerMatchHistory(athleteId)"]
        H8["useEntryDetail(entryId)"]
    end

    subgraph MOCKS["src/mocks/  —  still used by mocked hooks"]
        direction LR
        M1["teams.js\n48 teams · 12 groups"]
        M2["players.js\n~40 players · FPL stats"]
        M3["entries.js\nscoring constants\nMAX_THIRD_PLACE_PICKS=8\nMAX_PLAYERS_PER_TEAM=4"]
    end

    HOOKS -->|"queryFn (mock — saveGroupPicks only)"| MOCKS
    CONTEXT -.->|"useAuth()\nuseEntry()"| OUTLET
    SHARED -.->|"imported by pages"| OUTLET
```

The standalone `.mermaid` source lives at `src/component-tree.mermaid`.

---

## Game rules summary

### Group stage picks (lock at tournament kickoff — June 11, 2026)

| Pick | Points |
|------|--------|
| Correct group winner (×12) | +4 pts each |
| Correct group runner-up (×12) | +2 pts each |
| All 12 groups correct (both positions) | +20 pts bonus |
| Correct 3rd-place qualifier (×8 picks) | +1 pt each |
| All 8 3rd-place picks correct | +10 pts bonus |

**3rd-place picks:** In 2026, the 8 best third-place finishers advance to the R32. Users pick 8 teams they think will be among those qualifiers. Only one team per group may be selected.

### Squad picks (lock at tournament kickoff — June 11, 2026)

- Pick **Formation first** (1 GK): 3-5-2, 3-4-3, 4-5-1, 4-4-2, 4-3-3, 5-4-1, 5-3-2, 5-2-3
- Pick **11 players** based on formation selected
- **Max 4 players from any one national team**
- Players earn FPL-style points per match:

| Event | Points |
|-------|--------|
| Played ≥ 60 min | +2 |
| Played < 60 min | +1 |
| Goal scored (GK / DEF) | +6 |
| Goal scored (MID) | +5 |
| Goal scored (FWD) | +4 |
| Assist | +3 |
| Clean sheet ≥ 60 min (GK / DEF) | +4 |
| Clean sheet ≥ 60 min (MID) | +1 |
| Every 3 saves (GK only) | +1 |
| Penalty kick saved (GK only) | +5 |
| ≥ 10 defensive interventions (DEF / MID / FWD) | +2 |
| Yellow card | −1 |
| Red card | −3 |
| Own goal | −2 |
| Penalty kick missed | −2 |

Clicking **View stats** on any player in your squad opens a per-game breakdown (`PlayerMatchStatsModal`) showing opponent, match date, and the full stat line above for every completed match.

### Bracket picks (lock at R32 kickoff)

| Round | Points per correct pick |
|-------|------------------------|
| Round of 32 | +4 pts |
| Round of 16 | +8 pts |
| Quarterfinal | +16 pts |
| Semifinal | +32 pts |
| Final | +64 pts |

### Entries

- Each user may create **up to 3 independent entries**
- Each entry has its own group picks, squad, and bracket — they score separately

### Leaderboard

Clicking an entry name on the leaderboard opens `EntryDetailModal`, showing that entry's group-stage points, 3rd-place points, bracket points, and full squad ordered GK → DEF → MID → FWD. The squad table has three columns — Player (name, with team abbreviation and position shown in small grey text alongside it), GP (games played), and Pts. This works for any entry, not just the logged-in user's own — the leaderboard and its per-entry detail are both public, unauthenticated endpoints.

---

## Mock data vs real API

Most hooks in `src/hooks/useGameData.js` are now wired to the live Spring Boot backend. The following hooks call real endpoints:

| Hook | Endpoint |
|------|----------|
| `useGroups()` | `GET /api/groups` |
| `useStandings()` | `GET /api/standings` |
| `useScoreboard()` | `GET /api/matches` |
| `useMatchSummary(id)` | `GET /api/matches/{id}/summary` |
| `useTournamentInfo()` | `GET /api/tournament/status` |
| `usePlayers(filters)` | `GET /api/teams/athletes` |
| `usePlayerPoints()` | `GET /api/players/points` |
| `usePlayerMatchHistory(athleteId)` | `GET /api/players/{athleteId}/matches` |
| `useLeaderboard()` | `GET /api/leaderboard` |
| `useEntryDetail(entryId)` | `GET /api/leaderboard/entries/{entryId}` |

The following hooks still return mock data until their backend endpoints are built:

| Hook | Status |
|------|--------|
| `useSaveGroupPicks()` | Simulates a save; backend mutation not yet wired |

---

## Simulating different tournament phases

In production, the tournament phase is determined from the live backend (`GET /api/tournament/status` → `groupPicksOpen` / `bracketPicksOpen` flags). For local development you can override this with an environment variable instead of waiting for the real tournament calendar.

In `.env.local`, set:

```
VITE_DEV_PHASE=PRE_TOURNAMENT
```

| Value | Effect |
|-------|--------|
| `'PRE_TOURNAMENT'` | Group stage picks open, bracket/squad locked |
| `'GROUP_STAGE'` | Tournament underway, all picks locked |
| `'KNOCKOUT'` | Bracket picks open, group picks locked |

Remove or leave `VITE_DEV_PHASE` unset in production builds — the app will use the live phase from the backend.

---

## Key concepts for new React developers

### JSX
React components return JSX — HTML-like syntax compiled to JavaScript. Use `className` instead of `class`, and all tags must be closed.

### Props
Data passed from a parent component to a child. Like HTML attributes but for your own components. Props flow **down** only.

### State (`useState`)
Data that belongs to a component and can change. When state changes, React re-renders the component.

### Derived state (`useMemo`)
When a value can be computed from existing state, use `useMemo` to cache the result and only recompute when the source state changes. Used for `positionCounts` and `teamCounts` in `SquadPage`.

### Effects (`useEffect`)
Code that runs after a render and reaches outside the component (timers, API calls, DOM mutations). Always return a cleanup function if you start a timer or subscription.

### Context
Global state accessible by any component without prop drilling. We use it for auth (`useAuth()`) and active entry data (`useEntry()`).

### React Query
Manages fetched data (server state). Handles loading, errors, caching, and background refetches automatically.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```
# Required — Spring Boot backend URL (proxied by Vite in dev, set explicitly in prod)
VITE_API_BASE_URL=http://localhost:8080

# Optional — override the live tournament phase for local development
# Valid values: PRE_TOURNAMENT | GROUP_STAGE | KNOCKOUT
# VITE_DEV_PHASE=PRE_TOURNAMENT

# Optional — Sentry DSN for error tracking and session replay.
# Create a project at sentry.io and copy the DSN from Settings → Client Keys.
# Leave unset locally unless you want to test Sentry; set via GitHub Secret in CI for production builds.
# VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxx@oxxxxxx.ingest.sentry.io/xxxxxxx
```

All Vite environment variables must start with `VITE_` to be accessible in the browser. In production, `VITE_API_BASE_URL` is set to the backend CloudFront URL during the CI build step. `VITE_SENTRY_DSN` is injected by the CI workflow from a GitHub Actions secret.
