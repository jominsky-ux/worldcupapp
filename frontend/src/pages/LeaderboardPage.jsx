/**
 * src/pages/LeaderboardPage.jsx — Global Leaderboard
 * ====================================================
 * Displays the ranked list of all users sorted by total points.
 * Points combine: group stage bracket points + knockout bracket points
 * + FPL player points.
 *
 * The leaderboard auto-refreshes every 2 minutes during the tournament
 * (configured in useLeaderboard() hook via refetchInterval).
 *
 * COLUMNS:
 *   Rank | Username | Entries | Total Points | Best Entry
 *
 * HIGHLIGHTING:
 * The logged-in user's rows are highlighted so they can quickly
 * find themselves in the table.
 *
 * Clicking an entry name opens EntryDetailModal with that entry's
 * points breakdown and squad roster.
 *
 * TODO:
 *   - Add pagination for large leagues
 *   - Add "My Rank" sticky header showing user's own position
 */

import { useState } from 'react'
import { useLeaderboard } from '../hooks/useGameData'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner, EntryDetailModal } from '../components/shared/SharedComponents'

export default function LeaderboardPage() {
  const { data: leaderboard = [], isLoading } = useLeaderboard()
  const { user } = useAuth()
  const [viewEntryId, setViewEntryId] = useState(null)

  if (isLoading) return <LoadingSpinner size="lg" label="Loading leaderboard…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body font-semibold text-3xl text-brand">
          Leaderboard
        </h1>
        <p className="text-gray-500 font-body mt-1">
          Updated every 2 minutes during live matches.
        </p>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-surface-secondary">
              <th className="text-left px-6 py-4 text-xs font-body font-semibold text-gray-500 uppercase tracking-wide w-16">
                Rank
              </th>
              <th className="text-left px-4 py-4 text-xs font-body font-semibold text-gray-500 uppercase tracking-wide">
                Player
              </th>
              <th className="text-right px-6 py-4 text-xs font-body font-semibold text-gray-500 uppercase tracking-wide">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row) => {
              const isMe = row.email === user?.email
              return (
                <tr
                  key={`${row.email}-${row.entryNumber}`}
                  className={[
                    'border-b border-gray-50 last:border-0 transition-colors',
                    isMe ? 'bg-gold/5' : 'hover:bg-surface-secondary',
                  ].join(' ')}
                >
                  <td className="px-6 py-4">
                    <span className={[
                      'tabular-nums font-semibold text-lg',
                      row.rank === 1 ? 'text-gold' : 'text-gray-400',
                    ].join(' ')}>
                      {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-body font-medium text-brand">
                        {row.username}
                      </span>
                      {isMe && (
                        <span className="badge bg-gold/15 text-gold-dark text-xs">You</span>
                      )}
                    </div>
                    <button
                      onClick={() => setViewEntryId(row.entryId)}
                      className="text-xs text-gray-400 font-body hover:text-brand hover:underline"
                    >
                      {row.entryName}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="tabular-nums font-semibold text-xl text-brand">
                      {row.totalPoints}
                    </span>
                    <span className="text-xs text-gray-400 font-body ml-1">pts</span>
                  </td>
                </tr>
              )
            })}

            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-16 text-gray-400 font-body">
                  No scores yet — check back once the tournament begins!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EntryDetailModal entryId={viewEntryId} onClose={() => setViewEntryId(null)} />
    </div>
  )
}
