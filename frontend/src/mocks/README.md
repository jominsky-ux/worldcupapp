# src/mocks/ — Mock Data

This folder contains static data that stands in for live API responses while the app is under development or while the tournament is not yet in progress.

## Files

| File | Contents |
|------|----------|
| `teams.js` | All 48 nations with id, name, code, flag URL, and FIFA rank — organized into 12 groups of 4 |
| `players.js` | Sample players across all 4 positions (GK/DEF/MID/FWD); used as fallback when ESPN roster data is unavailable |
| `entries.js` | Scoring constants (`BRACKET_POINTS_PER_ROUND`, `GROUP_SCORING`), squad rules, and formation definitions |
| `bracket.js` | All 31 knockout matchup definitions (16 R32 + 8 R16 + 4 QF + 2 SF + 1 Final); mock results for read-only KNOCKOUT phase display; ESPN event ID lookups |

## How mocks are used

Most data-fetching mocks have been replaced with live backend calls via the hooks in `src/hooks/useGameData.js`. The remaining files serve specific purposes:

- **`teams.js`** — still used directly by `BracketPage` to populate `MOCK_R32_MATCHUPS` because the real bracket draw endpoint is not yet available from the backend.
- **`bracket.js`** — imported directly by `BracketPage` for the bracket tree structure, ESPN event ID lookups, and mock results during the KNOCKOUT phase. Will be replaced by `GET /api/tournament/bracket` when that endpoint is built.
- **`entries.js`** — exports constants consumed across multiple pages (`BRACKET_POINTS_PER_ROUND`, `SQUAD_RULES`, `FORMATIONS`). These are computed values rather than API responses, so they stay as constants.
- **`players.js`** — not actively used in production paths; kept for offline development convenience.

## Simulating tournament phases locally

Set `VITE_DEV_PHASE` in `frontend/.env.local` to override the live backend phase:

```
VITE_DEV_PHASE=PRE_TOURNAMENT   # only group picks accessible
VITE_DEV_PHASE=PRE_KNOCKOUT     # bracket and squad picks accessible
VITE_DEV_PHASE=KNOCKOUT         # all picks locked, viewing results only
```

Remove the variable (or leave it unset) to use the live phase from the backend (`GET /api/tournament/status`).

## Bracket event IDs

`bracket.js` exports `ROUND_MATCHUP_IDS` — a map from round key to an ordered list of real ESPN event IDs for the 2026 World Cup knockout matches (matches 73–104). These IDs are used as `matchEventId` when saving picks to the database, so mock data and live data share the same identifiers.
