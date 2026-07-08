/**
 * src/pages/BracketPage.jsx — Knockout Bracket Picker
 * =====================================================
 * Renders a horizontal bracket tree for all 5 knockout rounds.
 * Users click a team in any matchup to pick the winner; later-round
 * matchup slots are populated as earlier picks are made.
 *
 * BRACKET STRUCTURE (2026 World Cup):
 *   Round of 32  — 16 matches → 16 advance
 *   Round of 16  — 8 matches  → 8 advance
 *   Quarterfinals — 4 matches → 4 advance
 *   Semifinals   — 2 matches  → 2 advance
 *   Final        — 1 match    → Champion
 *
 * CASCADING PICKS:
 * Changing a pick clears any downstream picks that depended on the
 * previously chosen team, since that team can no longer reach later rounds.
 *
 * SCORING:
 *   R32: +1 · R16: +2 · QF: +4 · SF: +8 · Final: +16 · Champion: +32
 */

import { useState, useMemo, useCallback, useEffect, Fragment } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useEntry } from '../context/EntryContext'
import { PhaseGate } from '../components/shared/SharedComponents'
import { ROUND_ORDER, ROUND_LABELS, ROUND_MATCHUP_IDS, MATCHUP_ROUND_KEY } from '../mocks/bracket'
import { BRACKET_POINTS_PER_ROUND } from '../mocks/entries'
import { useBracketMatchups, useEntryDetail } from '../hooks/useGameData'

// ── Layout constants ───────────────────────────────────────────────────────
// Each R32 matchup card occupies CARD_H px. SLOT is the repeating unit
// (card + gap) used to compute per-round vertical offsets.
const CARD_H = 72
const SLOT = 80   // CARD_H + 8px gap

// ── Helpers ────────────────────────────────────────────────────────────────

function buildTeamLookup(r32Matchups) {
  return new Map(
    r32Matchups.flatMap((m) => [
      m.home ? [String(m.home.id), m.home] : null,
      m.away ? [String(m.away.id), m.away] : null,
    ].filter(Boolean))
  )
}

function buildPicksMap(bracketPicks, teamLookup) {
  const map = {}
  for (const p of bracketPicks ?? []) {
    const team = teamLookup.get(String(p.winnerTeamId))
    if (team) map[p.matchupId] = team
  }
  return map
}

// Mutates `picks` (a copy) — clears any downstream pick that depended on
// `clearedTeam`, then recurses to clear further downstream picks.
// Uses ROUND_MATCHUP_IDS to look up parent matchup by sequential position.
function cascadeClear(picks, matchupId, clearedTeam) {
  let roundIdx = -1, index = -1
  for (let r = 0; r < ROUND_ORDER.length; r++) {
    const idx = ROUND_MATCHUP_IDS[ROUND_ORDER[r]].indexOf(matchupId)
    if (idx !== -1) { roundIdx = r; index = idx; break }
  }
  if (roundIdx < 0 || roundIdx >= ROUND_ORDER.length - 1) return

  const parentId = ROUND_MATCHUP_IDS[ROUND_ORDER[roundIdx + 1]][Math.floor(index / 2)]
  if (picks[parentId]?.id === clearedTeam.id) {
    const parentTeam = picks[parentId]
    delete picks[parentId]
    cascadeClear(picks, parentId, parentTeam)
  }
}

// ── Page component ─────────────────────────────────────────────────────────

