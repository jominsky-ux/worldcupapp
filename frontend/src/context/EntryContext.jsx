/**
 * src/context/EntryContext.jsx — Active Entry & Picks State
 * ===========================================================
 * Manages the user's fantasy entries and their picks. An entry is one
 * independent bracket + squad combination. Each user may have up to 3.
 *
 * LIFECYCLE:
 *   1. User logs in → useEffect fires → fetches entries from GET /api/entries.
 *   2. Picks for every entry are loaded in parallel from GET /api/entries/{id}/picks.
 *   3. The first entry is set as active by default.
 *   4. Every save action sends the change to the backend immediately, then
 *      updates local state optimistically so the UI responds instantly.
 *
 * BACKEND CONTRACT:
 *   EntryResponse      { id, entryNumber, name, createdAt }
 *   EntryPicksResponse { entryId, entryNumber, name,
 *                        groupStagePicks, thirdPlacePicks, knockoutPicks }
 *   GroupStagePickRequest  { groupId, firstPlaceTeamId, secondPlaceTeamId }
 *   ThirdPlacePickRequest  { picks: [{groupId, teamId}] }  ← backend requires exactly 8 pairs
 *   KnockoutPickRequest    { matchEventId, winnerTeamId }
 *
 * STILL MOCKED (no backend endpoint yet):
 *   saveFormation()  — formation is persisted as part of saveSquadPick()
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import apiClient from '../api/client'
import { SQUAD_RULES, FORMATIONS } from '../mocks/entries'
import { useTournamentInfo } from '../hooks/useGameData'

const EntryContext = createContext(null)

// ── Backend → frontend shape mapping ──────────────────────────────────────

/**
 * Maps a backend EntryPicksResponse into the shape that components consume.
 * The backend uses `matchEventId`; the frontend's existing components use `matchupId`.
 */
function mapPicks(picksResponse) {
  if (!picksResponse) {
    return { formation: null, squadPicks: [], groupPicks: [], thirdPlacePicks: [], bracketPicks: [] }
  }
  return {
    formation: picksResponse.formation ?? null,
    squadPicks: (picksResponse.squadPicks ?? []).map((s) => s.athleteId),
    groupPicks: (picksResponse.groupStagePicks ?? []).map((p) => ({
      groupId: p.groupId,
      firstPlaceTeamId: p.firstPlaceTeamId,
      secondPlaceTeamId: p.secondPlaceTeamId,
    })),
    thirdPlacePicks: (picksResponse.thirdPlacePicks ?? []).map((p) => ({
      groupId: p.groupId,
      teamId: p.teamId,
    })),
    bracketPicks: (picksResponse.knockoutPicks ?? []).map((p) => ({
      matchupId: p.matchEventId,
      winnerTeamId: p.winnerTeamId,
    })),
  }
}

/**
 * Merges a backend EntryResponse with its picks into the shape components expect.
 */
function mapEntry(entryResponse, picksResponse, totalPoints = 0) {
  return {
    id: entryResponse.id,
    entryNumber: entryResponse.entryNumber,
    name: entryResponse.name,
    createdAt: entryResponse.createdAt,
    totalPoints,
    ...mapPicks(picksResponse),
  }
}

