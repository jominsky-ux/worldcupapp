/**
 * src/components/shared/CountdownBanner.jsx — Deadline Countdown
 * ================================================================
 * Displays a sticky banner below the Navbar when a deadline is
 * approaching (within 48 hours) or has just passed.
 *
 * Two deadlines exist:
 *   1. Group picks lock — at tournament kickoff (June 11, 2026)
 *   2. Bracket + player picks lock — at Round of 32 kickoff
 *
 * HOW THE TIMER WORKS:
 * We use React's useEffect hook with setInterval to update a countdown
 * every second. The effect cleans up the interval when the component
 * unmounts to prevent memory leaks.
 *
 * useEffect is how React handles "side effects" — operations that reach
 * outside the component (like timers, subscriptions, or DOM mutations).
 * The cleanup function returned from useEffect runs when the component
 * is removed from the page.
 *
 * date-fns:
 * We use the date-fns library to calculate time differences and format
 * dates. It's a utility library for working with JavaScript Date objects
 * in a readable way.
 */

import { useState, useEffect } from 'react'
import { formatDistanceToNow, isPast, isBefore, addHours } from 'date-fns'
import { useTournamentInfo } from '../../hooks/useGameData'

export default function CountdownBanner() {
  const { data: tournament } = useTournamentInfo()
  const [now, setNow] = useState(new Date())

  // Tick every second to keep the countdown live
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    // Cleanup: stop the interval when the banner unmounts
    return () => clearInterval(interval)
  }, [])

  if (!tournament?.deadlines) return null

  const { groupPicksLock, bracketPicksLock } = tournament.deadlines
  const groupDeadline = new Date(groupPicksLock)
  const bracketDeadline = new Date(bracketPicksLock)

  // Determine which deadline is most urgent
  let message = null
  let urgency = 'info' // 'info' | 'warning' | 'danger'

  if (tournament.groupPicksOpen && isBefore(groupDeadline, addHours(now, 48))) {
    const distance = formatDistanceToNow(groupDeadline, { addSuffix: true })
    message = `⏰ Group stage picks lock ${distance} — make sure your picks and squad picks are saved!`
    urgency = isBefore(groupDeadline, addHours(now, 6)) ? 'danger' : 'warning'
  } else if (tournament.bracketPicksOpen && !isPast(bracketDeadline)) {
    if (isBefore(bracketDeadline, addHours(now, 48))) {
      const distance = formatDistanceToNow(bracketDeadline, { addSuffix: true })
      message = `⏰ Bracket picks lock ${distance} — submit your bracket picks!`
      urgency = isBefore(bracketDeadline, addHours(now, 6)) ? 'danger' : 'warning'
    } else {
      message = '📬 Group stage is over — submit your bracket now!'
      urgency = 'info'
    }
  }

  if (!message) return null

  const colors = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
  }

  return (
    <div className={`border-b px-4 py-2 text-center text-sm font-body font-medium ${colors[urgency]}`}>
      {message}
    </div>
  )
}
