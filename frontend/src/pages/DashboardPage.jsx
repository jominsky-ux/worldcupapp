/**
 * src/pages/DashboardPage.jsx — User Dashboard
 * ==============================================
 * The dashboard is the first page a user sees after logging in.
 * It shows:
 *   - A welcome message with the current tournament phase
 *   - Cards for each of the user's entries (up to 3)
 *   - A "Create entry" button if the user has fewer than 3 entries
 *   - Quick stats and next steps based on the current phase
 *
 * ENTRY CARDS:
 * Each entry card shows:
 *   - Entry name and total points
 *   - Group picks completion status
 *   - Bracket picks completion status
 *   - Squad completion status
 *   - A link to edit each section
 *
 * PHASE AWARENESS:
 * The dashboard shows different call-to-action messages depending on
 * the tournament phase. This avoids confusing users about what they
 * can/should be doing right now.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEntry } from '../context/EntryContext'
import { useTournamentInfo } from '../hooks/useGameData'
import { LoadingSpinner } from '../components/shared/SharedComponents'
import { GROUPS } from '../mocks/teams'

// ── Phase messaging ────────────────────────────────────────────────────────
const PHASE_INFO = {
  PRE_TOURNAMENT: {
    label: '🌍 Group Stage Picks Open',
    description: 'Pick your group winners, runners-up and squad before the tournament kicks off.',
    cta: { to: '/group-stage', text: 'Make Group Picks' },
  },
  GROUP_STAGE: {
    label: '⚽ Group Stage Underway',
    description: 'Matches are being played. Your group picks are locked.',
    cta: null,
  },
  PRE_KNOCKOUT: {
    label: '📋 Submit Your Bracket',
    description: 'Group stage is over! Now pick your brackets.',
    cta: { to: '/bracket', text: 'Submit Bracket' },
  },
  KNOCKOUT: {
    label: '🏆 Knockout Stage Live',
    description: 'All picks are locked. Watch the points roll in!',
    cta: { to: '/leaderboard', text: 'View Leaderboard' },
  },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { entries, activeEntryId, setActiveEntryId, createEntry, phase } = useEntry()
  const { data: tournament, isLoading } = useTournamentInfo()
  const [creating, setCreating] = useState(false)
  const [newEntryName, setNewEntryName] = useState('')
  const [createError, setCreateError] = useState(null)

  const phaseInfo = PHASE_INFO[phase] ?? PHASE_INFO.PRE_TOURNAMENT

  const handleCreateEntry = async (e) => {
    e.preventDefault()
    if (!newEntryName.trim()) return
    try {
      await createEntry(newEntryName.trim())
      setNewEntryName('')
      setCreating(false)
    } catch (err) {
      setCreateError(err.message)
    }
  }

  if (isLoading) return <LoadingSpinner size="lg" label="Loading dashboard..." />

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-body font-semibold text-3xl text-brand">
            Welcome back, {user?.username}
          </h1>
          <p className="text-gray-500 font-body mt-1">{phaseInfo.description}</p>
        </div>
        {phaseInfo.cta && (
          <Link to={phaseInfo.cta.to} className="btn-primary shrink-0">
            {phaseInfo.cta.text}
          </Link>
        )}
      </div>

      {/* Phase badge */}
      <div className="bg-brand text-white rounded-2xl px-6 py-4 flex items-center gap-3">
        <span className="font-body font-semibold">{phaseInfo.label}</span>
      </div>

      {/* Entry cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-body font-semibold text-xl text-brand">
            Your Entries
          </h2>
          <span className="text-sm text-gray-400 font-body">
            {entries.length} / 3 used
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              isActive={entry.id === activeEntryId}
              onSelect={() => setActiveEntryId(entry.id)}
              phase={phase}
            />
          ))}

          {/* Create entry CTA */}
          {entries.length < 3 && phase === 'PRE_TOURNAMENT' && (
            <div className="card border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center min-h-[200px]">
              {creating ? (
                <form onSubmit={handleCreateEntry} className="w-full space-y-3">
                  <input
                    type="text"
                    value={newEntryName}
                    onChange={(e) => {
                      setNewEntryName(e.target.value)
                      setCreateError(null)
                    }}
                    placeholder="Entry name (e.g. My Dark Horses)"
                    className="input-field text-sm"
                    autoFocus
                    maxLength={40}
                  />
                  {createError && (
                    <p className="text-xs text-red-500 font-body">{createError}</p>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1 text-sm py-2">
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCreating(false); setNewEntryName('') }}
                      className="btn-secondary flex-1 text-sm py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <span className="text-4xl mb-3">+</span>
                  <p className="text-gray-400 font-body text-sm mb-4">
                    Create a new entry
                  </p>
                  <button
                    onClick={() => setCreating(true)}
                    className="btn-secondary text-sm"
                  >
                    New Entry
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scoring reference */}
      <ScoringReference />
    </div>
  )
}

// ── EntryCard sub-component ────────────────────────────────────────────────
function EntryCard({ entry, isActive, onSelect, phase }) {
  const groupPicksCount = (entry.groupPicks ?? []).filter(
    (p) => p.firstPlaceTeamId && p.secondPlaceTeamId
  ).length
  const totalGroups = GROUPS.length // 12

  const squadCount = (entry.squadPicks ?? []).length
  const bracketCount = (entry.bracketPicks ?? []).length

  return (
    <div
      className={[
        'card border-2 transition-all duration-200 cursor-pointer hover:shadow-card-hover',
        isActive ? 'border-gold shadow-gold/20' : 'border-transparent',
      ].join(' ')}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-body font-semibold text-brand">{entry.name}</h3>
          {isActive && (
            <span className="badge bg-gold/10 text-gold-dark text-xs mt-1">Active</span>
          )}
        </div>
        <span className="tabular-nums text-2xl font-semibold text-brand">
          {entry.totalPoints}
          <span className="text-sm font-body text-gray-400 ml-1">pts</span>
        </span>
      </div>

      {/* Completion checklist */}
      <ul className="space-y-2">
        <CheckItem
          done={groupPicksCount === totalGroups}
          label={`Group picks (${groupPicksCount}/${totalGroups} groups)`}
          href="/group-stage"
        />
        <CheckItem
          done={squadCount === 11}
          label={`Squad (${squadCount}/11 players)`}
          href="/squad"
          locked={phase === 'GROUP_STAGE'}
        />
        <CheckItem
          done={bracketCount === 31}
          label={`Bracket (${bracketCount}/31 picks)`}
          href="/bracket"
          locked={phase === 'PRE_TOURNAMENT' || phase === 'GROUP_STAGE'}
        />
      </ul>
    </div>
  )
}

function CheckItem({ done, label, href, locked = false }) {
  return (
    <li className="flex items-center gap-2 text-sm font-body">
      <span className={[
        'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0',
        done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300',
      ].join(' ')}>
        {done && '✓'}
      </span>
      <span className={done ? 'text-gray-500 line-through' : 'text-gray-700'}>
        {label}
      </span>
      {locked && <span className="text-gray-300 text-xs">(locked)</span>}
    </li>
  )
}

// ── Scoring Reference ──────────────────────────────────────────────────────
function ScoringReference() {
  return (
    <div className="card">
      <h2 className="font-body font-semibold text-lg text-brand mb-4">Scoring Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-body font-medium text-sm text-gray-500 uppercase tracking-wide mb-2">
            Group Stage
          </h3>
          <ul className="space-y-1 text-sm font-body">
            <li className="flex justify-between"><span>Correct group winner</span><span className="tabular-nums font-semibold">+4 pts</span></li>
            <li className="flex justify-between"><span>Correct runner-up</span><span className="tabular-nums font-semibold">+2 pts</span></li>
            <li className="flex justify-between"><span>All 24 correct bonus</span><span className="tabular-nums font-semibold text-gold">+20 pts</span></li>
          </ul>
        </div>
        <div>
          <h3 className="font-body font-medium text-sm text-gray-500 uppercase tracking-wide mb-2">
            3rd Place Qualifiers
          </h3>
          <ul className="space-y-1 text-sm font-body">
            <li className="flex justify-between"><span>Each correct pick</span><span className="tabular-nums font-semibold">+1 pt</span></li>
            <li className="flex justify-between"><span>All 8 correct bonus</span><span className="tabular-nums font-semibold text-gold">+10 pts</span></li>
          </ul>
        </div>
        <div>
          <h3 className="font-body font-medium text-sm text-gray-500 uppercase tracking-wide mb-2">
            Bracket (per correct pick)
          </h3>
          <ul className="space-y-1 text-sm font-body">
            {[['R32', 4], ['R16', 8], ['QF', 16], ['SF', 32], ['Final', 64]].map(
              ([round, pts]) => (
                <li key={round} className="flex justify-between">
                  <span>{round}</span>
                  <span className="tabular-nums font-semibold">+{pts} pts</span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
