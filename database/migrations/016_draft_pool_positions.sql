-- ---------------------------------------------------------------------------
-- Draft pool position corrections, Fall 2026
--
-- The draft board groups the available players by `signups.position`: the four
-- named positions get their own column and everything else -- including 'Any'
-- and NULL -- falls into Flexible (see positionGroup() in DraftBoard.tsx).
-- Moving someone between columns is therefore a data change, not a code one.
--
-- Note the spelling: the registration reads "Ahmad Ebadi", not "Ahmed". There
-- is a separate "Ahmed khater" in the pool, which is why this matches on the
-- full name rather than the surname.
-- ---------------------------------------------------------------------------

UPDATE signups SET position = 'Goalkeeper'
WHERE lower(name) IN ('ahmad ebadi', 'moussa wood', 'adil kedir');

-- Back to Flexible: NULL is what the board reads as "no fixed position".
UPDATE signups SET position = NULL
WHERE lower(name) = 'ezzaldin shammout';

-- Check: four rows, three keepers and one flexible.
SELECT name, position FROM signups
WHERE lower(name) IN ('ahmad ebadi', 'moussa wood', 'adil kedir', 'ezzaldin shammout')
ORDER BY name;
