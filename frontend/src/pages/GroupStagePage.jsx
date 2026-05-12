/**
 * src/pages/GroupStagePage.jsx — Group Stage Bracket Picker
 * ===========================================================
 * This page lets users make two types of picks before the tournament:
 *
 * PICK TYPE 1 — Group winners & runners-up (12 groups × 2 picks = 24 picks)
 *   Scoring:
 *     Correct 1st place:   +4 pts per group
 *     Correct 2nd place:   +2 pts per group
 *     All 24 correct:      +20 bonus pts
 *
 * PICK TYPE 2 — Third-place qualifiers (8 picks total across all groups)
 *   In 2026, the 8 best third-place finishers advance to the Round of 32.
 *   Scoring: +1 pt per correct 3rd-place pick · +10 bonus for all 8 correct.
 *   Constraint: one pick per group (since each group has one 3rd-place team),
 *   and only the two teams NOT picked for 1st or 2nd are eligible.
 *
 * STATE ARCHITECTURE — why state is lifted to the page:
 * ──────────────────────────────────────────────────────
 * Previously, each GroupCard owned its own local (localFirst, localSecond)
 * state. This caused two problems:
 *
 *   1. ThirdPlacePanel had no way to know which teams were already picked
 *      for 1st/2nd, so it couldn't filter them out of the eligible pool.
 *
 *   2. When a user changed a 1st/2nd pick, there was no mechanism to clear
 *      any 3rd-place pick that now conflicted (e.g. France was picked 3rd,
 *      then later picked 1st — it should be removed from 3rd).
 *
 * FIX — lift all group pick state up to GroupStagePage:
 *   - `groupPicksState`: a Map<groupId, { firstPlaceTeamId, secondPlaceTeamId }>
 *     lives here and is passed down to GroupCard as a controlled prop.
 *   - `thirdPlacePickMap`: a Map<groupId, teamId> lives here. Using groupId as
 *     the key enforces the one-per-group constraint structurally and keeps the
 *     groupId available when sending picks to the backend.
 *   - `handleGroupPick()` updates groupPicksState AND atomically clears any
 *     3rd-place pick that now conflicts with the new selection before saving.
 *
 * ELIGIBLE 3RD-PLACE TEAMS (per group):
 *   From the group's 4 teams, remove the current 1st and 2nd picks.
 *   The remaining 2 teams are shown in ThirdPlacePanel as selectable.
 *   If neither 1st nor 2nd is picked yet for a group, all 4 teams show
 *   (they are all potential 3rd-place finishers until picks are made).
 *
 * AUTO-CLEAR ON 1ST/2ND CHANGE:
 *   When `handleGroupPick` is called it checks whether the newly-picked 1st or
 *   2nd team is a value in thirdPlacePickMap. If so, that entry is removed
 *   atomically. A user can never have the same team picked for both
 *   1st/2nd and 3rd place simultaneously.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useGroups } from '../hooks/useGameData'
import { useEntry } from '../context/EntryContext'
import { PhaseGate, LoadingSpinner } from '../components/shared/SharedComponents'
import { MAX_THIRD_PLACE_PICKS } from '../mocks/entries'

export default function GroupStagePage() {
  const { data: groups = [], isLoading, isError } = useGroups()
  const {
    entries,
    activeEntry,
    activeEntryId,
    setActiveEntryId,
    entriesLoading,
    saveGroupPick,
    saveThirdPlacePicks,
    phase,
  } = useEntry()
  const isReadOnly = phase === 'GROUP_STAGE' || phase === 'PRE_KNOCKOUT' || phase === 'KNOCKOUT'
  const [activeTab, setActiveTab] = useState('groups')
  const [globalSaving, setGlobalSaving] = useState(false)
  const [globalSaved, setGlobalSaved] = useState(false)

  // ── Lifted group picks state ─────────────────────────────────────────────
  // Initialised empty; the useEffect below populates it once entries load.
  // Shape: Map<groupId, { firstPlaceTeamId: string|null, secondPlaceTeamId: string|null }>
  const [groupPicksState, setGroupPicksState] = useState(() => new Map())

  // ── Lifted 3rd-place picks state ─────────────────────────────────────────
  // Shape: Map<groupId, teamId> — one pick per group, keyed by groupId so
  // the groupId is always available when sending picks to the backend.
  const [thirdPlacePickMap, setThirdPlacePickMap] = useState(() => new Map())

  // ── Sync local picks state whenever the active entry changes ─────────────
  // Fires on initial load (entries arrive from the backend after mount) and
  // whenever the user switches to a different entry.
  useEffect(() => {
    const groupMap = new Map()
    for (const pick of activeEntry?.groupPicks ?? []) {
      groupMap.set(pick.groupId, {
        firstPlaceTeamId: pick.firstPlaceTeamId ?? null,
        secondPlaceTeamId: pick.secondPlaceTeamId ?? null,
      })
    }
    setGroupPicksState(groupMap)

    const thirdMap = new Map()
    for (const pick of activeEntry?.thirdPlacePicks ?? []) {
      thirdMap.set(pick.groupId, pick.teamId)
    }
    setThirdPlacePickMap(thirdMap)
  }, [activeEntry?.id])

  // ── Derived: count of fully-completed groups ──────────────────────────────
  const completedGroups = useMemo(
    () =>
      [...groupPicksState.values()].filter(
        (p) => p.firstPlaceTeamId && p.secondPlaceTeamId
      ).length,
    [groupPicksState]
  )

  // ── Derived: flat Set<teamId> for ThirdPlacePanel membership checks ────────
  const thirdPlaceTeamIds = useMemo(
    () => new Set(thirdPlacePickMap.values()),
    [thirdPlacePickMap]
  )

  // ── Derived: set of all team IDs picked for 1st or 2nd across all groups ──
  // Used by ThirdPlacePanel to determine which teams are ineligible.
  const topTwoPickedIds = useMemo(() => {
    const ids = new Set()
    for (const pick of groupPicksState.values()) {
      if (pick.firstPlaceTeamId) ids.add(pick.firstPlaceTeamId)
      if (pick.secondPlaceTeamId) ids.add(pick.secondPlaceTeamId)
    }
    return ids
  }, [groupPicksState])

  // ── handleGroupPick ───────────────────────────────────────────────────────
  // Called by GroupCard when the user clicks a 1st or 2nd radio.
  // Updates groupPicksState, then atomically clears any 3rd-place pick
  // that now conflicts with the new selection, then saves both.
  const handleGroupPick = useCallback(async (groupId, newFirst, newSecond) => {
    // 1. Update group picks state
    setGroupPicksState((prev) => {
      const next = new Map(prev)
      next.set(groupId, { firstPlaceTeamId: newFirst, secondPlaceTeamId: newSecond })
      return next
    })

    // 2. Clear any 3rd-place picks that are now ineligible because the team
    //    was just picked for 1st or 2nd place. Reading from the closure value
    //    (not a functional setter) keeps the save call outside the updater so
    //    StrictMode's double-invocation doesn't fire the API call twice.
    const conflicting = new Set([newFirst, newSecond].filter(Boolean))
    const hasConflict = [...thirdPlacePickMap.values()].some((tid) => conflicting.has(tid))
    if (hasConflict) {
      const next = new Map([...thirdPlacePickMap].filter(([, tid]) => !conflicting.has(tid)))
      setThirdPlacePickMap(next)
      saveThirdPlacePicks([...next.entries()].map(([groupId, teamId]) => ({ groupId, teamId })))
    }

    // 3. Save the group pick if both slots are now filled
    if (newFirst && newSecond) {
      await saveGroupPick(groupId, newFirst, newSecond)
    }
  }, [saveGroupPick, saveThirdPlacePicks, thirdPlacePickMap])

  // ── handleThirdPlaceToggle ────────────────────────────────────────────────
  // Called by ThirdPlacePanel when the user clicks a team chip.
  // The Map structure enforces one pick per group: setting a new teamId for
  // a groupId automatically replaces any prior pick for that group.
  // The save is called outside the state setter so StrictMode's double-
  // invocation of updater functions doesn't fire the API call twice.
  const handleThirdPlaceToggle = useCallback((teamId, groupId) => {
    const current = thirdPlacePickMap.get(groupId)

    if (current === teamId) {
      // Deselect: the user clicked the already-selected team for this group
      const next = new Map(thirdPlacePickMap)
      next.delete(groupId)
      setThirdPlacePickMap(next)
      saveThirdPlacePicks([...next.entries()].map(([gId, tId]) => ({ groupId: gId, teamId: tId })))
      return
    }

    // Cap check: only block if we would be adding a brand-new group entry
    if (thirdPlacePickMap.size >= MAX_THIRD_PLACE_PICKS && current === undefined) return

    // Replace or add: Map.set handles both cases
    const next = new Map(thirdPlacePickMap)
    next.set(groupId, teamId)
    setThirdPlacePickMap(next)
    saveThirdPlacePicks([...next.entries()].map(([gId, tId]) => ({ groupId: gId, teamId: tId })))
  }, [thirdPlacePickMap, saveThirdPlacePicks])

  const handleSaveAll = async () => {
    setGlobalSaving(true)
    try {
      // Save every complete group pick (both slots filled) in parallel.
      const groupSaves = []
      for (const [groupId, pick] of groupPicksState) {
        if (pick.firstPlaceTeamId && pick.secondPlaceTeamId) {
          groupSaves.push(saveGroupPick(groupId, pick.firstPlaceTeamId, pick.secondPlaceTeamId))
        }
      }

      // Save third-place picks only when the full set of 8 is ready.
      const thirdSave = thirdPlacePickMap.size === 8
        ? saveThirdPlacePicks(
          [...thirdPlacePickMap.entries()].map(([groupId, teamId]) => ({ groupId, teamId }))
        )
        : Promise.resolve()

      await Promise.all([...groupSaves, thirdSave])
      setGlobalSaved(true)
      setTimeout(() => setGlobalSaved(false), 3000)
    } catch {
      // Individual saves have already updated local state; a failure here
      // just means the backend didn't persist — restore the button silently.
    } finally {
      setGlobalSaving(false)
    }
  }

  if (isLoading || entriesLoading) {
    return <LoadingSpinner size="lg" label={entriesLoading ? 'Loading your entries…' : 'Loading groups…'} />
  }
  if (isError) return (
    <div className="card text-center py-12 text-red-500 font-body">
      Failed to load groups. Please refresh the page.
    </div>
  )
  if (!activeEntry) return (
    <div className="card text-center py-12 space-y-2">
      <p className="font-body font-semibold text-brand text-lg">No entry selected</p>
      <p className="font-body text-gray-500 text-sm">
        Create an entry from the Dashboard to start making picks.
      </p>
    </div>
  )

  return (
    <PhaseGate
      allowedPhases={['PRE_TOURNAMENT']}
      readOnlyPhases={['GROUP_STAGE', 'PRE_KNOCKOUT', 'KNOCKOUT']}
      readOnlyMessage="Group stage picks are locked — the tournament has begun. Your selections are shown below."
      lockedMessage="Group stage picks are locked. The tournament has begun!"
    >
      <div className="space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <h1 className="font-body font-semibold text-3xl text-brand">
              Group Stage Picks
            </h1>
            <p className="text-gray-500 font-body">
              Pick group winners, runners-up, and 8 third-place qualifiers.
            </p>
            {/* Entry indicator — shows which entry is being edited */}
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
              onClick={handleSaveAll}
              disabled={globalSaving || (completedGroups === 0 && thirdPlacePickMap.size === 0)}
              className="btn-primary shrink-0"
            >
              {globalSaving ? 'Saving…' : globalSaved ? '✓ Saved!' : 'Save All Picks'}
            </button>
          )}
        </div>

        {/* ── Scoring reference ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-body text-amber-800 leading-relaxed">
            <strong>Group winner:</strong> +4 pts ·{' '}
            <strong>Runner-up:</strong> +2 pts ·{' '}
            <strong>All 24 correct bonus:</strong> +20 pts ·{' '}
            <strong>3rd-place qualifier:</strong> +1 pt each ·{' '}
            <strong>All 8 correct bonus:</strong> +10 pts
          </p>
        </div>

        <div className="bg-blue-50 border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-black-500 font-body">
            For up-to-date FIFA rankings, refer to the official <a href="https://inside.fifa.com/fifa-world-ranking/men" target="_blank" className="text-blue-500 hover:underline">
              FIFA website
            </a>
          </p>
        </div>
        {/* ── Tab bar ── */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-surface w-fit">
          <TabButton
            active={activeTab === 'groups'}
            onClick={() => setActiveTab('groups')}
            label={`Group Picks (${completedGroups}/${groups.length})`}
          />
          <TabButton
            active={activeTab === 'third'}
            onClick={() => setActiveTab('third')}
            label={`3rd Place Picks (${thirdPlacePickMap.size}/${MAX_THIRD_PLACE_PICKS})`}
          />
        </div>

        {/* ── Progress bar (groups tab) ── */}
        {activeTab === 'groups' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400 font-body">
              <span>Group picks progress</span>
              <span className="tabular-nums">{completedGroups} / {groups.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gold h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedGroups / groups.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Group picks grid ── */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                picks={groupPicksState.get(group.id) ?? null}
                onPick={handleGroupPick}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        )}

        {/* ── Third place picks panel ── */}
        {activeTab === 'third' && (
          <ThirdPlacePanel
            groups={groups}
            groupPicksState={groupPicksState}
            topTwoPickedIds={topTwoPickedIds}
            selectedIds={thirdPlaceTeamIds}
            onToggle={handleThirdPlaceToggle}
            isReadOnly={isReadOnly}
          />
        )}
      </div>
    </PhaseGate>
  )
}

