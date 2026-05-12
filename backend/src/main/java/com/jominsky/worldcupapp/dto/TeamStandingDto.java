package com.jominsky.worldcupapp.dto;

/**
 * A single team's position and statistics within a group standing table.
 *
 * @param position       Current rank within the group (1–4)
 * @param team           Team identity and logo information
 * @param played         Matches played so far
 * @param wins           Matches won
 * @param draws          Matches drawn
 * @param losses         Matches lost
 * @param goalsFor       Total goals scored
 * @param goalsAgainst   Total goals conceded
 * @param goalDifference goalsFor minus goalsAgainst
 * @param points         Tournament points (3 per win, 1 per draw)
 */
public record TeamStandingDto(
        int position,
        TeamDto team,
        int played,
        int wins,
        int draws,
        int losses,
        int goalsFor,
        int goalsAgainst,
        int goalDifference,
        int points
) {}