// ── Provider ────────────────────────────────────────────────────────────────
export function EntryProvider({ children }) {
  const { user } = useAuth()

  const [entries, setEntries] = useState([])
  const [activeEntryId, setActiveEntryId] = useState(null)
  const [entriesLoading, setEntriesLoading] = useState(false)

  const { data: tournamentInfo } = useTournamentInfo()
  // VITE_DEV_PHASE in .env.local overrides the backend phase locally.
  // In production this env var is never set so the live backend value is used.
  const phase = import.meta.env.VITE_DEV_PHASE ?? tournamentInfo?.phase ?? 'PRE_TOURNAMENT'

  // ── Derived: the full active entry object ────────────────────────────────
  const activeEntry = entries.find((e) => e.id === activeEntryId) ?? null

  // ── Load entries when the user logs in or changes ────────────────────────
  useEffect(() => {
    if (!user) {
      setEntries([])
      setActiveEntryId(null)
      return
    }

    setEntriesLoading(true)

    apiClient.get('/api/entries')
      .then(async (res) => {
        const entryList = res.data   // List<EntryResponse>

        if (entryList.length === 0) {
          setEntries([])
          setActiveEntryId(null)
          return
        }

        // Fetch picks for all entries and scores in parallel.
        // A failed picks or scores fetch falls back gracefully.
        const [picksResults, scoresResult] = await Promise.all([
          Promise.all(
            entryList.map((entry) =>
              apiClient
                .get(`/api/entries/${entry.id}/picks`)
                .then((r) => r.data)
                .catch(() => null)
            )
          ),
          apiClient
            .get('/api/entries/scores')
            .then((r) => r.data)
            .catch(() => []),
        ])

        const scoreByEntryId = new Map(
          scoresResult.map((s) => [s.entryId, s.totalPoints])
        )

        const mapped = entryList.map((entry, i) =>
          mapEntry(entry, picksResults[i], scoreByEntryId.get(entry.id) ?? 0)
        )
        setEntries(mapped)
        setActiveEntryId(mapped[0].id)
      })
      .catch((err) => {
        console.error('Failed to load entries:', err)
        setEntries([])
        setActiveEntryId(null)
      })
      .finally(() => setEntriesLoading(false))
  }, [user?.id])

  // ── createEntry ──────────────────────────────────────────────────────────
  // POST /api/entries { name }
  const createEntry = useCallback(async (name) => {
    if (entries.length >= 3) {
      throw new Error('Maximum of 3 entries allowed per user')
    }
    const { data } = await apiClient.post('/api/entries', { name })
    const newEntry = mapEntry(data, null, 0)
    setEntries((prev) => [...prev, newEntry])
    setActiveEntryId(newEntry.id)
    return newEntry
  }, [entries.length])

  // ── saveGroupPick ─────────────────────────────────────────────────────────
  // PUT /api/entries/{id}/picks/groups { groupId, firstPlaceTeamId, secondPlaceTeamId }
  const saveGroupPick = useCallback(async (groupId, firstTeamId, secondTeamId) => {
    if (!activeEntryId) return

    await apiClient.put(`/api/entries/${activeEntryId}/picks/groups`, {
      groupId,
      firstPlaceTeamId: firstTeamId,
      secondPlaceTeamId: secondTeamId,
    })

    // Optimistic local update so the UI reflects the change immediately.
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== activeEntryId) return entry
        const existing = entry.groupPicks ?? []
        const updated = existing.some((p) => p.groupId === groupId)
          ? existing.map((p) =>
              p.groupId === groupId
                ? { ...p, firstPlaceTeamId: firstTeamId, secondPlaceTeamId: secondTeamId }
                : p
            )
          : [...existing, { groupId, firstPlaceTeamId: firstTeamId, secondPlaceTeamId: secondTeamId }]
        return { ...entry, groupPicks: updated }
      })
    )
  }, [activeEntryId])

  // ── saveThirdPlacePicks ───────────────────────────────────────────────────
  // PUT /api/entries/{id}/picks/third-place { picks: [{groupId, teamId}] }
  // The backend requires exactly 8 {groupId, teamId} pairs. Local state is
  // updated on every toggle so the UI stays responsive while the user is
  // still selecting. The backend is only called once all 8 are selected.
  const saveThirdPlacePicks = useCallback(async (picks) => {
    if (!activeEntryId) return

    setEntries((prev) =>
      prev.map((e) =>
        e.id !== activeEntryId ? e : { ...e, thirdPlacePicks: picks }
      )
    )

    if (picks.length === 8) {
      await apiClient.put(`/api/entries/${activeEntryId}/picks/third-place`, { picks })
    }
  }, [activeEntryId])

  // ── saveBracketPick ───────────────────────────────────────────────────────
  // PUT /api/entries/{id}/picks/knockout { matchEventId, winnerTeamId }
  // Components pass `matchupId`; the backend field is `matchEventId`.
  const saveBracketPick = useCallback(async (matchupId, winnerTeamId) => {
    if (!activeEntryId) return

    await apiClient.put(`/api/entries/${activeEntryId}/picks/knockout`, {
      matchEventId: matchupId,
      winnerTeamId,
    })

    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== activeEntryId) return entry
        const picks = entry.bracketPicks ?? []
        const updated = picks.some((p) => p.matchupId === matchupId)
          ? picks.map((p) =>
              p.matchupId === matchupId ? { ...p, winnerTeamId } : p
            )
          : [...picks, { matchupId, winnerTeamId }]
        return { ...entry, bracketPicks: updated }
      })
    )
  }, [activeEntryId])

  // ── saveFormation — still mock (no backend endpoint) ─────────────────────
  const saveFormation = useCallback(async (formationId) => {
    if (!FORMATIONS.find((f) => f.id === formationId)) {
      throw new Error(`Unknown formation: ${formationId}`)
    }
    setEntries((prev) =>
      prev.map((e) =>
        e.id === activeEntryId ? { ...e, formation: formationId } : e
      )
    )
  }, [activeEntryId])

  // ── saveSquadPick ─────────────────────────────────────────────────────────
  // PUT /api/entries/{id}/picks/squad { formation, players: [{position, athleteId}] }
  // Caller must supply [{athleteId, position}] so the context doesn't need the players list.
  const saveSquadPick = useCallback(async (players) => {
    if (!activeEntryId) return
    if (players.length !== SQUAD_RULES.total) {
      throw new Error(`Squad must have exactly ${SQUAD_RULES.total} players`)
    }

    const formation = entries.find((e) => e.id === activeEntryId)?.formation

    await apiClient.put(`/api/entries/${activeEntryId}/picks/squad`, { formation, players })

    setEntries((prev) =>
      prev.map((e) =>
        e.id === activeEntryId ? { ...e, squadPicks: players.map((p) => p.athleteId) } : e
      )
    )
  }, [activeEntryId, entries])

  const value = {
    entries,
    activeEntry,
    activeEntryId,
    setActiveEntryId,
    phase,
    entriesLoading,   // true while the initial entries + picks fetch is in flight
    createEntry,
    saveGroupPick,
    saveThirdPlacePicks,
    saveFormation,
    saveSquadPick,
    saveBracketPick,
  }

  return (
    <EntryContext.Provider value={value}>
      {children}
    </EntryContext.Provider>
  )
}

// ── Custom hook ────────────────────────────────────────────────────────────
export function useEntry() {
  const ctx = useContext(EntryContext)
  if (!ctx) {
    throw new Error('useEntry() must be used inside <EntryProvider>')
  }
  return ctx
}
