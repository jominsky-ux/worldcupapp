# src/hooks/ — Custom React Query Hooks

This folder contains custom hooks that fetch data from the backend (or mock data during development).

## What is a custom hook?

A custom hook is a JavaScript function whose name starts with `use`. It can call other hooks (like `useQuery`, `useState`, `useEffect`) and encapsulates reusable logic. Components call these hooks to get data without needing to know how or where the data comes from.

## useGameData.js

The main data-fetching file. Contains:

| Hook | Data fetched | Used by |
|------|-------------|---------|
| `useGroups()` | All 12 groups + 4 teams each | GroupStagePage, GroupCard |
| `usePlayers(filters)` | Players list, filterable by position/search | SquadPage, PlayerCard |
| `useLeaderboard()` | Ranked user list by points | LeaderboardPage |
| `useTournamentInfo()` | Current phase + deadlines | CountdownBanner, PhaseGate |
| `useSaveGroupPicks(entryId)` | Mutation — saves group picks | GroupStagePage |

## How React Query works

```
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['groups'],    // unique key — React Query uses this for caching
  queryFn: fetchGroups,    // the async function that returns data
  staleTime: 60_000,       // how long before data is considered "stale"
})
```

React Query automatically:
- Shows `isLoading = true` while the first fetch is in progress
- Caches the result (same `queryKey` = same cached data)
- Refetches in the background when the component re-mounts or the window refocuses
- Sets `isError = true` if the fetch throws

## Connecting to the real backend

Each `queryFn` currently returns mock data. To switch to real API calls, replace the mock body:

```js
// Before (mock):
queryFn: async () => {
  await delay(300)
  return GROUPS
}

// After (real API):
queryFn: () => axios.get('/api/groups').then(r => r.data)
```

The `axios` instance should be configured with the base URL and auth header — see `src/utils/api.js` (to be created).
