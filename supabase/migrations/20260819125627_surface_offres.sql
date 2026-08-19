-- Surface (m²) d'une offre du catalogue — terrain ou logement.
-- Nullable : les offres existantes n'ont pas encore cette info tant qu'elle
-- n'est pas renseignée manuellement via le formulaire d'offre.
ALTER TABLE offres
  ADD COLUMN IF NOT EXISTS surface_m2 int CHECK (surface_m2 IS NULL OR surface_m2 > 0);
