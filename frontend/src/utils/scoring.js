/**
 * src/utils/scoring.js — Scoring Calculation Utilities
 * ======================================================
 * Pure functions for computing points. Pure means they have no side
 * effects — given the same inputs they always return the same output.
 * This makes them easy to test and reason about.
 *
 * These functions run on the frontend for instant score display.
 * The backend also runs equivalent logic — the frontend calculation
 * is for UI responsiveness, the backend is the source of truth.
 */

import { GROUP_POINTS, BRACKET_POINTS_PER_ROUND } from '../mocks/entries'

/**
 * calculateGroupPoints
 * Computes points earned from group stage picks for one entry.
 *
 * @param {Array} userPicks   - array of { groupId, firstPlaceTeamId, secondPlaceTeamId }
 * @param {Array} actualResults - array of { groupId, firstPlaceTeamId, secondPlaceTeamId }
 * @returns {{ total: number, breakdown: Array }}
 */
export function calculateGroupPoints(userPicks, actualResults) {
  if (!actualResults?.length) return { total: 0, breakdown: [] }

  let total = 0
  const breakdown = []
  let allCorrect = true

  for (const pick of userPicks) {
    const actual = actualResults.find((r) => r.groupId === pick.groupId)
    if (!actual) { allCorrect = false; continue }

    let groupPoints = 0
    const correct = []

    if (pick.firstPlaceTeamId === actual.firstPlaceTeamId) {
      groupPoints += GROUP_POINTS.correctWinner
      correct.push('winner')
    } else {
      allCorrect = false
    }

    if (pick.secondPlaceTeamId === actual.secondPlaceTeamId) {
      groupPoints += GROUP_POINTS.correctRunnerUp
      correct.push('runner-up')
    } else {
      allCorrect = false
    }

    total += groupPoints
    breakdown.push({ groupId: pick.groupId, points: groupPoints, correct })
  }

  if (allCorrect && userPicks.length === 12) {
    total += GROUP_POINTS.allCorrectBonus
    breakdown.push({ groupId: 'BONUS', points: GROUP_POINTS.allCorrectBonus, correct: ['all'] })
  }

  return { total, breakdown }
}

/**
 * calculateBracketPoints
 * Computes points for bracket picks across all knockout rounds.
 *
 * @param {Array} userPicks   - array of { matchupId, winnerTeamId, round }
 * @param {Array} actualResults - array of { matchupId, winnerTeamId, round }
 * @returns {{ total: number, byRound: object }}
 */
export function calculateBracketPoints(userPicks, actualResults) {
  if (!actualResults?.length) return { total: 0, byRound: {} }

  let total = 0
  const byRound = {}

  for (const pick of userPicks) {
    const actual = actualResults.find((r) => r.matchupId === pick.matchupId)
    if (!actual) continue

    if (pick.winnerTeamId === actual.winnerTeamId) {
      const pts = BRACKET_POINTS_PER_ROUND[pick.round] ?? 0
      total += pts
      byRound[pick.round] = (byRound[pick.round] ?? 0) + pts
    }
  }

  return { total, byRound }
}

/**
 * formatPoints
 * Formats a points number for display, e.g. 0 → "0", 142 → "142"
 * Always returns a string with the unit label.
 */
export function formatPoints(pts) {
  return `${pts ?? 0} pts`
}

/**
 * getPositionColor
 * Returns a Tailwind color class string for a given FPL position.
 * Used consistently across PlayerCard and position badges.
 */
export function getPositionColor(position) {
  const map = {
    GK:  'bg-amber-100 text-amber-800',
    DEF: 'bg-blue-100 text-blue-800',
    MID: 'bg-green-100 text-green-800',
    FWD: 'bg-red-100 text-red-800',
  }
  return map[position] ?? 'bg-gray-100 text-gray-800'
}