export default function BracketPage() {
  const { entries, activeEntry, activeEntryId, setActiveEntryId, saveBracketPick, phase } = useEntry()
  const [searchParams] = useSearchParams()
  const viewEntryId = searchParams.get('viewEntry')
  const { data: viewedEntry } = useEntryDetail(viewEntryId)
  const isReadOnly = phase === 'KNOCKOUT' || !!viewEntryId

  const { data: liveMatchups, isLoading: matchupsLoading } = useBracketMatchups()

  // Build a results map from live matchup data (only populated for completed games).
  // Only shown when picks are locked (KNOCKOUT phase) so scores don't spoil open picks.
  const results = useMemo(() => {
    if (!isReadOnly || !liveMatchups?.length) return {}
    const map = {}
    for (const m of liveMatchups) {
      if (m.winnerId) {
        map[m.id] = { winnerId: m.winnerId, homeScore: m.homeScore, awayScore: m.awayScore, homePenaltyScore: m.homePenaltyScore, awayPenaltyScore: m.awayPenaltyScore }
      }
    }
    return map
  }, [isReadOnly, liveMatchups])

  // Index all live matchups by ID for O(1) lookup in derivedMatchups.
  const allMatchupsById = useMemo(() => {
    if (!liveMatchups?.length) return new Map()
    return new Map(liveMatchups.map((m) => [String(m.id), m]))
  }, [liveMatchups])

  // Reorder API results to match ROUND_MATCHUP_IDS.R32 bracket positions.
  // ESPN returns events in chronological order, not bracket-slot order.
  const r32Matchups = useMemo(() => {
    if (!liveMatchups?.length) return []
    return ROUND_MATCHUP_IDS.R32.map((id) => allMatchupsById.get(id)).filter(Boolean)
  }, [liveMatchups, allMatchupsById])

  const teamLookup = useMemo(() => buildTeamLookup(r32Matchups), [r32Matchups])

  const [picks, setPicks] = useState(() => buildPicksMap(activeEntry?.bracketPicks, teamLookup))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!viewEntryId) {
      setPicks(buildPicksMap(activeEntry?.bracketPicks, teamLookup))
      setError(null)
    }
  }, [activeEntry?.id, teamLookup, viewEntryId])

  useEffect(() => {
    if (viewEntryId && viewedEntry) {
      setPicks(buildPicksMap(viewedEntry.bracketPicks, teamLookup))
    }
  }, [viewEntryId, viewedEntry, teamLookup])

  // Derive matchup objects for every round from R32 + picks.
  // For completed R16+ games, show the actual ESPN teams (with flags and scores)
  // placed in bracket-position order (winner of prev[2j] → top slot, prev[2j+1]
  // → bottom slot). If the actual team differs from the user's pick for that slot,
  // the pick's abbreviation is shown in parentheses inside the card.
  // For unplayed games, picks fill the slots as the predicted path.
  // IDs come from ROUND_MATCHUP_IDS; sequential pairing (prev[2j]+prev[2j+1] → current[j]).
  const derivedMatchups = useMemo(() => {
    const byRound = { R32: r32Matchups }
    for (let i = 1; i < ROUND_ORDER.length; i++) {
      const round = ROUND_ORDER[i]
      const prev = byRound[ROUND_ORDER[i - 1]]
      const ids = ROUND_MATCHUP_IDS[round]
      byRound[round] = Array.from({ length: prev.length / 2 }, (_, j) => {
        const id = ids[j]
        const prevHomeId = prev[2 * j].id
        const prevAwayId = prev[2 * j + 1].id
        const gameResult = results[id]
        const liveMatchup = allMatchupsById.get(id)

        if (gameResult && liveMatchup?.home?.id && liveMatchup?.away?.id) {
          // Game is complete. Place teams in bracket-position order:
          // top slot = winner of the previous home-side game (prev[2j]).
          const prevHomeWinnerId = results[prevHomeId]?.winnerId
          const espnHomeIsBracketHome = prevHomeWinnerId
            && String(liveMatchup.home.id) === String(prevHomeWinnerId)
          const espnAwayIsBracketHome = prevHomeWinnerId
            && String(liveMatchup.away.id) === String(prevHomeWinnerId)

          let bracketHome, bracketAway, homeScore, awayScore, homePenaltyScore, awayPenaltyScore
          if (espnHomeIsBracketHome) {
            bracketHome = liveMatchup.home; bracketAway = liveMatchup.away
            homeScore = gameResult.homeScore; awayScore = gameResult.awayScore
            homePenaltyScore = gameResult.homePenaltyScore; awayPenaltyScore = gameResult.awayPenaltyScore
          } else if (espnAwayIsBracketHome) {
            bracketHome = liveMatchup.away; bracketAway = liveMatchup.home
            homeScore = gameResult.awayScore; awayScore = gameResult.homeScore
            homePenaltyScore = gameResult.awayPenaltyScore; awayPenaltyScore = gameResult.homePenaltyScore
          } else {
            // Can't resolve bracket order — fall back to ESPN's home/away.
            bracketHome = liveMatchup.home; bracketAway = liveMatchup.away
            homeScore = gameResult.homeScore; awayScore = gameResult.awayScore
            homePenaltyScore = gameResult.homePenaltyScore; awayPenaltyScore = gameResult.awayPenaltyScore
          }

          const homePick = picks[prevHomeId]
          const awayPick = picks[prevAwayId]
          return {
            id,
            home: bracketHome,
            away: bracketAway,
            homePickNote: (homePick && String(homePick.id) !== String(bracketHome.id)) ? homePick.code : null,
            awayPickNote: (awayPick && String(awayPick.id) !== String(bracketAway.id)) ? awayPick.code : null,
            overrideResult: { winnerId: gameResult.winnerId, homeScore, awayScore, homePenaltyScore, awayPenaltyScore },
          }
        }

        // Game not yet played — show picks as the predicted bracket path.
        return {
          id,
          home: picks[prevHomeId] ?? null,
          away: picks[prevAwayId] ?? null,
        }
      })
    }
    return byRound
  }, [picks, r32Matchups, allMatchupsById, results])

  const handlePick = useCallback(async (matchupId, team) => {
    const prevPick = picks[matchupId]
    const next = { ...picks, [matchupId]: team }
    if (prevPick && prevPick.id !== team.id) {
      cascadeClear(next, matchupId, prevPick)
    }
    setPicks(next)

    if (!isReadOnly) {
      setSaving(true)
      setError(null)
      try {
        await saveBracketPick(matchupId, String(team.id))
      } catch (err) {
        setError(err.message)
      } finally {
        setSaving(false)
      }
    }
  }, [picks, saveBracketPick, isReadOnly])

  const handleSaveAll = async () => {
    const pickEntries = Object.entries(picks)
    if (pickEntries.length === 0) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await Promise.all(pickEntries.map(([matchupId, team]) => saveBracketPick(matchupId, String(team.id))))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const totalPicks = Object.keys(picks).length

  const pointsByRound = useMemo(() => {
    const map = {}
    for (const [matchupId, team] of Object.entries(picks)) {
      const result = results[matchupId]
      if (!result || String(team.id) !== String(result.winnerId)) continue
      const round = MATCHUP_ROUND_KEY[matchupId]
      if (!round) continue
      map[round] = (map[round] ?? 0) + (BRACKET_POINTS_PER_ROUND[round] ?? 0)
    }
    return map
  }, [picks, results])

  const totalBracketPoints = useMemo(
    () => Object.values(pointsByRound).reduce((s, v) => s + v, 0),
    [pointsByRound]
  )

  if (!viewEntryId && !activeEntry) return (
    <div className="card text-center py-12 space-y-2">
      <p className="font-body font-semibold text-brand text-lg">No entry selected</p>
      <p className="font-body text-gray-500 text-sm">
        Create an entry from the Dashboard to start making bracket picks.
      </p>
    </div>
  )

  return (
    <PhaseGate
      allowedPhases={['PRE_KNOCKOUT', 'KNOCKOUT']}
      lockedMessage={
        <div className="space-y-3 text-sm max-w-lg mx-auto">
          <p>
            Bracket picks open once the group stage is complete. You will receive an email
            once the group stage concludes and prior to the knockout stage beginning — follow
            the link in that email to make your selections.
          </p>
          <p>
            <strong>NOTE:</strong> The reminder email may end up in your spam folder. It is
            advised to set a calendar reminder just in case, and to make your bracket picks
            quickly — the window between the group stage and the start of the knockout stage
            is very short.
          </p>
        </div>
      }
    >
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            {viewEntryId && (
              <Link to="/leaderboard" className="text-sm text-gray-400 font-body hover:text-brand block">
                ← Back to Leaderboard
              </Link>
            )}
            <h1 className="font-body font-semibold text-3xl text-brand">
              {viewEntryId ? (viewedEntry?.name ?? 'Bracket') : 'Knockout Bracket'}
            </h1>
            <p className="text-gray-500 font-body">
              {viewEntryId
                ? 'Read-only bracket view'
                : `Pick the winner of each round · ${totalPicks} / 31 picks made`}
            </p>
            {!viewEntryId && (
              <EntryIndicator
                entries={entries}
                activeEntry={activeEntry}
                activeEntryId={activeEntryId}
                onSwitch={setActiveEntryId}
              />
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0 self-start mt-1">
            {totalPicks > 0 && (
              <p className="text-right font-body">
                <span className="tabular-nums font-semibold text-2xl text-brand">
                  {totalBracketPoints}
                </span>
                <span className="text-sm text-gray-400 ml-1">bracket pts</span>
              </p>
            )}
            {isReadOnly ? (
              <span className="badge bg-gray-100 text-gray-500 font-body text-xs">
                {viewEntryId ? 'Viewing entry' : 'Bracket locked — read only'}
              </span>
            ) : (
              <button
                onClick={handleSaveAll}
                disabled={saving || totalPicks === 0}
                className="btn-primary"
              >
                {saving ? 'Saving…' : saved ? '✓ Saved!' : `Save Bracket (${totalPicks}/31)`}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700 font-body">{error}</p>
          </div>
        )}

        {/* ── Scoring reference ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-body text-amber-800 leading-relaxed">
            <strong>R32:</strong> +4 pts ·{' '}
            <strong>R16:</strong> +8 pts ·{' '}
            <strong>QF:</strong> +16 pts ·{' '}
            <strong>SF:</strong> +32 pts ·{' '}
            <strong>Final:</strong> +64 pts
          </p>
        </div>

        {/* ── Bracket tree ── */}
        {matchupsLoading && (
          <div className="text-center py-8 text-gray-400 font-body text-sm">
            Loading bracket matchups…
          </div>
        )}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-3 min-w-max pb-6">
            {ROUND_ORDER.map((round, roundIdx) => {
              const matchups = derivedMatchups[round]
              const slotsPerMatch = Math.pow(2, roundIdx)
              const paddingTop = (slotsPerMatch * SLOT - CARD_H) / 2
              const spacerH = slotsPerMatch * SLOT - CARD_H

              return (
                <div key={round} style={{ width: 164 }}>
                  <div className="mb-2 text-center" style={{ minHeight: '2.5rem' }}>
                    <p className="text-[11px] font-semibold text-gray-400 font-body uppercase tracking-wider whitespace-nowrap">
                      {ROUND_LABELS[round]}
                    </p>
                    {pointsByRound[round] > 0 && (
                      <p className="text-xs font-bold text-green-600 tabular-nums leading-tight">
                        +{pointsByRound[round]} pts
                      </p>
                    )}
                  </div>
                  <div style={{ paddingTop }}>
                    {matchups.map((matchup, i) => (
                      <Fragment key={matchup.id}>
                        <MatchupCard
                          matchup={matchup}
                          pick={picks[matchup.id]}
                          onPick={handlePick}
                          results={results}
                          isReadOnly={isReadOnly}
                        />
                        {i < matchups.length - 1 && (
                          <div style={{ height: spacerH }} />
                        )}
                      </Fragment>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </PhaseGate>
  )
}

// ── MatchupCard ────────────────────────────────────────────────────────────
function MatchupCard({ matchup, pick, onPick, results, isReadOnly }) {
  const slotH = CARD_H / 2
  // R16+ matchups carry an overrideResult that has scores swapped to match bracket
  // slot order (which may differ from ESPN's home/away). R32 matchups (from r32Matchups)
  // don't have this field, so fall back to the global results map.
  const matchResult = 'overrideResult' in matchup ? matchup.overrideResult : results[matchup.id]
  const actualWinnerId = matchResult?.winnerId
  const round = MATCHUP_ROUND_KEY[matchup.id]
  const roundPts = BRACKET_POINTS_PER_ROUND[round] ?? 0

  return (
    <div
      className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm"
      style={{ height: CARD_H }}
    >
      <TeamSlot
        team={matchup.home}
        pickNote={matchup.homePickNote ?? null}
        isSelected={pick?.id === matchup.home?.id}
        actualWinnerId={actualWinnerId}
        score={matchResult != null ? matchResult.homeScore : null}
        penaltyScore={matchResult != null ? matchResult.homePenaltyScore ?? null : null}
        roundPts={roundPts}
        height={slotH}
        borderBottom
        isReadOnly={isReadOnly}
        onSelect={() => matchup.home && onPick(matchup.id, matchup.home)}
      />
      <TeamSlot
        team={matchup.away}
        pickNote={matchup.awayPickNote ?? null}
        isSelected={pick?.id === matchup.away?.id}
        actualWinnerId={actualWinnerId}
        score={matchResult != null ? matchResult.awayScore : null}
        penaltyScore={matchResult != null ? matchResult.awayPenaltyScore ?? null : null}
        roundPts={roundPts}
        height={slotH}
        isReadOnly={isReadOnly}
        onSelect={() => matchup.away && onPick(matchup.id, matchup.away)}
      />
    </div>
  )
}

// ── TeamSlot ───────────────────────────────────────────────────────────────
function TeamSlot({ team, pickNote, isSelected, actualWinnerId, score, penaltyScore, roundPts, height, borderBottom, isReadOnly, onSelect }) {
  const base = `w-full flex items-center gap-1.5 px-2.5 text-left transition-colors${borderBottom ? ' border-b border-gray-100' : ''}`

  if (!team) {
    return (
      <div className={`${base} text-gray-300 font-body text-xs italic`} style={{ height }}>
        TBD
      </div>
    )
  }

  const isCorrect = isSelected && actualWinnerId !== undefined
    && String(team.id) === String(actualWinnerId)

  let colorClass
  if (isSelected && actualWinnerId !== undefined) {
    const won = String(team.id) === String(actualWinnerId)
    colorClass = won ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
  } else if (isSelected) {
    colorClass = 'bg-brand text-white'
  } else {
    colorClass = isReadOnly ? 'text-gray-700' : 'hover:bg-brand/5 text-gray-700'
  }

  return (
    <button
      onClick={isReadOnly ? undefined : onSelect}
      style={{ height }}
      className={[base, colorClass, isReadOnly ? 'cursor-default' : ''].join(' ')}
    >
      <img
        src={team.flagUrl}
        alt={team.code}
        className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
      />
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="font-body text-xs font-semibold truncate min-w-0">{team.code}</span>
        {pickNote && (
          <span className="font-body text-[10px] text-gray-400 shrink-0">({pickNote})</span>
        )}
        {isCorrect && (
          <span className="shrink-0 text-[10px] font-bold leading-none bg-green-600 text-white px-1 py-0.5 rounded">
            +{roundPts}
          </span>
        )}
      </div>
      {score !== null && (
        <span className="tabular-nums text-xs font-bold shrink-0">
          {score}
          {penaltyScore != null && (
            <span className="font-normal text-[10px] ml-0.5">({penaltyScore})</span>
          )}
        </span>
      )}
    </button>
  )
}

// ── EntryIndicator ─────────────────────────────────────────────────────────
function EntryIndicator({ entries, activeEntry, activeEntryId, onSwitch }) {
  if (!activeEntry) return null
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 bg-brand/5 border border-brand/15 rounded-xl px-3 py-1.5">
        <span className="text-xs text-gray-400 font-body uppercase tracking-wide">
          Entry {activeEntry.entryNumber}
        </span>
        <span className="text-gray-300 select-none">·</span>
        <span className="font-body font-semibold text-brand text-sm">
          {activeEntry.name}
        </span>
      </div>
      {entries.length > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 font-body">Switch:</span>
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => onSwitch(e.id)}
              aria-label={`Switch to entry ${e.entryNumber}: ${e.name}`}
              aria-pressed={e.id === activeEntryId}
              title={e.name}
              className={[
                'w-7 h-7 rounded-lg text-xs font-body font-semibold transition-colors',
                e.id === activeEntryId
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              ].join(' ')}
            >
              {e.entryNumber}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
