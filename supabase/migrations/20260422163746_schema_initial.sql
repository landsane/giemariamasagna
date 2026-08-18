-- ============================================================
-- GIE Maria Masagna — Schema Supabase
-- À exécuter dans : Supabase → SQL Editor → New query
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── MEMBRES ────────────────────────────────────────────────
create table if not exists membres (
  id          uuid primary key default uuid_generate_v4(),
  id_membre   text not null unique,        -- SN001, SN002, …
  nom         text not null,
  prenom      text not null,
  telephone   text,
  email       text,
  statut      text not null default 'actif' check (statut in ('actif', 'inactif')),
  created_at  timestamptz not null default now()
);

-- ─── MODULE 1 : TERRAINS SIMPLES ────────────────────────────

create table if not exists souscriptions_terrains (
  id                  uuid primary key default uuid_generate_v4(),
  membre_id           uuid not null references membres(id) on delete cascade,
  nb_terrains         int  not null default 1 check (nb_terrains > 0),
  montant_total       int  not null,   -- nb_terrains × 460 000
  montant_verse       int  not null default 0,
  reste_a_verser      int  generated always as (montant_total - montant_verse) stored,
  pourcentage         int  generated always as (
                        case when montant_total = 0 then 0
                             else least(round(montant_verse * 100.0 / montant_total), 100)
                        end
                      ) stored,
  sgbs                boolean not null default false,
  statut              text not null default 'en_cours' check (statut in ('en_cours', 'solde')),
  date_souscription   date not null default current_date,
  created_at          timestamptz not null default now()
);

create table if not exists paiements_terrains (
  id                  uuid primary key default uuid_generate_v4(),
  souscription_id     uuid not null references souscriptions_terrains(id) on delete cascade,
  membre_id           uuid not null references membres(id) on delete cascade,
  numero_versement    int  not null check (numero_versement between 1 and 12),
  date_versement      date not null,
  montant             int  not null check (montant > 0),
  encaisseur_nom      text not null,
  encaisseur_prenom   text not null,
  mode_paiement       text not null check (mode_paiement in ('wave', 'orange_money', 'banque', 'autres')),
  reference           text,
  created_at          timestamptz not null default now()
);

-- ─── MODULE 2 : LOGEMENTS / TITRE FONCIER ───────────────────

create table if not exists souscriptions_logements (
  id                      uuid primary key default uuid_generate_v4(),
  membre_id               uuid not null references membres(id) on delete cascade,
  type_villa              text not null check (type_villa in ('F2', 'F3')),
  site                    text not null check (site in ('ndoyenne', 'keur_moussa')),
  titre                   text not null check (titre in ('TF', 'bail')),
  prix_total              int  not null,          -- 16 000 000 ou 20 000 000
  acompte_requis          int  not null,          -- 8 % du prix
  acompte_verse           int  not null default 0,
  mensualite              int  not null,          -- prix_total / 120
  nb_mensualites_payees   int  not null default 0,
  statut                  text not null default 'en_cours'
                            check (statut in ('en_cours', 'valide', 'attribue', 'livre')),
  date_souscription       date not null default current_date,
  created_at              timestamptz not null default now()
);

create table if not exists paiements_logements (
  id                  uuid primary key default uuid_generate_v4(),
  souscription_id     uuid not null references souscriptions_logements(id) on delete cascade,
  membre_id           uuid not null references membres(id) on delete cascade,
  type_paiement       text not null check (type_paiement in ('acompte', 'mensualite')),
  date_versement      date not null,
  montant             int  not null check (montant > 0),
  mode_paiement       text not null check (mode_paiement in ('wave', 'orange_money', 'banque', 'autres')),
  reference           text,
  created_at          timestamptz not null default now()
);

-- ─── INDEX ──────────────────────────────────────────────────
create index if not exists idx_souscriptions_terrains_membre on souscriptions_terrains(membre_id);
create index if not exists idx_paiements_terrains_souscription on paiements_terrains(souscription_id);
create index if not exists idx_paiements_terrains_membre on paiements_terrains(membre_id);
create index if not exists idx_souscriptions_logements_membre on souscriptions_logements(membre_id);
create index if not exists idx_paiements_logements_souscription on paiements_logements(souscription_id);

-- ─── RLS (Row Level Security) ───────────────────────────────
-- Pour l'instant : accès libre avec la clé anon (à restreindre plus tard)
alter table membres                  enable row level security;
alter table souscriptions_terrains   enable row level security;
alter table paiements_terrains       enable row level security;
alter table souscriptions_logements  enable row level security;
alter table paiements_logements      enable row level security;

-- Policies : lecture et écriture autorisées pour la clé anon
create policy "allow_all_membres"                 on membres                 for all using (true) with check (true);
create policy "allow_all_souscriptions_terrains"  on souscriptions_terrains  for all using (true) with check (true);
create policy "allow_all_paiements_terrains"      on paiements_terrains      for all using (true) with check (true);
create policy "allow_all_souscriptions_logements" on souscriptions_logements for all using (true) with check (true);
create policy "allow_all_paiements_logements"     on paiements_logements     for all using (true) with check (true);

-- ─── DONNÉES INITIALES (extrait Excel – 25 membres) ─────────
insert into membres (id_membre, nom, prenom, telephone, statut) values
  ('SN001', 'DIALLO',   'Ibrahima',   '77 100 0001', 'actif'),
  ('SN002', 'NDIAYE',   'Aminata',    '77 200 0002', 'actif'),
  ('SN003', 'FALL',     'Moussa',     '77 300 0003', 'actif'),
  ('SN004', 'SENE',     'Fatou',      '76 400 0004', 'actif'),
  ('SN005', 'GUEYE',    'Ousmane',    '78 500 0005', 'actif'),
  ('SN006', 'DIOP',     'Mariama',    '77 600 0006', 'actif'),
  ('SN007', 'BA',       'Rokhaya',    '70 700 0007', 'actif'),
  ('SN008', 'SARR',     'Cheikh',     '77 800 0008', 'actif'),
  ('SN009', 'MBAYE',    'Ndéye',      '76 900 0009', 'actif'),
  ('SN010', 'CISSE',    'Abdoulaye',  '77 100 0010', 'actif'),
  ('SN011', 'DIOUF',    'Aissatou',   '78 100 0011', 'actif'),
  ('SN012', 'FAYE',     'Lamine',     '77 120 0012', 'actif'),
  ('SN013', 'CAMARA',   'Binta',      '76 130 0013', 'actif'),
  ('SN014', 'SY',       'Mamadou',    '77 140 0014', 'actif'),
  ('SN015', 'LO',       'Adja',       '78 150 0015', 'actif'),
  ('SN016', 'THIAM',    'Seydou',     '77 160 0016', 'actif'),
  ('SN017', 'WADE',     'Khadija',    '70 170 0017', 'actif'),
  ('SN018', 'COLY',     'Yama',       '76 180 0018', 'actif'),
  ('SN019', 'TOURE',    'Boubacar',   '77 190 0019', 'actif'),
  ('SN020', 'NIANG',    'Fatou',      '78 200 0020', 'actif'),
  ('SN021', 'BADIANE',  'Coumba',     '77 210 0021', 'actif'),
  ('SN022', 'DIAKHATE', 'Kiné',       '76 220 0022', 'actif'),
  ('SN023', 'NDOUR',    'Pape',       '77 230 0023', 'actif'),
  ('SN024', 'DIONE',    'Sophie',     '78 240 0024', 'actif'),
  ('SN025', 'MBODJ',    'Astou',      '77 250 0025', 'inactif')
on conflict (id_membre) do nothing;
