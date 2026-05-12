/**
 * src/mocks/players.js — Mock Player Data
 * =========================================
 * This file provides a sample roster of players that simulates what
 * the backend will return from API-Football.
 *
 * POSITIONS:
 * Players have one of four positions, matching FPL (Fantasy Premier League):
 *   GK  — Goalkeeper    (pick 1 in your squad of 11)
 *   DEF — Defender      (pick 3-5)
 *   MID — Midfielder    (pick 3-5)
 *   FWD — Forward       (pick 1-3)
 *
 * FPL POINT SYSTEM (reference):
 *   Playing 60+ min:    +2 pts
 *   Playing < 60 min:   +1 pt
 *   Goal (GK/DEF):      +6 pts
 *   Goal (MID):         +5 pts
 *   Goal (FWD):         +4 pts
 *   Assist:             +3 pts
 *   Clean sheet (GK/DEF): +4 pts
 *   Clean sheet (MID):  +1 pt
 *   Yellow card:        -1 pt
 *   Red card:           -3 pts
 *   Own goal:           -2 pts
 *   Saves (GK, per 3):  +1 pt
 *   Penalty save (GK):  +5 pts
 *   Penalty miss:       -2 pts
 *   Bonus points:       +1 to +3 (top 3 performers per match)
 *
 * DATA SHAPE:
 * Each player object contains:
 *   id         — unique identifier
 *   name       — full display name
 *   teamId     — links to a team in teams.js
 *   teamCode   — 3-letter code for quick display
 *   position   — "GK" | "DEF" | "MID" | "FWD"
 *   club       — club team name (for context / recognition)
 *   age        — player age
 *   totalPoints — cumulative FPL-style points this tournament (mock: 0 to start)
 *   stats      — season stats for display on PlayerCard
 */

