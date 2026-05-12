/**
 * src/hooks/useGameData.js — React Query Data Hooks
 * ===================================================
 * Custom hooks that fetch data for the app using React Query (TanStack Query).
 *
 * LIVE vs MOCK:
 *   Hooks marked "LIVE" call the Spring Boot backend via the shared axios
 *   instance in src/api/client.js. The Vite proxy (vite.config.js) forwards
 *   /api/* to localhost:8080 during local development.
 *
 *   Hooks marked "MOCK" still return local data because the corresponding
 *   backend endpoints have not been implemented yet.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { MOCK_LEADERBOARD, DEADLINES } from '../mocks/entries'

// Simulated delay — used only by hooks that are still on mock data.
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

// ─── Phase mapping ─────────────────────────────────────────────────────────
// The backend derives a phase string from ESPN's season type.
// Map it to the internal phase constants the rest of the app uses.
const ESPN_PHASE_MAP = {
  group: 'GROUP_STAGE',
  knockout: 'KNOCKOUT',
}
function mapPhase(espnPhase) {
  return ESPN_PHASE_MAP[espnPhase] ?? 'PRE_TOURNAMENT'
}

// ─── Field normalisation ───────────────────────────────────────────────────
// ESPN returns team fields named `abbreviation` and `logoUrl`.
// GroupCard and other components were built against the mock shape that uses
// `code` and `flagUrl`. Normalise here so no component changes are needed.
// fifaRank and flagEmoji are not available from ESPN; they default to safe values.
function normalizeTeam(team) {
  return {
    ...team,
    code: team.abbreviation,
    flagUrl: team.logoUrl,
    flagEmoji: '',
    fifaRank: 0,
  }
}

// ─── Athlete normalisation ─────────────────────────────────────────────────
// ESPN returns full position names; map them to the four abbreviations that
// POSITION_CONFIG and SquadPage expect. Unknown values fall back to 'MID'.
const ESPN_POSITION_MAP = {
  Goalkeeper: 'GK',
  Defender: 'DEF',
  Midfielder: 'MID',
  Forward: 'FWD',
  Attacker: 'FWD',
}

function normalizeAthlete(athlete) {
  return {
    id: athlete.id,
    name: athlete.name,
    position: ESPN_POSITION_MAP[athlete.position] ?? 'MID',
    teamId: athlete.team?.id,
    teamCode: athlete.team?.name,
    club: '',   // not in ESPN athlete data
    age: null,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  }
}

function normalizeGroup(group) {
  return {
    ...group,
    teams: group.teams.map(normalizeTeam),
  }
}

// ══════════════════════════════════════════════════════════════════════════
// GROUPS — LIVE
// ══════════════════════════════════════════════════════════════════════════

/**
 * useGroups — fetches all 12 World Cup groups with their 4 teams each.
 * Source: GET /api/groups (ESPN standings endpoint, cached 5 min on backend)
 * Used by: GroupStagePage, GroupCard
 */
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () =>
      apiClient.get('/api/groups').then((res) => res.data.map(normalizeGroup)),
    staleTime: 1000 * 60 * 60, // groups don't change during the tournament
  })
}

// ══════════════════════════════════════════════════════════════════════════
// STANDINGS — LIVE
// ══════════════════════════════════════════════════════════════════════════

/**
 * useStandings — fetches current group-stage standings for all 12 groups.
 * Source: GET /api/standings (ESPN standings, cached 5 min on backend)
 * Used by: StandingsPage (when built), GroupStagePage live results view
 */
