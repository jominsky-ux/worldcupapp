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

// ESPN event IDs ordered by bracket position (top-to-bottom visual layout).
// Sequential pairing: round[2j] + round[2j+1] → next round[j].
// IDs are chronological by match date, NOT by bracket slot — ordering here
// was derived from the ESPN bracket draw.
export const ROUND_MATCHUP_IDS = {
  R32: [
    '760488', '760491', '760486', '760489',  // GER/PAR, FRA/SWE, RSA/CAN, NED/MAR → QF 7/9
    '760487', '760490', '760492', '760493',  // BRA/JPN, CIV/NOR, MEX/ECU, ENG/CGO → QF 7/11 (5pm)
    '760497', '760496', '760495', '760494',  // POR/CRO, ESP/AUT, USA/BIH, BEL/SEN → QF 7/10
    '760500', '760499', '760498', '760501',  // ARG/CPV, AUS/EGY, SUI/ALG, COL/GHA → QF 7/11 (9pm)
  ],
  R16: [
    '760503', '760502', '760504', '760505',  // GER/FRA winner, RSA/NED winner, BRA/CIV winner, MEX/ENG winner
    '760506', '760507', '760508', '760509',  // POR/ESP winner, USA/BEL winner, ARG/AUS winner, SUI/COL winner
  ],
  QF:    ['760510', '760512', '760511', '760513'],  // QF 7/9, QF 7/11 5pm, QF 7/10, QF 7/11 9pm
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
