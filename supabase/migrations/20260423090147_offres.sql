-- ============================================================
-- Migration : table offres + rattachement aux souscriptions
-- À exécuter dans Supabase → SQL Editor → New query
-- ============================================================

-- ─── TABLE OFFRES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offres (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type             text NOT NULL
                     CHECK (type IN ('terrain_simple', 'terrain_tf', 'logement')),
  sous_type        text CHECK (sous_type IN ('F2', 'F3')), -- uniquement pour logement
  nom              text NOT NULL,
  description      text,
  localisation     text NOT NULL,
  prix_unitaire    int  NOT NULL CHECK (prix_unitaire > 0),
  frais_dossier    int  NOT NULL DEFAULT 0,
  taux_acompte     numeric(5,4) NOT NULL DEFAULT 0.0000,   -- ex: 0.0800 = 8%
  nb_mensualites   int  NOT NULL DEFAULT 12 CHECK (nb_mensualites > 0),
  statut           text NOT NULL DEFAULT 'active'
                     CHECK (statut IN ('active', 'inactive', 'complet')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE offres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_offres" ON offres FOR ALL USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_offres_type ON offres(type);
CREATE INDEX IF NOT EXISTS idx_offres_statut ON offres(statut);

-- ─── OFFRE_ID sur les souscriptions ──────────────────────────
ALTER TABLE souscriptions_terrains
  ADD COLUMN IF NOT EXISTS offre_id uuid REFERENCES offres(id);

ALTER TABLE souscriptions_logements
  ADD COLUMN IF NOT EXISTS offre_id uuid REFERENCES offres(id);

-- ─── DONNÉES INITIALES ───────────────────────────────────────
INSERT INTO offres (type, nom, localisation, prix_unitaire, frais_dossier, taux_acompte, nb_mensualites) VALUES
  ('terrain_simple', 'Terrain Simple – GIE Maria Masagna', 'Dakar – Sénégal',          460000,    0, 0.0000, 12),
  ('logement',       'Villa F2 – Ndoyenne 01',             'Ndoyenne 01 – Sébikhotane', 16000000,  0, 0.0800, 120),
  ('logement',       'Villa F3 – Ndoyenne 01',             'Ndoyenne 01 – Sébikhotane', 20000000,  0, 0.0800, 120),
  ('logement',       'Villa F2 – Keur Moussa',             'Keur Moussa – Diender',     16000000,  0, 0.0800, 120),
  ('logement',       'Villa F3 – Keur Moussa',             'Keur Moussa – Diender',     20000000,  0, 0.0800, 120),
  ('terrain_tf',     'Terrain TF – Ndoyenne 01',           'Ndoyenne 01 – Sébikhotane', 8000000,   0, 0.0800, 120),
  ('terrain_tf',     'Terrain TF – Keur Moussa',           'Keur Moussa – Diender',     8000000,   0, 0.0800, 120)
ON CONFLICT DO NOTHING;

-- Met à jour le sous_type pour les logements
UPDATE offres SET sous_type = 'F2' WHERE nom LIKE 'Villa F2%';
UPDATE offres SET sous_type = 'F3' WHERE nom LIKE 'Villa F3%';
