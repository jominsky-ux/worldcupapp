/**
 * src/mocks/teams.js — Mock Team and Group Data
 * ================================================
 * This file provides fake data that mimics what the real backend API
 * will return for the 2026 FIFA World Cup groups and teams.
 *
 * WHY MOCKS?
 * When building the frontend before the backend is ready, we need
 * something that "looks like" real API responses so our components
 * can be developed and tested. When the backend is ready, we swap
 * the mock data for real API calls — the components don't change.
 *
 * 2026 FORMAT:
 * The 2026 World Cup has 48 teams split into 12 groups of 4.
 * The top 2 teams from each group advance, plus 8 best third-place teams,
 * giving 32 teams for the Round of 32 knockout stage.
 *
 * DATA SHAPE:
 * Each group has:
 *   - id:     unique string identifier (e.g. "A")
 *   - name:   display name (e.g. "Group A")
 *   - teams:  array of 4 team objects
 *
 * Each team has:
 *   - id:         unique number (matches API-Football team IDs where possible)
 *   - name:       full country name
 *   - code:       3-letter FIFA code
 *   - flagEmoji:  country flag emoji for quick visual display
 *   - flagUrl:    URL for the flag image (will come from API-Football in prod)
 *   - fifaRank:   FIFA world ranking (March 2025 estimate)
 */

