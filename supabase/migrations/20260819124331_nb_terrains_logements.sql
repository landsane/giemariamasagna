-- Ajoute le nombre de parcelles à une souscription logement (utilisé par les
-- dossiers Terrain TF, qui peuvent regrouper plusieurs parcelles en un seul
-- dossier — pour les villas F2/F3 la valeur reste 1, une souscription = un bien).
ALTER TABLE souscriptions_logements
  ADD COLUMN IF NOT EXISTS nb_terrains int NOT NULL DEFAULT 1;

-- Rétro-calcul au mieux pour les dossiers Terrain TF déjà existants, à partir
-- du prix unitaire de l'offre liée (prix_total = nb_terrains × prix_unitaire).
UPDATE souscriptions_logements sl
SET nb_terrains = GREATEST(1, ROUND(sl.prix_total::numeric / o.prix_unitaire))
FROM offres o
WHERE sl.offre_id = o.id
  AND sl.type_villa = 'terrain'
  AND o.prix_unitaire > 0;