export const PLAYERS = [
  // ── GOALKEEPERS ──────────────────────────────────────────────────────────
  {
    id: 101, name: 'Emiliano Martínez', teamId: 5, teamCode: 'ARG',
    position: 'GK', club: 'Aston Villa', age: 32,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 102, name: 'Manuel Neuer', teamId: 17, teamCode: 'GER',
    position: 'GK', club: 'Bayern Munich', age: 39,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 103, name: 'Thibaut Courtois', teamId: 22, teamCode: 'BEL',
    position: 'GK', club: 'Real Madrid', age: 33,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 104, name: 'Mike Maignan', teamId: 13, teamCode: 'FRA',
    position: 'GK', club: 'AC Milan', age: 29,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 105, name: 'Jordan Pickford', teamId: 21, teamCode: 'ENG',
    position: 'GK', club: 'Everton', age: 32,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 106, name: 'Unai Simón', teamId: 9, teamCode: 'ESP',
    position: 'GK', club: 'Athletic Club', age: 27,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },

  // ── DEFENDERS ────────────────────────────────────────────────────────────
  {
    id: 201, name: 'Virgil van Dijk', teamId: 18, teamCode: 'NED',
    position: 'DEF', club: 'Liverpool', age: 33,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 202, name: 'Rúben Dias', teamId: 14, teamCode: 'POR',
    position: 'DEF', club: 'Man City', age: 27,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 203, name: 'Marquinhos', teamId: 10, teamCode: 'BRA',
    position: 'DEF', club: 'PSG', age: 31,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 204, name: 'Achraf Hakimi', teamId: 23, teamCode: 'MAR',
    position: 'DEF', club: 'PSG', age: 26,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 205, name: 'Cristian Romero', teamId: 5, teamCode: 'ARG',
    position: 'DEF', club: 'Tottenham', age: 27,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 206, name: 'Alphonso Davies', teamId: 35, teamCode: 'CAN',
    position: 'DEF', club: 'Bayern Munich', age: 24,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 207, name: 'Theo Hernández', teamId: 13, teamCode: 'FRA',
    position: 'DEF', club: 'AC Milan', age: 27,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 208, name: 'Dani Carvajal', teamId: 9, teamCode: 'ESP',
    position: 'DEF', club: 'Real Madrid', age: 33,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 209, name: 'Antonio Rüdiger', teamId: 17, teamCode: 'GER',
    position: 'DEF', club: 'Real Madrid', age: 32,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 210, name: 'Kyle Walker', teamId: 21, teamCode: 'ENG',
    position: 'DEF', club: 'Man City', age: 34,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },

  // ── MIDFIELDERS ──────────────────────────────────────────────────────────
  {
    id: 301, name: 'Pedri', teamId: 9, teamCode: 'ESP',
    position: 'MID', club: 'Barcelona', age: 23,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 302, name: 'Jude Bellingham', teamId: 21, teamCode: 'ENG',
    position: 'MID', club: 'Real Madrid', age: 22,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 303, name: 'Luka Modrić', teamId: 29, teamCode: 'CRO',
    position: 'MID', club: 'Real Madrid', age: 40,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 304, name: 'Vinícius Jr.', teamId: 10, teamCode: 'BRA',
    position: 'MID', club: 'Real Madrid', age: 25,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 305, name: 'Kevin De Bruyne', teamId: 22, teamCode: 'BEL',
    position: 'MID', club: 'Man City', age: 34,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 306, name: 'Gavi', teamId: 9, teamCode: 'ESP',
    position: 'MID', club: 'Barcelona', age: 21,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 307, name: 'Enzo Fernández', teamId: 5, teamCode: 'ARG',
    position: 'MID', club: 'Chelsea', age: 24,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 308, name: 'Joshua Kimmich', teamId: 17, teamCode: 'GER',
    position: 'MID', club: 'Bayern Munich', age: 30,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 309, name: 'Aurélien Tchouaméni', teamId: 13, teamCode: 'FRA',
    position: 'MID', club: 'Real Madrid', age: 25,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 310, name: 'Rodri', teamId: 9, teamCode: 'ESP',
    position: 'MID', club: 'Man City', age: 29,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 311, name: 'Christian Pulisic', teamId: 1, teamCode: 'USA',
    position: 'MID', club: 'AC Milan', age: 27,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 312, name: 'Alexis Mac Allister', teamId: 5, teamCode: 'ARG',
    position: 'MID', club: 'Liverpool', age: 26,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },

  // ── FORWARDS ─────────────────────────────────────────────────────────────
  {
    id: 401, name: 'Kylian Mbappé', teamId: 13, teamCode: 'FRA',
    position: 'FWD', club: 'Real Madrid', age: 27,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 402, name: 'Erling Haaland', teamId: 30, teamCode: 'NOR',
    position: 'FWD', club: 'Man City', age: 25,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 403, name: 'Harry Kane', teamId: 21, teamCode: 'ENG',
    position: 'FWD', club: 'Bayern Munich', age: 32,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 404, name: 'Cristiano Ronaldo', teamId: 14, teamCode: 'POR',
    position: 'FWD', club: 'Al Nassr', age: 41,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 405, name: 'Robert Lewandowski', teamId: 37, teamCode: 'POL',
    position: 'FWD', club: 'Barcelona', age: 38,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 406, name: 'Lamine Yamal', teamId: 9, teamCode: 'ESP',
    position: 'FWD', club: 'Barcelona', age: 18,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 407, name: 'Richarlison', teamId: 10, teamCode: 'BRA',
    position: 'FWD', club: 'Tottenham', age: 28,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 408, name: 'Julián Álvarez', teamId: 5, teamCode: 'ARG',
    position: 'FWD', club: 'Atlético Madrid', age: 25,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 409, name: 'Bukayo Saka', teamId: 21, teamCode: 'ENG',
    position: 'FWD', club: 'Arsenal', age: 24,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
  {
    id: 410, name: 'Ousmane Dembélé', teamId: 13, teamCode: 'FRA',
    position: 'FWD', club: 'PSG', age: 28,
    totalPoints: 0,
    stats: { appearances: 0, cleanSheets: 0, saves: 0, goals: 0, assists: 0 },
  },
]

// ── Helper functions ──────────────────────────────────────────────────────

// Filter players by position
export const getPlayersByPosition = (position) =>
  PLAYERS.filter((p) => p.position === position)

// Find a single player by ID
export const getPlayerById = (id) =>
  PLAYERS.find((p) => p.id === id) ?? null

// Get all players for a specific national team
export const getPlayersByTeam = (teamId) =>
  PLAYERS.filter((p) => p.teamId === teamId)

// Position display config (colors, labels) — used in badges across the app
export const POSITION_CONFIG = {
  GK: { label: 'GK', color: 'bg-amber-100 text-amber-800', full: 'Goalkeeper' },
  DEF: { label: 'DEF', color: 'bg-blue-100 text-blue-800', full: 'Defender' },
  MID: { label: 'MID', color: 'bg-green-100 text-green-800', full: 'Midfielder' },
  FWD: { label: 'FWD', color: 'bg-red-100 text-red-800', full: 'Forward' },
}
