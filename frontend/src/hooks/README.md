# src/hooks/ — Custom React Query Hooks

This folder contains custom hooks that fetch data from the backend using React Query (TanStack Query v5).

## What is a custom hook?

A custom hook is a JavaScript function whose name starts with `use`. It can call other hooks (like `useQuery`, `useState`, `useEffect`) and encapsulates reusable logic. Components call these hooks to get data without knowing how or where it comes from.

## useGameData.js

The main data-fetching file. All hooks below call the Spring Boot backend via the shared axios instance in `src/api/client.js`. The Vite proxy forwards `/api/*` to `localhost:8080` during local development.

| Hook | Endpoint | Used by | Notes |
|------|----------|---------|-------|
| `useGroups()` | `GET /api/groups` | GroupStagePage | Cached 1 h (groups don't change mid-tournament) |
| `useStandings()` | `GET /api/standings` | StandingsPage | Refreshes every 5 min |
| `useScoreboard()` | `GET /api/matches` | MatchesPage | Refreshes every 1 min |
| `useMatchSummary(eventId)` | `GET /api/matches/{id}/summary` | Match detail view | Disabled when no `eventId` |
| `useTournamentInfo()` | `GET /api/tournament/status` | Layout, PhaseGate | Refreshes every 1 min |
| `usePlayers(filters)` | `GET /api/teams/athletes` | SquadPage | Filtered client-side; all callers share one request |
| `usePlayerPoints()` | `GET /api/players/points` | SquadPage | Returns a `Map<athleteId, totalPoints>`; refreshes every 5 min |
| `usePlayerMatchHistory(athleteId)` | `GET /api/players/{athleteId}/matches` | PlayerMatchStatsModal | Per-game stats, most recent first; disabled when no `athleteId` |
| `useLeaderboard()` | `GET /api/leaderboard` | LeaderboardPage | One row per entry, dense-ranked; refreshes every 2 min |
| `useEntryDetail(entryId)` | `GET /api/leaderboard/entries/{entryId}` | EntryDetailModal | Points breakdown + squad roster for one entry; disabled when no `entryId` |
| `useSaveGroupPicks(entryId)` | *(mock delay — no backend call yet)* | Unused | Dead code — `GroupStagePage` actually saves group picks via `EntryContext.saveGroupPick()`, which is wired to `PUT /api/entries/{id}/picks/groups` |

## How React Query works

```js
const { data, isLoading, isError } = useQuery({
  queryKey: ['groups'],    // unique cache key
  queryFn: () => apiClient.get('/api/groups').then(r => r.data),
  staleTime: 1000 * 60 * 60,  // how long before background refetch
})
```

React Query automatically:
- Shows `isLoading = true` while the first fetch is in progress
- Caches the result under `queryKey` — the same key across components shares one request
- Refetches in the background when a component re-mounts or the window regains focus
- Sets `isError = true` if the fetch throws

## Field normalisation

ESPN returns some fields with different names than the mock shapes components were built against. `useGameData.js` normalises them on the way in so no component changes are needed:

- `team.abbreviation` → `team.code`
- `team.logoUrl` → `team.flagUrl`
- `athlete.position` (full ESPN name) → `GK` / `DEF` / `MID` / `FWD`
