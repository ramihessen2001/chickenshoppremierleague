-- ---------------------------------------------------------------------------
-- Club colours, Fall 2026
--
-- The values the clubs gave, stored exactly as given. Several are dark by
-- design and would be unreadable as type on the draft announcement's black
-- ground -- Istanbul Black is 1.19:1 against it. That is handled at render
-- time by lightenForContrast() in lib/contrast.ts rather than by storing a
-- second, brighter "screen" colour here: one value per club, and nothing to
-- keep in sync.
--
-- S.C Ramallah gave two, 004D98 and A50044. The first is stored as the club
-- colour; the second is noted here so it is not lost.
-- ---------------------------------------------------------------------------

UPDATE teams SET primary_color = CASE slug
  WHEN 'scdakar'    THEN '#048543'
  WHEN 'scparis'    THEN '#14426F'
  WHEN 'sccairo'    THEN '#FED800'
  WHEN 'cscp'       THEN '#A1CBCC'
  WHEN 'scistanbul' THEN '#231F20'
  WHEN 'scramallah' THEN '#004D98'   -- second colour: #A50044
  WHEN 'scmansoura' THEN '#F78F24'
  WHEN 'sckabul'    THEN '#BF2026'
  ELSE primary_color
END
WHERE slug IN ('scdakar','scparis','sccairo','cscp','scistanbul','scramallah','scmansoura','sckabul');

SELECT slug, name, primary_color FROM teams ORDER BY display_order;
