# src/mocks/ — Mock Data

This folder contains fake data that simulates what the real backend API will return.

## Why mocks?

When building the frontend before the backend is ready, we need something that "looks like" real API responses so components can be developed and tested. Mock data lets us:
- Build and style components with realistic data
- Test edge cases (empty states, long names, many entries)
- Develop offline without needing the Java backend running

## Files

| File | Contents |
|------|----------|
| `teams.js` | All 48 nations, organized into 12 groups of 4 |
| `players.js` | ~40 sample players across all 4 positions (GK/DEF/MID/FWD) |
| `entries.js` | User entry structure, scoring constants, and phase config |

## Swapping mocks for real data

All mocks are consumed through the hooks in `src/hooks/useGameData.js`. Each hook has a comment showing exactly which API endpoint to substitute. The components themselves never import from `mocks/` directly — they only call hooks.

## Simulating tournament phases

In `entries.js`, change `MOCK_PHASE` to test different UI states:
- `'PRE_TOURNAMENT'` — only group picks are accessible
- `'PRE_KNOCKOUT'` — bracket and squad picks are accessible
- `'KNOCKOUT'` — all picks locked, viewing scores only
