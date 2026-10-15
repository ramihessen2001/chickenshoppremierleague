-- ---------------------------------------------------------------------------
-- Sponsors: PURO Airways (CSCP), Fade Factory (S.C Cairo), Mixers FC (S.C Mansoura)
--
-- Logos are already in public/images/sponsors/. CSCP was left unsponsored by
-- 030_jaxfnc_to_paris.sql; this fills it. Mansoura's logo file is called
-- MixersLion.svg but the sponsor displays as "MIXERS FC".
-- ---------------------------------------------------------------------------

UPDATE teams
SET sponsor_name = 'PURO AIRWAYS',
    sponsor_logo_url = '/images/sponsors/PUROAirways.svg'
WHERE slug = 'cscp';

UPDATE teams
SET sponsor_name = 'FADE FACTORY',
    sponsor_logo_url = '/images/sponsors/FadeFactory.svg'
WHERE slug = 'sccairo';

UPDATE teams
SET sponsor_name = 'MIXERS FC',
    sponsor_logo_url = '/images/sponsors/MixersLion.svg'
WHERE slug = 'scmansoura';

SELECT slug, name, sponsor_name, sponsor_logo_url FROM teams ORDER BY display_order;
