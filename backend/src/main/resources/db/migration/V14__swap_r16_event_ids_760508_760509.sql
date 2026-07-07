-- Swap knockout_picks for R16 events 760508 and 760509.
--
-- The original bracket.js had these event IDs in the wrong visual positions:
--   old R16[6] = 760508 (was labeled EGY/ARG position)
--   old R16[7] = 760509 (was labeled SUI/COL position)
-- ESPN actually assigned:
--   760509 = EGY vs ARG R16 game (has a result)
--   760508 = SUI vs COL R16 game
-- bracket.js was corrected in commit 3995f23, but picks already stored under the
-- swapped IDs need to be migrated to match the correct event assignments.
--
-- Uses a temporary placeholder to avoid violating the unique(user_id, match_event_id)
-- constraint during the two-step swap.

UPDATE knockout_picks SET match_event_id = '760508_tmp' WHERE match_event_id = '760508';
UPDATE knockout_picks SET match_event_id = '760508'     WHERE match_event_id = '760509';
UPDATE knockout_picks SET match_event_id = '760509'     WHERE match_event_id = '760508_tmp';
