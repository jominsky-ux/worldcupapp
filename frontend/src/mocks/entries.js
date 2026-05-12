/**
 * src/mocks/entries.js — Mock User Entry Data
 * =============================================
 * This file simulates what the backend returns for a logged-in user's
 * fantasy entries. A user can have up to 3 separate entries, each with
 * its own group picks, bracket picks, and squad of 11 players based on formation.
 *
 * ENTRY LIFECYCLE:
 *   1. User creates an entry (name it anything, e.g. "My Main Team")
 *   2. Before tournament kickoff → user submits group stage picks + formation + squad
 *   3. After group stage ends → user receives email notification
 *   4. User logs in and submits bracket (locked at R32 kickoff)
 *   5. Points accumulate automatically as matches are played
 *
 * SCORING OVERVIEW:
 *
 *   GROUP STAGE (bracket points):
 *     Correct group winner:      +5 pts
 *     Correct group runner-up:   +3 pts
 *     All 24 correct (12 groups × 2): +20 bonus pts
 *
 *   KNOCKOUT BRACKET (ESPN March Madness style):
 *     Round of 32 (R32):  1 pt per correct pick
 *     Round of 16 (R16):  2 pts per correct pick
 *     Quarterfinal (QF):  4 pts per correct pick
 *     Semifinal (SF):     8 pts per correct pick
 *     Final:             16 pts per correct pick
 *     Champion:          32 pts for correct winner
 *
 *   PLAYER POINTS (FPL system — see players.js for full breakdown)
 */

import { GROUPS } from './teams'
import { PLAYERS } from './players'

// ── Tournament phase state ─────────────────────────────────────────────────
// In production this comes from the backend/scheduler.
// Change this value to simulate different tournament phases during development:
//   'PRE_TOURNAMENT'  — group picks open, player/bracket picks locked
//   'GROUP_STAGE'     — group picks locked, tournament underway
//   'PRE_KNOCKOUT'    — group stage over, bracket/player picks now open
//   'KNOCKOUT'        — all picks locked, scoring live
export const MOCK_PHASE = 'KNOCKOUT'

// Deadlines (ISO strings) — will come from backend in production
export const DEADLINES = {
  groupPicksLock: '2026-06-11T18:00:00Z', // tournament kickoff
  bracketPicksLock: '2026-07-02T18:00:00Z', // Round of 32 kickoff (estimated)
}

// ── Mock user entries ──────────────────────────────────────────────────────
export const MOCK_ENTRIES = [
  {
    id: 'entry-1',
    name: 'My Main Squad',
    userId: 'user-1',
    createdAt: '2026-03-01T10:00:00Z',
    totalPoints: 0,

    // GROUP PICKS: for each group, the user picks 1st and 2nd place
    // null means the user hasn't made that pick yet
    groupPicks: GROUPS.map((group) => ({
      groupId: group.id,
      firstPlaceTeamId: null,   // user picks team they think wins the group
      secondPlaceTeamId: null,  // user picks team they think finishes 2nd
    })),

    // THIRD PLACE PICKS: users pick 8 third-place teams across all 12 groups.
    // In 2026, the best 8 third-place finishers advance to the Round of 32.
    // Each correct pick is worth +1 point.
    // thirdPlaceTeamIds is an array of up to 8 team IDs.
    thirdPlaceTeamIds: [],

    // BRACKET PICKS: user picks the winner of each R32 matchup
    // Matchups are set after the group stage concludes
    bracketPicks: [],

    // FORMATION + SQUAD: user picks a formation then selects 11 players
    formation: null,
    squadPicks: [],
  },
]

// ── Scoring reference ──────────────────────────────────────────────────────
export const BRACKET_POINTS_PER_ROUND = {
  R32: 4,
  R16: 8,
  QF: 16,
  SF: 32,
  FINAL: 64,
  WINNER: 128,
}

export const GROUP_POINTS = {
  correctWinner: 4,
  correctRunnerUp: 2,
  allCorrectBonus: 20,
  correctThirdPlace: 1,      // per correct 3rd-place pick (8 picks allowed)
  allThirdPlaceBonus: 10,    // bonus for all 8 3rd-place picks correct
}

// How many 3rd-place teams the user may pick
export const MAX_THIRD_PLACE_PICKS = 8

// ── Lineup formations ─────────────────────────────────────────────────────
// Users must pick one formation; it defines the per-position player limits.
// GK is always 1; the id is the conventional DEF-MID-FWD notation.
export const FORMATIONS = [
  { id: '3-5-2', def: 3, mid: 5, fwd: 2 },
  { id: '3-4-3', def: 3, mid: 4, fwd: 3 },
  { id: '4-5-1', def: 4, mid: 5, fwd: 1 },
  { id: '4-4-2', def: 4, mid: 4, fwd: 2 },
  { id: '4-3-3', def: 4, mid: 3, fwd: 3 },
  { id: '5-4-1', def: 5, mid: 4, fwd: 1 },
  { id: '5-3-2', def: 5, mid: 3, fwd: 2 },
  { id: '5-2-3', def: 5, mid: 2, fwd: 3 },
]

// ── Squad composition rules ───────────────────────────────────────────────
// 11 players: 1 GK + formation-defined DEF/MID/FWD slots.
export const SQUAD_RULES = {
  total: 11,
}

// ── Mock leaderboard data ─────────────────────────────────────────────────
export const MOCK_LEADERBOARD = [
  { rank: 1, username: 'WorldCupWizard', totalPoints: 0, entries: 3 },
  { rank: 2, username: 'GoalMaster99', totalPoints: 0, entries: 2 },
  { rank: 3, username: 'TacticsTom', totalPoints: 0, entries: 3 },
  { rank: 4, username: 'FantasyFelipe', totalPoints: 0, entries: 1 },
  { rank: 5, username: 'BracketBoss', totalPoints: 0, entries: 3 },
]
