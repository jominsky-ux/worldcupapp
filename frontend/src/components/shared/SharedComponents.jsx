/**
 * src/components/shared/PhaseGate.jsx — Tournament Phase Lock
 * =============================================================
 * PhaseGate conditionally renders its children based on the current
 * tournament phase. If the phase doesn't allow the wrapped content,
 * it shows a locked message instead.
 *
 * Usage example:
 *   <PhaseGate allowedPhases={['PRE_TOURNAMENT', 'GROUP_STAGE']}>
 *     <GroupPicksForm />
 *   </PhaseGate>
 *
 * PHASES:
 *   PRE_TOURNAMENT — picks for group stage are open
 *   GROUP_STAGE    — tournament underway, group picks locked
 *   PRE_KNOCKOUT   — group stage done, bracket/squad picks now open
 *   KNOCKOUT       — all picks locked, live scoring active
 */

import { useEntry } from '../../context/EntryContext'

export function PhaseGate({ allowedPhases, readOnlyPhases = [], readOnlyMessage, children, lockedMessage }) {
  const { phase } = useEntry()

  if (!allowedPhases.includes(phase) && !readOnlyPhases.includes(phase)) {
    return (
      <div className="card border border-dashed border-gray-200 text-center py-12">
        <span className="text-4xl mb-3 block">🔒</span>
        <div className="text-gray-500 font-body">
          {lockedMessage ?? 'This section is locked for the current phase of the tournament.'}
        </div>
      </div>
    )
  }

  return (
    <>
      {readOnlyPhases.includes(phase) && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-gray-500 font-body">
            🔒 {readOnlyMessage ?? 'Your picks are locked and cannot be changed.'}
          </p>
        </div>
      )}
      {children}
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════

/**
 * src/components/shared/LoadingSpinner.jsx — Loading Indicator
 * =============================================================
 * A simple animated spinner shown while data is being fetched.
 * Used inside pages and components that display async data.
 *
 * SIZE VARIANTS:
 *   sm — 16px, used inline in buttons
 *   md — 32px (default), used in card placeholders
 *   lg — 48px, used for full-page loading states
 */

export function LoadingSpinner({ size = 'md', label = 'Loading...' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8" role="status">
      <div
        className={`${sizes[size]} border-2 border-gray-200 border-t-gold rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="text-sm text-gray-400 font-body">{label}</span>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════

/**
 * src/components/shared/PlayerCard.jsx — Player Display Card
 * ============================================================
 * Displays a single player's information — name, team, position,
 * club, and current FPL points total.
 *
 * PROPS:
 *   player      — player object from mocks/players.js
 *   selected    — boolean, true if this player is in the user's squad
 *   onToggle    — function called when user clicks to add/remove player
 *   disabled    — boolean, true if squad position limit is reached
 *   onViewStats — optional function called when the user clicks the
 *                 per-game stats button; when provided and the player is
 *                 selected, a small stats button is shown on the card
 *
 * POSITION COLORS:
 * Each position has a distinct color to help users quickly scan
 * their squad by position type.
 */

import { POSITION_CONFIG } from '../../mocks/players'

export function PlayerCard({ player, selected = false, onToggle, disabled = false, onViewStats }) {
  const posConfig = POSITION_CONFIG[player.position]

  return (
    <button
      onClick={() => onToggle?.(player)}
      disabled={disabled && !selected}
      className={[
        'w-full text-left rounded-xl border p-4 transition-all duration-200',
        'hover:shadow-card-hover active:scale-[0.98]',
        selected
          ? 'border-gold bg-gold/5 shadow-gold/20 shadow-sm'
          : 'border-gray-100 bg-surface hover:border-gray-200',
        disabled && !selected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Player info */}
        <div className="min-w-0">
          <p className="font-body font-semibold text-brand text-sm truncate">
            {player.name}
          </p>
          <p className="text-xs text-gray-400 font-body mt-0.5 truncate">
            {player.teamCode} · {player.club}
          </p>
        </div>

        {/* Position badge + points */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`badge text-xs ${posConfig.color}`}>
            {posConfig.label}
          </span>
          <span className="tabular-nums text-xs font-semibold text-brand">
            {player.totalPoints} pts
          </span>
        </div>
      </div>

      {/* Selection indicator + stats button */}
      {selected && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
            <span className="text-xs text-gold font-body font-medium">In squad</span>
          </div>
          {onViewStats && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onViewStats(player)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  e.preventDefault()
                  onViewStats(player)
                }
              }}
              className="text-xs font-body font-medium text-gray-400 hover:text-brand underline"
            >
              View stats
            </span>
          )}
        </div>
      )}
    </button>
  )
}

// ═════════════════════════════════════════════════════════════════════════════

/**
 * src/components/shared/PlayerMatchStatsModal.jsx — Per-Game Stats Table
 * =========================================================================
 * Shown when a user clicks "View stats" on a squad player. Displays one row
 * per completed match the player has appeared in, with opponent/date context
 * plus the full FPL stat breakdown for that match.
 *
 * PROPS:
 *   player  — player object (must have `id` and `name`); modal is hidden when null
 *   onClose — function called when the user dismisses the modal
 */

import { usePlayerMatchHistory } from '../../hooks/useGameData'

export function PlayerMatchStatsModal({ player, onClose }) {
  const { data: matches = [], isLoading } = usePlayerMatchHistory(player?.id)

  if (!player) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="card max-w-4xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-body font-semibold text-xl text-brand">{player.name}</h2>
            <p className="text-sm text-gray-400 font-body">{player.teamCode} · Match-by-match stats</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading match history…" />
        ) : matches.length === 0 ? (
          <p className="text-gray-400 font-body text-center py-8">
            No completed matches recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                  <th className="py-2 pr-3">Opponent</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3 text-right">Pts</th>
                  <th className="py-2 pr-3 text-right">Min</th>
                  <th className="py-2 pr-3 text-right">G</th>
                  <th className="py-2 pr-3 text-right">A</th>
                  <th className="py-2 pr-3 text-right">DC</th>
                  <th className="py-2 pr-3 text-right">CS</th>
                  <th className="py-2 pr-3 text-right">Sv</th>
                  <th className="py-2 pr-3 text-right">OG</th>
                  <th className="py-2 pr-3 text-right">YC</th>
                  <th className="py-2 pr-3 text-right">RC</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.eventId} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-3 text-brand font-medium whitespace-nowrap">
                      {m.opponentName || 'TBD'}
                    </td>
                    <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">
                      {m.matchDate ? new Date(m.matchDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums font-semibold text-brand">{m.totalPoints}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.minutes}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.goals}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.assists}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.defensiveInterventions}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.cleanSheet ? '✓' : ''}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.saves}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.ownGoals}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.yellowCards}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.redCards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════

/**
 * src/components/shared/EntryDetailModal.jsx — Per-Entry Score Breakdown
 * =========================================================================
 * Shown when a user clicks an entry name on the leaderboard. Displays the
 * group-stage points, 3rd-place points, bracket points, and squad roster
 * (name, position, points) ordered by position for that entry.
 *
 * PROPS:
 *   entryId — UUID of the entry to show; modal is hidden when null
 *   onClose — function called when the user dismisses the modal
 */

import { useEntryDetail } from '../../hooks/useGameData'

export function EntryDetailModal({ entryId, onClose }) {
  const { data: detail, isLoading } = useEntryDetail(entryId)

  if (!entryId) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-body font-semibold text-xl text-brand">
              {detail?.name ?? 'Entry'}
            </h2>
            <p className="text-sm text-gray-400 font-body">Points breakdown</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading entry…" />
        ) : !detail ? (
          <p className="text-gray-400 font-body text-center py-8">Entry not found.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl bg-surface-secondary p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-brand">{detail.groupPoints}</p>
                <p className="text-xs text-gray-400 font-body mt-1">Group Stage</p>
              </div>
              <div className="rounded-xl bg-surface-secondary p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-brand">{detail.thirdPlacePoints}</p>
                <p className="text-xs text-gray-400 font-body mt-1">3rd Place</p>
              </div>
              <div className="rounded-xl bg-surface-secondary p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-brand">{detail.bracketPoints}</p>
                <p className="text-xs text-gray-400 font-body mt-1">Bracket</p>
              </div>
            </div>

            <h3 className="font-body font-semibold text-sm text-brand mb-2">
              Squad — {detail.squadPoints} pts
            </h3>
            {detail.squad.length === 0 ? (
              <p className="text-gray-400 font-body text-center py-6">No squad picks yet.</p>
            ) : (
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                    <th className="py-2 pr-3">Player</th>
                    <th className="py-2 pr-3">Pos</th>
                    <th className="py-2 pr-3 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.squad.map((p) => (
                    <tr key={p.athleteId} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-3 text-brand font-medium">{p.name}</td>
                      <td className="py-2 pr-3 text-gray-500">{p.position}</td>
                      <td className="py-2 pr-3 text-right tabular-nums font-semibold text-brand">
                        {p.totalPoints}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════

/**
 * src/components/shared/TeamBadge.jsx — Team Flag + Name Display
 * ===============================================================
 * Small reusable component showing a country flag emoji and name.
 * Used in group cards, bracket slots, and squad player cards.
 *
 * PROPS:
 *   team    — team object { name, code, flagEmoji }
 *   size    — 'sm' | 'md' (default)
 *   showCode — boolean, shows 3-letter code instead of full name
 */

export function TeamBadge({ team, size = 'md', showCode = false }) {
  if (!team) {
    return (
      <span className="text-gray-300 font-body text-sm italic">TBD</span>
    )
  }

  const sizeClasses = {
    sm: 'text-sm gap-1.5',
    md: 'text-base gap-2',
  }

  return (
    <span className={`inline-flex items-center font-body ${sizeClasses[size]}`}>
      <span className="text-lg leading-none" role="img" aria-label={team.name}>
        {team.flagEmoji}
      </span>
      <span className="font-medium text-brand">
        {showCode ? team.code : team.name}
      </span>
    </span>
  )
}
