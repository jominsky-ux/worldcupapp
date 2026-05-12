/**
 * src/mocks/bracket.js — Mock Round of 32 Bracket
 * =================================================
 * Represents the 16 R32 matchups after the group stage concludes.
 * Teams are drawn from the 48-team group stage (12 winners, 12 runners-up,
 * 8 best third-place finishers).
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

// 16 R32 matchups — top half (0–7) and bottom half (8–15).
// The winner of match N feeds into slot ⌊N/2⌋ of the next round.
export const MOCK_R32_MATCHUPS = [
  // ── Top half ──────────────────────────────────────────────────────────────
  { id: 'R32-0',  home: getTeamById(1),  away: getTeamById(8)  }, // Mexico      vs Switzerland
  { id: 'R32-1',  home: getTeamById(9),  away: getTeamById(16) }, // Brazil      vs Türkiye
  { id: 'R32-2',  home: getTeamById(17), away: getTeamById(22) }, // Germany     vs Japan
  { id: 'R32-3',  home: getTeamById(21), away: getTeamById(20) }, // Netherlands vs Ecuador
  { id: 'R32-4',  home: getTeamById(25), away: getTeamById(32) }, // Belgium     vs Uruguay
  { id: 'R32-5',  home: getTeamById(29), away: getTeamById(26) }, // Spain       vs Egypt
  { id: 'R32-6',  home: getTeamById(33), away: getTeamById(40) }, // France      vs Austria
  { id: 'R32-7',  home: getTeamById(37), away: getTeamById(34) }, // Argentina   vs Senegal
  // ── Bottom half ───────────────────────────────────────────────────────────
  { id: 'R32-8',  home: getTeamById(3),  away: getTeamById(5)  }, // South Korea vs Canada
  { id: 'R32-9',  home: getTeamById(13), away: getTeamById(10) }, // USA         vs Morocco
  { id: 'R32-10', home: getTeamById(23), away: getTeamById(19) }, // Sweden      vs Ivory Coast
  { id: 'R32-11', home: getTeamById(41), away: getTeamById(46) }, // Portugal    vs Croatia
  { id: 'R32-12', home: getTeamById(27), away: getTeamById(36) }, // Iran        vs Norway
  { id: 'R32-13', home: getTeamById(45), away: getTeamById(42) }, // England     vs Colombia
  { id: 'R32-14', home: getTeamById(15), away: getTeamById(38) }, // Australia   vs Algeria
  { id: 'R32-15', home: getTeamById(14), away: getTeamById(24) }, // Paraguay    vs Tunisia
]

// Pre-built team lookup for resolving winnerTeamId (from saved bracketPicks) back
// to a full team object. Built once at module load time from the static R32 data.
export const BRACKET_TEAM_LOOKUP = new Map(
  MOCK_R32_MATCHUPS.flatMap((m) => [
    [String(m.home.id), m.home],
    [String(m.away.id), m.away],
  ])
)

// Mock actual results for the KNOCKOUT phase — maps matchupId → winning team id.
// Replace with real API data (GET /api/tournament/bracket) when available.
export const MOCK_KNOCKOUT_RESULTS = {
  // Round of 32
  'R32-0': 1,   // Mexico beats Switzerland
  'R32-1': 9,   // Brazil beats Türkiye
  'R32-2': 17,  // Germany beats Japan
  'R32-3': 21,  // Netherlands beats Ecuador
  'R32-4': 25,  // Belgium beats Uruguay
  'R32-5': 29,  // Spain beats Egypt
  'R32-6': 33,  // France beats Austria
  'R32-7': 37,  // Argentina beats Senegal
  'R32-8': 3,   // South Korea beats Canada
  'R32-9': 13,  // USA beats Morocco
  'R32-10': 19, // Ivory Coast beats Sweden
  'R32-11': 41, // Portugal beats Croatia
  'R32-12': 36, // Norway beats Iran
  'R32-13': 45, // England beats Colombia
  'R32-14': 15, // Australia beats Algeria
  'R32-15': 14, // Paraguay beats Tunisia
  // Round of 16
  'R16-0': 9,   // Brazil beats Mexico
  'R16-1': 21,  // Netherlands beats Germany
  'R16-2': 29,  // Spain beats Belgium
  'R16-3': 33,  // France beats Argentina
  'R16-4': 13,  // USA beats South Korea
  'R16-5': 41,  // Portugal beats Ivory Coast
  'R16-6': 45,  // England beats Norway
  'R16-7': 15,  // Australia beats Paraguay
  // Quarterfinals
  'QF-0': 9,    // Brazil beats Netherlands
  'QF-1': 33,   // France beats Spain
  'QF-2': 41,   // Portugal beats USA
  'QF-3': 45,   // England beats Australia
  // Semifinals
  'SF-0': 33,   // France beats Brazil
  'SF-1': 45,   // England beats Portugal
  // Final
  'FINAL-0': 33, // France beats England
}
