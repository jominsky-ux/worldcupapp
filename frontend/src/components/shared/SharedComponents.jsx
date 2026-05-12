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
        <p className="text-gray-500 font-body">
          {lockedMessage ?? 'This section is locked for the current phase of the tournament.'}
        </p>
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
 *   player   — player object from mocks/players.js
 *   selected — boolean, true if this player is in the user's squad
 *   onToggle — function called when user clicks to add/remove player
 *   disabled — boolean, true if squad position limit is reached
 *
 * POSITION COLORS:
 * Each position has a distinct color to help users quickly scan
 * their squad by position type.
 */

import { POSITION_CONFIG } from '../../mocks/players'

export function PlayerCard({ player, selected = false, onToggle, disabled = false }) {
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

      {/* Selection indicator */}
      {selected && (
        <div className="mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
          <span className="text-xs text-gold font-body font-medium">In squad</span>
        </div>
      )}
    </button>
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
