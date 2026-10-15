-- ---------------------------------------------------------------------------
-- Sponsor move: JAX FISH AND CHICKEN, from CSCP to S.C Paris
--
-- The sponsorship moved clubs. The logo file is unchanged
-- (/images/sponsors/jaxfnc.svg); only which club row points at it does. CSCP
-- is left unsponsored until a new sponsor signs, which the team page handles
-- by leaving the sponsor block out.
-- ---------------------------------------------------------------------------

UPDATE teams
SET sponsor_name = 'JAX FISH AND CHICKEN',
    sponsor_logo_url = '/images/sponsors/jaxfnc.svg'
WHERE slug = 'scparis';

UPDATE teams
SET sponsor_name = NULL,
    sponsor_logo_url = NULL
WHERE slug = 'cscp';

SELECT slug, name, sponsor_name, sponsor_logo_url FROM teams ORDER BY display_order;
