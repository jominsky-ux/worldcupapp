# src/context/ — Global State Providers

React Context is used here to share data between components without having to pass props through every level of the component tree ("prop drilling").

## AuthContext.jsx

Manages who is logged in. Any component can call `useAuth()` to get:
- `user` — the logged-in user object `{ id, email, username }`
- `token` — the JWT used to authenticate API requests
- `isLoggedIn` — boolean shortcut
- `login(email, password)` — async, throws on failure
- `register(email, password, username)` — async, throws on failure  
- `logout()` — clears state and localStorage

The JWT is stored in `localStorage` so it survives page refreshes. In production, the token is included in every API request via an axios interceptor (to be added when the backend is ready).

## EntryContext.jsx

Manages the user's fantasy entries. Any component can call `useEntry()` to get:
- `entries` — array of all entries (up to 3)
- `activeEntry` — the currently selected entry object
- `activeEntryId` / `setActiveEntryId` — switch which entry is being viewed/edited
- `phase` — current tournament phase string
- `createEntry(name)` — create a new entry
- `saveGroupPick(groupId, firstId, secondId)` — save a group pick
- `saveSquadPick(playerIds)` — save the 11-player squad
- `saveBracketPick(matchupId, winnerId)` — save a bracket pick

## Rules for using context

1. **Never import context directly** — always use the custom hook (`useAuth()` not `useContext(AuthContext)`)
2. **Don't put everything in context** — only truly global data belongs here. Page-specific state should stay in the page component
3. **Keep context lean** — context re-renders every consumer when it changes, so avoid putting rapidly-changing data here