export const GROUPS = [
  {
    id: 'A',
    name: 'Group A',
    teams: [
      { id: 1, name: 'Mexico', code: 'MEX', flagEmoji: '🇲🇽', flagUrl: 'https://flagcdn.com/w40/mx.png', fifaRank: 15 },
      { id: 2, name: 'South Africa', code: 'RSA', flagEmoji: '🇿🇦', flagUrl: 'https://flagcdn.com/w40/za.png', fifaRank: 60 },
      { id: 3, name: 'South Korea', code: 'KOR', flagEmoji: '🇰🇷', flagUrl: 'https://flagcdn.com/w40/kr.png', fifaRank: 25 },
      { id: 4, name: 'Czechia', code: 'CZE', flagEmoji: 'c🇿', flagUrl: 'https://flagcdn.com/w40/cz.png', fifaRank: 41 },
    ],
  },
  {
    id: 'B',
    name: 'Group B',
    teams: [
      { id: 5, name: 'Canada', code: 'CAN', flagEmoji: '🇨🇦', flagUrl: 'https://flagcdn.com/w40/ca.png', fifaRank: 30 },
      { id: 6, name: 'Bosnia and Herzegovina', code: 'BIH', flagEmoji: '🇧🇦', flagUrl: 'https://flagcdn.com/w40/ba.png', fifaRank: 65 },
      { id: 7, name: 'Qatar', code: 'QAT', flagEmoji: '🇶🇦', flagUrl: 'https://flagcdn.com/w40/qa.png', fifaRank: 55 },
      { id: 8, name: 'Switzerland', code: 'SUI', flagEmoji: '🇨🇭', flagUrl: 'https://flagcdn.com/w40/ch.png', fifaRank: 19 },
    ],
  },
  {
    id: 'C',
    name: 'Group C',
    teams: [
      { id: 9, name: 'Brazil', code: 'BRA', flagEmoji: '🇧🇷', flagUrl: 'https://flagcdn.com/w40/br.png', fifaRank: 6 },
      { id: 10, name: 'Morocco', code: 'MAR', flagEmoji: '🇲🇦', flagUrl: 'https://flagcdn.com/w40/ma.png', fifaRank: 8 },
      { id: 11, name: 'Haiti', code: 'HTI', flagEmoji: 'haiti', flagUrl: 'https://flagcdn.com/w40/ht.png', fifaRank: 83 },
      { id: 12, name: 'Scotland', code: 'SCO', flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagUrl: 'https://flagcdn.com/w40/sx.png', fifaRank: 43 },
    ],
  },
  {
    id: 'D',
    name: 'Group D',
    teams: [
      { id: 13, name: 'United States', code: 'USA', flagEmoji: '🇺🇸', flagUrl: 'https://flagcdn.com/w40/us.png', fifaRank: 16 },
      { id: 14, name: 'Paraguay', code: 'PAR', flagEmoji: '🇵🇾', flagUrl: 'https://flagcdn.com/w40/py.png', fifaRank: 40 },
      { id: 15, name: 'Australia', code: 'AUS', flagEmoji: '🇦🇺', flagUrl: 'https://flagcdn.com/w40/au.png', fifaRank: 27 },
      { id: 16, name: 'Türkiye', code: 'TUR', flagEmoji: '🇹🇷', flagUrl: 'https://flagcdn.com/w40/tr.png', fifaRank: 22 },
    ],
  },
  {
    id: 'E',
    name: 'Group E',
    teams: [
      { id: 17, name: 'Germany', code: 'GER', flagEmoji: '🇩🇪', flagUrl: 'https://flagcdn.com/w40/de.png', fifaRank: 10 },
      { id: 18, name: 'Curaçao', code: 'CUW', flagEmoji: '🇨🇼', flagUrl: 'https://flagcdn.com/w40/cw.png', fifaRank: 82 },
      { id: 19, name: 'Ivory Coast', code: 'CIV', flagEmoji: '🇨🇮', flagUrl: 'https://flagcdn.com/w40/ci.png', fifaRank: 34 },
      { id: 20, name: 'Ecuador', code: 'ECU', flagEmoji: '🇪🇨', flagUrl: 'https://flagcdn.com/w40/ec.png', fifaRank: 23 },
    ],
  },
  {
    id: 'F',
    name: 'Group F',
    teams: [
      { id: 21, name: 'Netherlands', code: 'NED', flagEmoji: '🇳🇱', flagUrl: 'https://flagcdn.com/w40/nl.png', fifaRank: 7 },
      { id: 22, name: 'Japan', code: 'JPN', flagEmoji: '🇯🇵', flagUrl: 'https://flagcdn.com/w40/jp.png', fifaRank: 17 },
      { id: 23, name: 'Sweden', code: 'SWE', flagEmoji: '🇸🇪', flagUrl: 'https://flagcdn.com/w40/se.png', fifaRank: 38 },
      { id: 24, name: 'Tunisia', code: 'TUN', flagEmoji: 'تونس', flagUrl: 'https://flagcdn.com/w40/tn.png', fifaRank: 44 },
    ],
  },
  {
    id: 'G',
    name: 'Group G',
    teams: [
      { id: 25, name: 'Belgium', code: 'BEL', flagEmoji: '🇧🇪', flagUrl: 'https://flagcdn.com/w40/be.png', fifaRank: 9 },
      { id: 26, name: 'Egypt', code: 'EGY', flagEmoji: '🇪🇬', flagUrl: 'https://flagcdn.com/w40/eg.png', fifaRank: 29 },
      { id: 27, name: 'Iran', code: 'IRN', flagEmoji: '🇮🇷', flagUrl: 'https://flagcdn.com/w40/ir.png', fifaRank: 21 },
      { id: 28, name: 'New Zealand', code: 'NZL', flagEmoji: '🇳🇿', flagUrl: 'https://flagcdn.com/w40/nz.png', fifaRank: 85 },
    ],
  },
  {
    id: 'H',
    name: 'Group H',
    teams: [
      { id: 29, name: 'Spain', code: 'ESP', flagEmoji: '🇪🇸', flagUrl: 'https://flagcdn.com/w40/es.png', fifaRank: 2 },
      { id: 30, name: 'Cape Verde', code: 'CPV', flagEmoji: '🇵🇹', flagUrl: 'https://flagcdn.com/w40/cv.png', fifaRank: 69 },
      { id: 31, name: 'Saudi Arabia', code: 'KSA', flagEmoji: '🇸🇦', flagUrl: 'https://flagcdn.com/w40/sa.png', fifaRank: 61 },
      { id: 32, name: 'Uruguay', code: 'URU', flagEmoji: '🇺🇾', flagUrl: 'https://flagcdn.com/w40/uy.png', fifaRank: 17 },
    ],
  },
  {
    id: 'I',
    name: 'Group I',
    teams: [
      { id: 33, name: 'France', code: 'FRA', flagEmoji: '🇫🇷', flagUrl: 'https://flagcdn.com/w40/fr.png', fifaRank: 1 },
      { id: 34, name: 'Senegal', code: 'SEN', flagEmoji: '🇸🇳', flagUrl: 'https://flagcdn.com/w40/sn.png', fifaRank: 14 },
      { id: 35, name: 'Iraq', code: 'IRQ', flagEmoji: '🇮🇶', flagUrl: 'https://flagcdn.com/w40/iq.png', fifaRank: 57 },
      { id: 36, name: 'Norway', code: 'NOR', flagEmoji: '🇳🇴', flagUrl: 'https://flagcdn.com/w40/no.png', fifaRank: 31 },
    ],
  },
  {
    id: 'J',
    name: 'Group J',
    teams: [
      { id: 37, name: 'Argentina', code: 'ARG', flagEmoji: '🇦🇷', flagUrl: 'https://flagcdn.com/w40/ar.png', fifaRank: 3 },
      { id: 38, name: 'Algeria', code: 'ALG', flagEmoji: '🇩🇿', flagUrl: 'https://flagcdn.com/w40/dz.png', fifaRank: 28 },
      { id: 39, name: 'Jordan', code: 'JOR', flagEmoji: '🇯🇴', flagUrl: 'https://flagcdn.com/w40/jo.png', fifaRank: 63 },
      { id: 40, name: 'Austria', code: 'AUT', flagEmoji: '🇦🇹', flagUrl: 'https://flagcdn.com/w40/at.png', fifaRank: 24 },
    ],
  },
  {
    id: 'K',
    name: 'Group K',
    teams: [
      { id: 41, name: 'Portugal', code: 'POR', flagEmoji: '🇵🇹', flagUrl: 'https://flagcdn.com/w40/pt.png', fifaRank: 5 },
      { id: 42, name: 'Colombia', code: 'COL', flagEmoji: '🇨🇴', flagUrl: 'https://flagcdn.com/w40/co.png', fifaRank: 13 },
      { id: 43, name: 'DR Congo', code: 'COD', flagEmoji: '�🇩', flagUrl: 'https://flagcdn.com/w40/cd.png', fifaRank: 46 },
      { id: 44, name: 'Uzbekistan', code: 'UZB', flagEmoji: '🇺🇿', flagUrl: 'https://flagcdn.com/w40/uz.png', fifaRank: 50 },
    ],
  },
  {
    id: 'L',
    name: 'Group L',
    teams: [
      { id: 45, name: 'England', code: 'ENG', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagUrl: 'https://flagcdn.com/w40/gb-eng.png', fifaRank: 4 },
      { id: 46, name: 'Croatia', code: 'CRO', flagEmoji: '🇭🇷', flagUrl: 'https://flagcdn.com/w40/hr.png', fifaRank: 11 },
      { id: 47, name: 'Ghana', code: 'GHA', flagEmoji: '🇬🇭', flagUrl: 'https://flagcdn.com/w40/gh.png', fifaRank: 74 },
      { id: 48, name: 'Panama', code: 'PAN', flagEmoji: '🇵🇦', flagUrl: 'https://flagcdn.com/w40/pa.png', fifaRank: 33 },
    ],
  },
]

// Flat array of all 48 teams — useful for lookups by ID
export const ALL_TEAMS = GROUPS.flatMap((g) => g.teams)

// Helper: find a team by its ID
export const getTeamById = (id) => ALL_TEAMS.find((t) => t.id === id) ?? null
