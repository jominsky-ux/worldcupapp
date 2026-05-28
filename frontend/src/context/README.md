# src/context/ — Global State Providers

React Context is used here to share data between components without passing props through every level of the tree ("prop drilling").

## AuthContext.jsx

Manages who is logged in. Any component can call `useAuth()` to get:

| Value | Type | Description |
|-------|------|-------------|
| `user` | object \| null | `{ id, email, displayName }` for the logged-in user |
| `token` | string \| null | JWT used to authenticate API requests |
| `isLoggedIn` | boolean | Shortcut for `!!user` |
| `login(email, password)` | async fn | Calls `POST /api/auth/login`; throws on failure |
| `register(email, password, displayName)` | async fn | Calls `POST /api/auth/register`; throws on failure |
| `logout()` | fn | Clears state and localStorage |

The JWT is stored in `localStorage` so it survives page refreshes. An axios request interceptor attaches it as `Authorization: Bearer <token>` on every API call.

## EntryContext.jsx

Manages the user's fantasy entries and all pick-saving actions. Any component can call `useEntry()` to get:

| Value | Type | Description |
|-------|------|-------------|
| `entries` | Entry[] | All entries for the logged-in user (up to 3) |
| `activeEntry` | Entry \| null | The currently selected entry (full object with picks and totalPoints) |
| `activeEntryId` | UUID \| null | ID of the active entry |
| `setActiveEntryId(id)` | fn | Switch which entry is active |
| `phase` | string | Current tournament phase: `PRE_TOURNAMENT` \| `PRE_KNOCKOUT` \| `KNOCKOUT` \| `GROUP_STAGE` |
| `entriesLoading` | boolean | True while the initial entries + picks + scores fetch is in flight |
| `createEntry(name)` | async fn | `POST /api/entries` |
| `saveGroupPick(groupId, firstId, secondId)` | async fn | `PUT /api/entries/{id}/picks/groups` |
| `saveThirdPlacePicks(picks)` | async fn | `PUT /api/entries/{id}/picks/third-place` *(called only when all 8 are selected)* |
| `saveBracketPick(matchupId, winnerId)` | async fn | `PUT /api/entries/{id}/picks/knockout` — `matchupId` is an ESPN event ID |
| `saveSquadPick(players)` | async fn | `PUT /api/entries/{id}/picks/squad` — `players` is `[{position, athleteId}]` |
| `saveFormation(formationId)` | async fn | Local state only (no backend call yet) |

On login, `EntryContext` fetches entries, picks for each entry, and score totals in parallel:
- `GET /api/entries`
- `GET /api/entries/{id}/picks` (for each entry)
- `GET /api/entries/scores` (score breakdown, falls back gracefully on failure)

## Rules for using context

1. **Never import context directly** — always use the custom hook (`useAuth()`, `useEntry()`)
2. **Don't put everything in context** — only truly global data belongs here; page-specific state stays in the page component
3. **Keep context lean** — context re-renders every consumer when it changes, so avoid rapidly-changing data
