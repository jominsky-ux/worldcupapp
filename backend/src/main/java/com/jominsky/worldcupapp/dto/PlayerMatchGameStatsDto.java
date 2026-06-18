package com.jominsky.worldcupapp.dto;

import java.time.Instant;

/**
 * Per-game fantasy stats for one athlete, with match context for display.
 *
 * @param eventId                ESPN's numeric match identifier
 * @param opponentName           opponent team's full display name (empty if unresolved)
 * @param opponentAbbreviation   opponent team's three-letter code (empty if unresolved)
 * @param matchDate              kickoff time
 * @param totalPoints            fantasy points earned in this match
 * @param minutes                minutes played
 * @param goals                  goals scored
 * @param assists                assists recorded
 * @param defensiveInterventions tackles + interceptions + clearances
 * @param cleanSheet             true if the team conceded zero goals
 * @param saves                  goalkeeper saves
 * @param ownGoals               own goals conceded
 * @param yellowCards            yellow cards received
 * @param redCards               red cards received
 */
public record PlayerMatchGameStatsDto(
        String eventId,
        String opponentName,
        String opponentAbbreviation,
        Instant matchDate,
        int totalPoints,
        int minutes,
        int goals,
        int assists,
        int defensiveInterventions,
        boolean cleanSheet,
        int saves,
        int ownGoals,
        int yellowCards,
        int redCards
) {}