export function useStandings() {
  return useQuery({
    queryKey: ['standings'],
    queryFn: () => apiClient.get('/api/standings').then((res) => res.data),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// SCOREBOARD — LIVE
// ══════════════════════════════════════════════════════════════════════════

/**
 * useScoreboard — fetches the match scoreboard (scheduled, live, completed).
 * Source: GET /api/matches (ESPN scoreboard, cached 1 min on backend)
 * The eventId from each match can be passed to useMatchSummary for goal detail.
 */
export function useScoreboard() {
  return useQuery({
    queryKey: ['scoreboard'],
    queryFn: () => apiClient.get('/api/matches').then((res) => res.data),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// MATCH SUMMARY — LIVE
// ══════════════════════════════════════════════════════════════════════════

/**
 * useMatchSummary — fetches goals and assists for a specific match.
 * Source: GET /api/matches/{eventId}/summary (ESPN summary, cached 5 min on backend)
 * The query is disabled when no eventId is provided so callers can pass
 * a conditional eventId without guarding the hook call.
 *
 * @param {string|null} eventId  ESPN event identifier from the scoreboard
 */
export function useMatchSummary(eventId) {
  return useQuery({
    queryKey: ['matchSummary', eventId],
    queryFn: () =>
      apiClient.get(`/api/matches/${eventId}/summary`).then((res) => res.data),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// TOURNAMENT PHASE & DEADLINES — LIVE (phase) + LOCAL (deadlines)
// ══════════════════════════════════════════════════════════════════════════

/**
 * useTournamentInfo — fetches current phase and live-match status.
 * Source: GET /api/tournament/status for live phase data;
 *         DEADLINES constant for fixed cut-off timestamps (not yet on backend).
 * Used by: CountdownBanner, PhaseGate, Layout
 */
export function useTournamentInfo() {
  return useQuery({
    queryKey: ['tournament'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/tournament/status')
      return {
        phase: mapPhase(data.phase),
        hasLiveMatches: data.hasLiveMatches,
        nextMatchDate: data.nextMatchDate,
        deadlines: {
          groupPicksLock: data.groupStageFirstGameTime,
          bracketPicksLock: data.roundOf32FirstGameTime,
        },
        groupPicksOpen: data.groupPicksOpen,
        bracketPicksOpen: data.bracketPicksOpen,
        currentRound: null,
      }
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// PLAYERS — LIVE
// ══════════════════════════════════════════════════════════════════════════

/**
 * usePlayers — fetches all athletes eligible for squad selection.
 * Source: GET /api/teams/athletes (ESPN roster data, normalised on the way in)
 *
 * The full list is cached under the key ['athletes']. Filtering is done
 * client-side via React Query's `select` option so multiple callers with
 * different filters share a single HTTP request.
 *
 * @param {object} filters  { position?: 'GK'|'DEF'|'MID'|'FWD', search?: string }
 */
export function usePlayers(filters = {}) {
  return useQuery({
    queryKey: ['athletes'],
    queryFn: () =>
      apiClient.get('/api/teams/athletes').then((res) => res.data.map(normalizeAthlete)),
    staleTime: 1000 * 60 * 60,
    select: (data) => {
      let result = data
      if (filters.position) {
        result = result.filter((p) => p.position === filters.position)
      }
      if (filters.teamId) {
        result = result.filter((p) => p.teamId === filters.teamId)
      }
      if (filters.search) {
        const q = filters.search.toLowerCase()
        result = result.filter((p) => p.name.toLowerCase().includes(q))
      }
      return result
    },
  })
}

// ══════════════════════════════════════════════════════════════════════════
// LEADERBOARD — MOCK (no backend endpoint yet)
// ══════════════════════════════════════════════════════════════════════════

/**
 * useLeaderboard — fetches the ranked list of all users by total points.
 * Still uses mock data; replace queryFn body with:
 *   apiClient.get('/api/leaderboard').then(r => r.data)
 * when the backend endpoint is ready.
 */
export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      await delay(400)
      return MOCK_LEADERBOARD
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// MUTATIONS — MOCK (no backend entry endpoints yet)
// ══════════════════════════════════════════════════════════════════════════

/**
 * useSaveGroupPicks — saves a user's 1st/2nd place picks for one group.
 * Still uses mock; replace mutationFn body with:
 *   apiClient.post(`/api/entries/${entryId}/group-picks`, payload).then(r => r.data)
 * when the backend endpoint is ready.
 */
export function useSaveGroupPicks(entryId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ groupId, firstTeamId, secondTeamId }) => {
      await delay(300)
      return { groupId, firstTeamId, secondTeamId, saved: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', entryId] })
    },
  })
}
