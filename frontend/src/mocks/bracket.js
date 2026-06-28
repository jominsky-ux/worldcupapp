/**
 * src/mocks/bracket.js — Bracket Structure Constants
 * ====================================================
 * Defines ESPN event IDs and round metadata for the 2026 World Cup knockout
 * bracket. Team data is fetched live from GET /api/tournament/bracket
 * (backed by ESPN's events feed) — no mock team assignments live here.
 */

export const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'FINAL']

export const ROUND_LABELS = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarterfinals',
  SF: 'Semifinals',
  FINAL: 'Final',
}

// ESPN event IDs for each round in sequential bracket-position order.
// ESPN assigns event IDs in bracket order when building the schedule, so
// ascending ID order gives the correct visual top-to-bottom bracket layout.
// Sequential pairing: round[2j] + round[2j+1] → next round[j].
export const ROUND_MATCHUP_IDS = {
  R32: [
    '760486', '760487', '760488', '760489',  // bracket pos 1-4  (matches 73-76)
    '760490', '760491', '760492', '760493',  // bracket pos 5-8  (matches 77-80)
    '760494', '760495', '760496', '760497',  // bracket pos 9-12 (matches 81-84)
    '760498', '760499', '760500', '760501',  // bracket pos 13-16 (matches 85-88)
  ],
  R16: [
    '760502', '760503', '760504', '760505',  // matches 89-92 (top bracket)
    '760506', '760507', '760508', '760509',  // matches 93-96 (bottom bracket)
  ],
  QF:    ['760510', '760511', '760512', '760513'],  // matches 97-100
  SF:    ['760514', '760515'],                      // matches 101-102
  FINAL: ['760517'],                                // match 104 (760516 = 3rd place, excluded)
}

// Inverse lookup: ESPN event ID → round key (R32 / R16 / QF / SF / FINAL).
// Used by BracketPage for per-round point display and cascade logic.
export const MATCHUP_ROUND_KEY = Object.fromEntries(
  Object.entries(ROUND_MATCHUP_IDS).flatMap(([round, ids]) =>
    ids.map((id) => [id, round])
  )
)

// Actual knockout results — populated as matches complete.
// Keys are ESPN event IDs. Each entry: { winnerId, homeScore, awayScore }
// winnerId must be the ESPN team ID (string) of the winning team.
export const MOCK_KNOCKOUT_RESULTS = {}
