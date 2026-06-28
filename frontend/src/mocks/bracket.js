/**
 * src/mocks/bracket.js — Mock Round of 32 Bracket
 * =================================================
 * Represents the 16 R32 matchups after the group stage concludes.
 * Matchup IDs are real ESPN event IDs from the 2026 World Cup schedule
 * (GET /v2/sports/soccer/leagues/fifa.world/events?season=2026).
 *
 * Replace MOCK_R32_MATCHUPS with a real API call once the backend exposes
 * GET /api/tournament/bracket.
 */

import { getTeamById } from './teams'

export const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'FINAL']

export const ROUND_LABELS = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarterfinals',
  SF: 'Semifinals',
  FINAL: 'Final',
}

// ESPN event IDs for each round, in visual top-to-bottom bracket order.
// Sequential pairing: round[2j] + round[2j+1] → next round[j].
// QF is ordered [97, 99, 98, 100] (by match#) so R16→QF pairing is correct.
export const ROUND_MATCHUP_IDS = {
  R32: [
    '760486', '760489', '760488', '760487',  // bracket pos 1-4  (matches 73-76)
    '760492', '760490', '760491', '760495',  // bracket pos 5-8  (matches 77-80)
    '760494', '760493', '760496', '760497',  // bracket pos 9-12 (matches 81-84)
    '760498', '760500', '760501', '760499',  // bracket pos 13-16 (matches 85-88)
  ],
  R16: [
    '760503', '760502', '760504', '760505',  // matches 89-92 (top bracket)
    '760506', '760507', '760509', '760508',  // matches 93-96 (bottom bracket)
  ],
  QF: [
    '760510', '760512', '760511', '760513',  // matches 97, 99, 98, 100 (reordered for correct R16→QF pairing)
  ],
  SF:    ['760514', '760515'],  // matches 101-102
  FINAL: ['760517'],            // match 104 (760516 = 3rd place, excluded)
}

// Inverse lookup: ESPN event ID → round key (R32 / R16 / QF / SF / FINAL).
// Used by BracketPage for per-round point display and cascade logic.
export const MATCHUP_ROUND_KEY = Object.fromEntries(
  Object.entries(ROUND_MATCHUP_IDS).flatMap(([round, ids]) =>
    ids.map((id) => [id, round])
  )
)

// 16 R32 matchups — top half (index 0–7) and bottom half (8–15).
// id values are the ESPN event IDs that will be stored in the database.
export const MOCK_R32_MATCHUPS = [
  // ── Top half ──────────────────────────────────────────────────────────────
  { id: '760486', home: getTeamById(1),  away: getTeamById(8)  }, // Mexico      vs Switzerland
  { id: '760489', home: getTeamById(9),  away: getTeamById(16) }, // Brazil      vs Türkiye
  { id: '760488', home: getTeamById(17), away: getTeamById(22) }, // Germany     vs Japan
  { id: '760487', home: getTeamById(21), away: getTeamById(20) }, // Netherlands vs Ecuador
  { id: '760492', home: getTeamById(25), away: getTeamById(32) }, // Belgium     vs Uruguay
  { id: '760490', home: getTeamById(29), away: getTeamById(26) }, // Spain       vs Egypt
  { id: '760491', home: getTeamById(33), away: getTeamById(40) }, // France      vs Austria
  { id: '760495', home: getTeamById(37), away: getTeamById(34) }, // Argentina   vs Senegal
  // ── Bottom half ───────────────────────────────────────────────────────────
  { id: '760494', home: getTeamById(3),  away: getTeamById(5)  }, // South Korea vs Canada
  { id: '760493', home: getTeamById(13), away: getTeamById(10) }, // USA         vs Morocco
  { id: '760496', home: getTeamById(23), away: getTeamById(19) }, // Sweden      vs Ivory Coast
  { id: '760497', home: getTeamById(41), away: getTeamById(46) }, // Portugal    vs Croatia
  { id: '760498', home: getTeamById(27), away: getTeamById(36) }, // Iran        vs Norway
  { id: '760500', home: getTeamById(45), away: getTeamById(42) }, // England     vs Colombia
  { id: '760501', home: getTeamById(15), away: getTeamById(38) }, // Australia   vs Algeria
  { id: '760499', home: getTeamById(14), away: getTeamById(24) }, // Paraguay    vs Tunisia
]

// Pre-built team lookup for resolving winnerTeamId (from saved bracketPicks) back
// to a full team object. Built once at module load time from the static R32 data.
export const BRACKET_TEAM_LOOKUP = new Map(
  MOCK_R32_MATCHUPS.flatMap((m) => [
    [String(m.home.id), m.home],
    [String(m.away.id), m.away],
  ])
)

// Actual knockout results — populated as matches complete.
// Keys are ESPN event IDs. Each entry: { winnerId, homeScore, awayScore }
// winnerId must be the ESPN team ID (string) of the winning team.
export const MOCK_KNOCKOUT_RESULTS = {}