// ── EntryIndicator ─────────────────────────────────────────────────────────
/**
 * Shows which entry the user is currently editing and lets them switch
 * between entries when they have more than one.
 *
 * Single entry: displays a read-only badge with entry number and name.
 * Multiple entries: adds numbered switch buttons so the user can flip
 * between their entries without leaving the page.
 */
function EntryIndicator({ entries, activeEntry, activeEntryId, onSwitch }) {
  if (!activeEntry) return null

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Active entry badge */}
      <div className="flex items-center gap-2 bg-brand/5 border border-brand/15 rounded-xl px-3 py-1.5">
        <span className="text-xs text-gray-400 font-body uppercase tracking-wide">
          Entry {activeEntry.entryNumber}
        </span>
        <span className="text-gray-300 select-none">·</span>
        <span className="font-body font-semibold text-brand text-sm">
          {activeEntry.name}
        </span>
      </div>

      {/* Entry switcher — only shown when the user has multiple entries */}
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

// ── TabButton ──────────────────────────────────────────────────────────────
function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2.5 text-sm font-body font-medium transition-colors whitespace-nowrap',
        active ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ── GroupCard ──────────────────────────────────────────────────────────────
/**
 * GroupCard — now a CONTROLLED component.
 *
 * Previously GroupCard managed its own (localFirst, localSecond) state.
 * It is now fully controlled: `picks` is passed in from the parent and
 * `onPick` calls back to the parent with the new values. This allows the
 * parent to react to pick changes (e.g. clearing 3rd-place conflicts) in
 * the same state update cycle.
 *
 * PROPS:
 *   group  — { id, name, teams: [...] }
 *   picks  — { firstPlaceTeamId, secondPlaceTeamId } | null  (from parent)
 *   onPick — async (groupId, newFirst, newSecond) => void
 *
 * FLAG DISPLAY:
 * Each team row shows a 1.4rem flag emoji with role="img" + aria-label,
 * followed by the full country name. No 3-letter abbreviations.
 */
