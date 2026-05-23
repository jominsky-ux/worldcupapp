/**
 * src/pages/SquadPage.jsx — Squad Builder (Formation + 11 Players)
 * =================================================================
 * Users first choose a formation from 8 options, which sets per-position
 * slot limits (always 1 GK; formation defines DEF/MID/FWD counts).
 * Then they pick exactly 11 players to fill those slots.
 *
 * AVAILABLE PHASES:
 *   PRE_TOURNAMENT — open before the group stage begins
 *   PRE_KNOCKOUT   — re-open after the group stage concludes
 *   KNOCKOUT       — scoring live; squad is read-only after kickoff
 *
 * TEAM LIMIT:
 * A maximum of 4 players from any single national team.
 *
 * FORMATION CHANGE:
 * Changing formation while players are already selected prompts the user
 * to confirm, since the position slots may no longer accommodate the
 * current selection — clearing is simpler than partially re-validating.
 *
 * POINTS:
 * Once the knockout stage begins, a player only accrues points while
 * their national team remains in the tournament.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { usePlayers, usePlayerPoints } from '../hooks/useGameData'
import { useEntry } from '../context/EntryContext'
import { PhaseGate, LoadingSpinner, PlayerCard } from '../components/shared/SharedComponents'
import { SQUAD_RULES, FORMATIONS } from '../mocks/entries'
import { POSITION_CONFIG } from '../mocks/players'

const MAX_PLAYERS_PER_TEAM = 4
const POSITIONS = ['All', 'GK', 'DEF', 'MID', 'FWD']

export default function SquadPage() {
  const [activePosition, setActivePosition] = useState('All')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [search, setSearch] = useState('')
  const [showSelected, setShowSelected] = useState(false)
  const { entries, activeEntry, activeEntryId, setActiveEntryId, saveFormation, saveSquadPick, phase } = useEntry()
  const isReadOnly = phase === 'GROUP_STAGE' || phase === 'KNOCKOUT'
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // ── Formation state ───────────────────────────────────────────────────────
  const [selectedFormation, setSelectedFormation] = useState(
    () => FORMATIONS.find((f) => f.id === activeEntry?.formation) ?? null
  )
  // When non-null, the user has clicked a *different* formation and we're
  // awaiting confirmation that clearing their current picks is OK.
  const [pendingFormation, setPendingFormation] = useState(null)

  // ── Squad state ───────────────────────────────────────────────────────────
  const [squadIds, setSquadIds] = useState(
    () => new Set(activeEntry?.squadPicks ?? [])
  )

  // ── Sync local state whenever the active entry changes ────────────────────
  useEffect(() => {
    setSelectedFormation(FORMATIONS.find((f) => f.id === activeEntry?.formation) ?? null)
    setSquadIds(new Set(activeEntry?.squadPicks ?? []))
    setPendingFormation(null)
    setError(null)
  }, [activeEntry?.id])

  const { data: pointsMap = new Map() } = usePlayerPoints()

  // Full unfiltered list — used for position/team lookups on selected players.
  // Shares the ['athletes'] cache with the filtered call below; no extra request.
  const { data: rawAllPlayers = [] } = usePlayers()
  const allPlayers = useMemo(
    () => rawAllPlayers.map((p) => ({ ...p, totalPoints: pointsMap.get(p.id) ?? 0 })),
    [rawAllPlayers, pointsMap]
  )

  const { data: rawPlayers = [], isLoading } = usePlayers({
    position: activePosition === 'All' ? undefined : activePosition,
    teamId: selectedTeam || undefined,
    search: search || undefined,
  })
  const players = useMemo(
    () => rawPlayers.map((p) => ({ ...p, totalPoints: pointsMap.get(p.id) ?? 0 })),
    [rawPlayers, pointsMap]
  )

  // ── Team dropdown options ─────────────────────────────────────────────────
  const teamOptions = useMemo(() => {
    const seen = new Set()
    const teams = []
    for (const p of allPlayers) {
      if (p.teamId && !seen.has(p.teamId)) {
        seen.add(p.teamId)
        teams.push({ id: p.teamId, name: p.teamCode || p.teamId })
      }
    }
    return teams.sort((a, b) => a.name.localeCompare(b.name))
  }, [allPlayers])

  // ── Per-position limits driven by the selected formation ──────────────────
  const formationLimits = useMemo(
    () =>
      selectedFormation
        ? { GK: 1, DEF: selectedFormation.def, MID: selectedFormation.mid, FWD: selectedFormation.fwd }
        : null,
    [selectedFormation]
  )

  // ── Derived counts ────────────────────────────────────────────────────────
  const playerLookup = useMemo(
    () => new Map(allPlayers.map((p) => [p.id, p])),
    [allPlayers]
  )

  const positionCounts = useMemo(() => {
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
    for (const id of squadIds) {
      const p = playerLookup.get(id)
      if (p) counts[p.position] = (counts[p.position] ?? 0) + 1
    }
    return counts
  }, [squadIds, playerLookup])

  const teamCounts = useMemo(() => {
    const counts = new Map()
    for (const id of squadIds) {
      const p = playerLookup.get(id)
      if (p) counts.set(p.teamId, (counts.get(p.teamId) ?? 0) + 1)
    }
    return counts
  }, [squadIds, playerLookup])

  const cappedTeams = useMemo(
    () =>
      [...teamCounts.entries()]
        .filter(([, count]) => count >= MAX_PLAYERS_PER_TEAM)
        .map(([teamId]) => {
          const p = allPlayers.find((a) => a.teamId === teamId)
          return p?.teamCode || String(teamId)
        }),
    [teamCounts, allPlayers]
  )

  // ── "Selected only" filter ────────────────────────────────────────────────
  const displayedPlayers = useMemo(
    () => (isReadOnly || showSelected ? players.filter((p) => squadIds.has(p.id)) : players),
    [players, isReadOnly, showSelected, squadIds]
  )

  // ── Formation selection ───────────────────────────────────────────────────
  const handleFormationClick = useCallback((formation) => {
    if (formation.id === selectedFormation?.id) return

    if (squadIds.size > 0) {
      // Ask for confirmation before clearing current picks
      setPendingFormation(formation)
    } else {
      applyFormation(formation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormation, squadIds.size])

  const applyFormation = useCallback((formation) => {
    setSelectedFormation(formation)
    setSquadIds(new Set())
    setPendingFormation(null)
    setError(null)
    saveFormation(formation.id)
  }, [saveFormation])

  const cancelFormationChange = useCallback(() => setPendingFormation(null), [])

  // ── Toggle a player in/out of the squad ───────────────────────────────────
  const handleToggle = useCallback((player) => {
    if (!formationLimits) return

    setSquadIds((prev) => {
      const next = new Set(prev)

      if (next.has(player.id)) {
        next.delete(player.id)
        return next
      }

      if ((positionCounts[player.position] ?? 0) >= formationLimits[player.position]) return prev
      if ((teamCounts.get(player.teamId) ?? 0) >= MAX_PLAYERS_PER_TEAM) return prev
      if (next.size >= SQUAD_RULES.total) return prev

      next.add(player.id)
      return next
    })
    setError(null)
  }, [formationLimits, positionCounts, teamCounts])

  const isPlayerDisabled = useCallback((player) => {
    if (!formationLimits) return true
    if (squadIds.has(player.id)) return false
    const positionFull = (positionCounts[player.position] ?? 0) >= formationLimits[player.position]
    const teamFull = (teamCounts.get(player.teamId) ?? 0) >= MAX_PLAYERS_PER_TEAM
    return positionFull || teamFull || squadIds.size >= SQUAD_RULES.total
  }, [formationLimits, positionCounts, teamCounts, squadIds])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedFormation) {
      setError('Please select a formation before saving.')
      return
    }
    if (squadIds.size !== SQUAD_RULES.total) {
      setError(`Squad must have exactly ${SQUAD_RULES.total} players.`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const players = [...squadIds].map((id) => ({
        athleteId: id,
        position: playerLookup.get(id)?.position ?? '',
      }))
      await saveSquadPick(players)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const saveReady = selectedFormation && squadIds.size === SQUAD_RULES.total

  if (!activeEntry) return (
    <div className="card text-center py-12 space-y-2">
      <p className="font-body font-semibold text-brand text-lg">No entry selected</p>
      <p className="font-body text-gray-500 text-sm">
        Create an entry from the Dashboard to start building your squad.
      </p>
    </div>
  )

  return (
    <PhaseGate
      allowedPhases={['PRE_TOURNAMENT', 'PRE_KNOCKOUT']}
      readOnlyPhases={['GROUP_STAGE', 'KNOCKOUT']}
      readOnlyMessage="Squad picks are locked — your selections are shown below."
      lockedMessage="Squad picks are locked. The tournament has begun!"
    >
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <h1 className="font-body font-semibold text-3xl text-brand">
              Build Your Squad
            </h1>
            <p className="text-gray-500 font-body">
              Choose a formation · pick {SQUAD_RULES.total} players · max {MAX_PLAYERS_PER_TEAM} per nation
            </p>
            <EntryIndicator
              entries={entries}
              activeEntry={activeEntry}
              activeEntryId={activeEntryId}
              onSwitch={setActiveEntryId}
            />
          </div>
          {isReadOnly ? (
            <span className="badge bg-gray-100 text-gray-500 font-body text-xs shrink-0 self-start mt-1">
              Picks locked — read only
            </span>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !saveReady}
              className="btn-primary shrink-0"
            >
              {saving ? 'Saving…' : saved ? '✓ Saved!' : `Save Squad (${squadIds.size}/${SQUAD_RULES.total})`}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700 font-body">{error}</p>
          </div>
        )}

        {/* ── Formation picker ── */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-body font-semibold text-brand">Formation</p>
            {selectedFormation && (
              <span className="badge bg-brand/10 text-brand text-xs">
                {selectedFormation.id} selected
              </span>
            )}
          </div>

          {/* Pending-change confirmation banner */}
          {pendingFormation && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-sm text-amber-800 font-body">
                Switching to <strong>{pendingFormation.id}</strong> will clear your
                current {squadIds.size} player {squadIds.size === 1 ? 'selection' : 'selections'}.
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => applyFormation(pendingFormation)}
                  className="text-xs font-body font-semibold text-amber-800 underline"
                >
                  Confirm
                </button>
                <button
                  onClick={cancelFormationChange}
                  className="text-xs font-body text-gray-500 underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-4 gap-2${isReadOnly ? ' pointer-events-none' : ''}`}>
            {FORMATIONS.map((f) => {
              const isSelected = f.id === selectedFormation?.id
              const isPending = f.id === pendingFormation?.id
              return (
                <button
                  key={f.id}
                  onClick={() => handleFormationClick(f)}
                  className={[
                    'rounded-xl border py-3 px-2 text-center transition-all duration-150',
                    isSelected
                      ? 'border-brand bg-brand/5 ring-1 ring-brand'
                      : isPending
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 bg-surface hover:border-brand/40 hover:bg-brand/5',
                  ].join(' ')}
                >
                  <p className={[
                    'font-body font-bold text-base leading-none',
                    isSelected ? 'text-brand' : 'text-gray-700',
                  ].join(' ')}>
                    {f.id}
                  </p>
                  <p className="text-xs text-gray-400 font-body mt-1.5 leading-none">
                    {f.def}D · {f.mid}M · {f.fwd}F
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Position slot counters (only when a formation is selected) ── */}
        {formationLimits && (
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(formationLimits).map(([pos, required]) => {
              const filled = positionCounts[pos] ?? 0
              const full = filled >= required
              const config = POSITION_CONFIG[pos]
              return (
                <div
                  key={pos}
                  className={[
                    'card text-center py-3 transition-all',
                    full ? 'ring-1 ring-green-300 bg-green-50' : '',
                  ].join(' ')}
                >
                  <span className={`badge ${config.color} mb-2`}>{pos}</span>
                  <p className="tabular-nums font-semibold text-brand">
                    {filled} / {required}
                  </p>
                  {full && <p className="text-xs text-green-600 font-body mt-1">Full ✓</p>}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Team cap warnings ── */}
        {cappedTeams.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 font-body">Team limit reached:</span>
            {cappedTeams.map((code) => (
              <span key={code} className="badge bg-orange-100 text-orange-700 text-xs">
                {code} ({MAX_PLAYERS_PER_TEAM}/{MAX_PLAYERS_PER_TEAM})
              </span>
            ))}
          </div>
        )}

        {/* ── Player picker (locked until formation chosen) ── */}
        {!selectedFormation ? (
          <div className="card border border-dashed border-gray-200 text-center py-10">
            <p className="text-gray-400 font-body">
              Select a formation above to start picking players.
            </p>
          </div>
        ) : (
          <>
            {/* Search + team + position filters — single row */}
            <div className="flex items-center gap-3">
              <label className={`flex items-center gap-1.5 shrink-0 ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={isReadOnly || showSelected}
                  onChange={(e) => !isReadOnly && setShowSelected(e.target.checked)}
                  disabled={isReadOnly}
                  className="accent-brand"
                />
                <span className="text-sm text-gray-500 font-body whitespace-nowrap">Selected</span>
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players…"
                className="input-field w-36"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-gray-500 font-body whitespace-nowrap">Team:</span>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Teams</option>
                  {teamOptions.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-surface shrink-0">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setActivePosition(pos)}
                    className={[
                      'px-3 py-2 text-sm font-body font-medium transition-colors',
                      activePosition === pos
                        ? 'bg-brand text-white'
                        : 'text-gray-500 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {pos}
                  </button>
                ))}
              </div>
              {(search || selectedTeam || activePosition !== 'All' || showSelected) && (
                <button
                  onClick={() => {
                    setSearch('')
                    setSelectedTeam('')
                    setActivePosition('All')
                    setShowSelected(false)
                  }}
                  className="text-xs font-body text-gray-400 hover:text-gray-600 underline shrink-0"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Player grid */}
            {isLoading ? (
              <LoadingSpinner label="Loading players…" />
            ) : (
              <>
                <p className="text-xs text-gray-400 font-body">
                  Greyed-out players cannot be added — position slot full or {MAX_PLAYERS_PER_TEAM}-player team cap reached.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      selected={squadIds.has(player.id)}
                      onToggle={isReadOnly ? undefined : handleToggle}
                      disabled={isReadOnly ? false : isPlayerDisabled(player)}
                    />
                  ))}
                  {displayedPlayers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 font-body">
                      No players found matching your search.
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PhaseGate>
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
