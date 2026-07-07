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

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

// ─── Phase mapping ─────────────────────────────────────────────────────────
// groupPicksOpen → PRE_TOURNAMENT (group picks still available)
// bracketPicksOpen → PRE_KNOCKOUT (group stage over, bracket picks window open)
// espnPhase === 'group' → GROUP_STAGE (group stage in progress)
// otherwise → KNOCKOUT (R32 or later round underway)
function mapPhase(groupPicksOpen, bracketPicksOpen, espnPhase) {
  if (groupPicksOpen) return 'PRE_TOURNAMENT'
  if (bracketPicksOpen) return 'PRE_KNOCKOUT'
  if (espnPhase === 'group') return 'GROUP_STAGE'
  return 'KNOCKOUT'
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
        phase: mapPhase(data.groupPicksOpen, data.bracketPicksOpen, data.phase),
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
// BRACKET MATCHUPS — LIVE
// ══════════════════════════════════════════════════════════════════════════

/**
 * useBracketMatchups — fetches all 31 knockout matchups (R32 through Final) with real
 * team data and live results from ESPN. Source: GET /api/tournament/bracket
 * Teams are normalised to the same shape ({code, flagUrl, ...}) that BracketPage expects.
 */
export function useBracketMatchups() {
  return useQuery({
    queryKey: ['bracketMatchups'],
    queryFn: () =>
      apiClient.get('/api/tournament/bracket').then((res) =>
        res.data.map((m) => ({
          id: m.id,
          home: m.homeTeam ? normalizeTeam(m.homeTeam) : null,
          away: m.awayTeam ? normalizeTeam(m.awayTeam) : null,
          homeScore: m.homeScore ?? null,
          awayScore: m.awayScore ?? null,
          winnerId: m.winnerId ?? null,
        }))
      ),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
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
// PLAYER POINTS — LIVE
// ══════════════════════════════════════════════════════════════════════════

/**
 * usePlayerPoints — fetches total fantasy points for every athlete.
 * Source: GET /api/players/points (aggregated from player_match_stats table)
 * Returns a Map<athleteId, totalPoints> for O(1) lookup in the squad page.
 */
export function usePlayerPoints() {
  return useQuery({
    queryKey: ['playerPoints'],
    queryFn: () =>
      apiClient.get('/api/players/points').then((res) => {
        const map = new Map()
        for (const { athleteId, totalPoints } of res.data) {
          map.set(athleteId, totalPoints)
        }
        return map
      }),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// PLAYER MATCH HISTORY — LIVE
// ══════════════════════════════════════════════════════════════════════════

/**
 * usePlayerMatchHistory — fetches per-game fantasy stats for one athlete.
 * Source: GET /api/players/{athleteId}/matches (player_match_stats table,
 * with opponent name/abbreviation resolved on the backend)
 * Disabled when no athleteId is provided.
 *
 * @param {string|null} athleteId
 */
export function usePlayerMatchHistory(athleteId) {
  return useQuery({
    queryKey: ['playerMatchHistory', athleteId],
    queryFn: () =>
      apiClient.get(`/api/players/${athleteId}/matches`).then((res) => res.data),
    enabled: !!athleteId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// LEADERBOARD — LIVE
// ══════════════════════════════════════════════════════════════════════════

/**
 * useLeaderboard — fetches the ranked list of all users by total points.
 * Source: GET /api/leaderboard (publicly accessible, no auth required)
 * Refreshes every 2 minutes during live matches.
 */
export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () =>
      apiClient.get('/api/leaderboard').then((res) =>
        res.data.map((row) => ({
          rank: row.rank,
          username: row.displayName,
          email: row.email,
          entryId: row.entryId,
          entryNumber: row.entryNumber,
          entryName: row.entryName,
          totalPoints: row.totalPoints,
        }))
      ),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  })
}

/**
 * useEntryDetail — fetches the points breakdown and squad roster for a
 * single entry, for the leaderboard's "view entry" modal.
 * Source: GET /api/leaderboard/entries/{entryId} (publicly accessible)
 */
export function useEntryDetail(entryId) {
  return useQuery({
    queryKey: ['entryDetail', entryId],
    queryFn: () =>
      apiClient.get(`/api/leaderboard/entries/${entryId}`).then((res) => res.data),
    enabled: !!entryId,
    staleTime: 1000 * 60 * 2,
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