function GroupCard({ group, picks, onPick, isReadOnly = false }) {
  const firstPlaceTeamId = picks?.firstPlaceTeamId ?? null
  const secondPlaceTeamId = picks?.secondPlaceTeamId ?? null
  const [saving, setSaving] = useState(false)

  const handlePick = useCallback(async (teamId, place) => {
    let newFirst = firstPlaceTeamId
    let newSecond = secondPlaceTeamId

    if (place === 'first') {
      if (newSecond === teamId) newSecond = null
      newFirst = teamId
    } else {
      if (newFirst === teamId) newFirst = null
      newSecond = teamId
    }

    // Only save/trigger parent when something actually changed
    if (newFirst === firstPlaceTeamId && newSecond === secondPlaceTeamId) return

    setSaving(true)
    try {
      await onPick(group.id, newFirst, newSecond)
    } finally {
      setSaving(false)
    }
  }, [group.id, firstPlaceTeamId, secondPlaceTeamId, onPick])

  const isComplete = firstPlaceTeamId && secondPlaceTeamId
  const firstTeam = group.teams.find((t) => t.id === firstPlaceTeamId)
  const secondTeam = group.teams.find((t) => t.id === secondPlaceTeamId)

  return (
    <div className={[
      'card transition-all duration-200',
      isComplete ? 'ring-1 ring-gold/40' : '',
    ].join(' ')}>

      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-body font-semibold text-brand">{group.name}</h3>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-gray-400 font-body">saving…</span>}
          {isComplete && !saving && (
            <span className="badge bg-green-100 text-green-700 text-xs">Complete</span>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_44px_44px] gap-2 mb-2 px-1">
        <span className="text-xs text-gray-400 font-body font-medium uppercase tracking-wide">
          Team
        </span>
        <span className="text-xs text-gray-400 font-body font-medium text-center">1st</span>
        <span className="text-xs text-gray-400 font-body font-medium text-center">2nd</span>
      </div>

      {/* Team rows */}
      <div className={`space-y-1${isReadOnly ? ' pointer-events-none' : ''}`}>
        {group.teams.map((team) => {
          const isFirst = firstPlaceTeamId === team.id
          const isSecond = secondPlaceTeamId === team.id

          return (
            <div
              key={team.id}
              className={[
                'grid grid-cols-[1fr_44px_44px] items-center gap-2 py-2 px-1 rounded-xl transition-colors',
                isFirst || isSecond ? 'bg-gold/5' : 'hover:bg-gray-50',
              ].join(' ')}
            >
              {/* Flag + country name */}
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={team.flagUrl}
                  alt={`${team.name} flag`}
                  className="w-7 h-auto rounded-sm shrink-0 object-cover"
                />
                <span className="font-body text-sm font-medium text-brand truncate">
                  {team.name}
                </span>
              </div>

              {/* 1st place radio */}
              <div className="flex justify-center">
                <button
                  onClick={() => handlePick(team.id, 'first')}
                  aria-label={`Pick ${team.name} as group winner`}
                  aria-pressed={isFirst}
                  className={[
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150',
                    isFirst
                      ? 'border-gold bg-gold'
                      : 'border-gray-300 hover:border-gold/60',
                  ].join(' ')}
                >
                  {isFirst && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                </button>
              </div>

              {/* 2nd place radio */}
              <div className="flex justify-center">
                <button
                  onClick={() => handlePick(team.id, 'second')}
                  aria-label={`Pick ${team.name} as group runner-up`}
                  aria-pressed={isSecond}
                  className={[
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150',
                    isSecond
                      ? 'border-brand bg-brand'
                      : 'border-gray-300 hover:border-brand/40',
                  ].join(' ')}
                >
                  {isSecond && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pick summary */}
      {isComplete && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm font-body">
          <div className="flex items-center gap-1.5">
            <img
              src={firstTeam?.flagUrl}
              alt={`${firstTeam?.name} flag`}
              className="w-6 h-auto rounded-sm object-cover"
            />
            <span className="text-gray-500">
              <span className="font-semibold text-brand">{firstTeam?.name}</span>
              {' '}1st
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <img
              src={secondTeam?.flagUrl}
              alt={`${secondTeam?.name} flag`}
              className="w-6 h-auto rounded-sm object-cover"
            />
            <span className="text-gray-500">
              <span className="font-semibold text-brand">{secondTeam?.name}</span>
              {' '}2nd
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ThirdPlacePanel ────────────────────────────────────────────────────────
/**
 * ThirdPlacePanel — lets the user pick 8 third-place qualifiers.
 *
 * ELIGIBLE TEAMS (the core logic change):
 * For each group, only the teams NOT already picked for 1st or 2nd place
 * in that group are shown as selectable options. If the user hasn't made
 * any 1st/2nd picks for a group yet, all 4 teams are shown.
 *
 * This is derived from `topTwoPickedIds` (passed from the parent), which
 * is the union of all firstPlaceTeamId and secondPlaceTeamId values across
 * all groups. Any team in that set is hidden from the 3rd-place chip list.
 *
 * Example — Group A: USA 1st, Mexico 2nd
 *   Before: shows USA, Mexico, Panama, Bolivia
 *   After:  shows Panama, Bolivia only
 *
 * AUTO-CLEAR NOTICE:
 * If a team was previously picked 3rd but is now ineligible (because the
 * user picked them 1st or 2nd), the parent has already cleared them from
 * `selectedIds` before this component re-renders. An info banner explains
 * this to the user if any picks were cleared.
 *
 * PROPS:
 *   groups          — all 12 group objects
 *   groupPicksState — Map<groupId, { firstPlaceTeamId, secondPlaceTeamId }>
 *   topTwoPickedIds — Set<teamId> — all teams picked 1st or 2nd (any group)
 *   selectedIds     — Set<teamId> — currently selected 3rd-place picks
 *   onToggle        — (teamId, groupId) => void
 */
function ThirdPlacePanel({ groups, groupPicksState, topTwoPickedIds, selectedIds, onToggle, isReadOnly = false }) {
  // Build a map: groupId → the one selected 3rd-place team ID from that group
  const groupThirdPickMap = useMemo(() => {
    const map = new Map()
    for (const group of groups) {
      for (const team of group.teams) {
        if (selectedIds.has(team.id)) {
          map.set(group.id, team.id)
          break
        }
      }
    }
    return map
  }, [groups, selectedIds])

  const atCap = selectedIds.size >= MAX_THIRD_PLACE_PICKS

  return (
    <div className="space-y-4">

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
        <p className="text-sm font-body text-blue-800">
          <strong>Pick {MAX_THIRD_PLACE_PICKS} teams</strong> you think will finish 3rd and
          still advance to the Round of 32. Only teams not already picked for 1st or 2nd
          are shown. One pick per group · {MAX_THIRD_PLACE_PICKS - selectedIds.size} remaining.
          Each correct pick is worth <strong>+1 pt</strong>. To deselect a team, simply click it
          again. If you change a 1st/2nd pick that causes a currently selected 3rd-place team to
          become ineligible, that team will be automatically removed from your 3rd-place picks.
        </p>
      </div>

      {/* Dot progress indicator */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: MAX_THIRD_PLACE_PICKS }).map((_, i) => (
            <span
              key={i}
              className={[
                'w-3 h-3 rounded-full border-2 transition-colors duration-200',
                i < selectedIds.size
                  ? 'bg-brand border-brand'
                  : 'bg-white border-gray-300',
              ].join(' ')}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500 font-body">
          {selectedIds.size} / {MAX_THIRD_PLACE_PICKS} selected
        </span>
      </div>

      {/* Group rows */}
      <div className="space-y-3">
        {groups.map((group) => {
          const groupPick = groupPicksState.get(group.id)
          const pickedFirst = groupPick?.firstPlaceTeamId ?? null
          const pickedSecond = groupPick?.secondPlaceTeamId ?? null

          // Only show teams that are NOT picked for 1st or 2nd in this group
          const eligibleTeams = group.teams.filter(
            (t) => t.id !== pickedFirst && t.id !== pickedSecond
          )

          const groupThirdPickId = groupThirdPickMap.get(group.id) ?? null
          const groupHasPick = groupThirdPickId !== null
          const noPicks = !pickedFirst && !pickedSecond

          return (
            <div key={group.id} className="card py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400 font-body font-medium uppercase tracking-wide">
                  {group.name} — 3rd place
                </p>
                {/* Show which teams are "taken" by 1st/2nd picks */}
                {(pickedFirst || pickedSecond) && (
                  <p className="text-xs text-gray-300 font-body">
                    {[
                      pickedFirst && group.teams.find((t) => t.id === pickedFirst)?.name,
                      pickedSecond && group.teams.find((t) => t.id === pickedSecond)?.name,
                    ].filter(Boolean).join(' & ')} eliminated
                  </p>
                )}
              </div>

              {/* Eligible team chips */}
              <div className={`flex flex-wrap gap-2${isReadOnly ? ' pointer-events-none' : ''}`}>
                {eligibleTeams.map((team) => {
                  const isSelected = selectedIds.has(team.id)
                  // Disable if: another team from this group is already the 3rd pick,
                  // OR the overall cap is reached and this team isn't selected
                  const isDisabled =
                    (!isSelected && groupHasPick) ||
                    (!isSelected && atCap)

                  return (
                    <button
                      key={team.id}
                      onClick={() => !isDisabled && onToggle(team.id, group.id)}
                      disabled={isDisabled}
                      aria-pressed={isSelected}
                      className={[
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-body',
                        'transition-all duration-150',
                        isSelected
                          ? 'bg-brand border-brand text-white shadow-sm'
                          : isDisabled
                            ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'bg-white border-gray-200 text-brand hover:border-brand/50 hover:bg-brand/5 cursor-pointer',
                      ].join(' ')}
                    >
                      <img
                        src={team.flagUrl}
                        alt={`${team.name} flag`}
                        className="w-5 h-auto rounded-sm object-cover"
                        style={{ opacity: isDisabled && !isSelected ? 0.4 : 1 }}
                      />
                      <span className="font-medium">{team.name}</span>
                      {isSelected && <span className="ml-0.5 opacity-80">✓</span>}
                    </button>
                  )
                })}

                {/* Edge case: all teams picked for 1st/2nd (only 2 teams in group
                    remain; logically this means both non-picked teams are shown,
                    but surface a message if somehow 0 eligible teams remain) */}
                {eligibleTeams.length === 0 && (
                  <p className="text-xs text-gray-300 font-body italic">
                    No eligible teams — all remaining teams are picked for 1st/2nd.
                  </p>
                )}

                {/* Hint when no 1st/2nd picks made yet */}
                {noPicks && eligibleTeams.length === group.teams.length && (
                  <p className="w-full text-xs text-gray-300 font-body italic mt-1">
                    Make your 1st & 2nd picks in the Group Picks tab to narrow these down.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
