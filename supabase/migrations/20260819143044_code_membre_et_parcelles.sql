-- ── Code membre : remplace le format séquentiel SN001, SN002, … par un code
-- court de 4 caractères alphanumériques, aléatoire et unique (charset sans
-- 0/O/1/I/L pour éviter les confusions à la lecture). Contrairement à
-- l'ancien SN0xx, ce code est désormais affiché sur la fiche/carte du membre
-- : il servira de référence pour les futurs numéros de parcelle attribués.
drop trigger if exists trg_set_id_membre on membres;
drop function if exists set_id_membre();
drop sequence if exists membres_id_membre_seq;

create or replace function generate_code_membre()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code  text;
begin
  loop
    code := '';
    for i in 1..4 loop
      code := code || substr(chars, (floor(random() * length(chars)) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from membres where id_membre = code);
  end loop;
  return code;
end;
$$;

create or replace function set_id_membre()
returns trigger
language plpgsql
as $$
begin
  new.id_membre := generate_code_membre();
  return new;
end;
$$;

create trigger trg_set_id_membre
  before insert on membres
  for each row execute function set_id_membre();

-- Réattribue un code au nouveau format aux membres existants (les anciens
-- SN0xx ne correspondent plus). Un membre à la fois, pour que chaque appel
-- voie bien les codes déjà attribués par les précédents dans la même boucle.
do $$
declare
  r record;
begin
  for r in select id from membres loop
    update membres set id_membre = generate_code_membre() where id = r.id;
  end loop;
end $$;

-- ── Parcelles : une ligne par terrain physique (au lieu du simple compteur
-- nb_terrains sur le dossier), pour préparer la future étape d'attribution
-- aux membres. numero = position dans le dossier (1, 2, 3…) ; numero_parcelle
-- = numéro réel de la parcelle, vide tant qu'elle n'est pas attribuée.
create table if not exists parcelles (
  id                        uuid primary key default gen_random_uuid(),
  souscription_terrain_id   uuid references souscriptions_terrains(id) on delete cascade,
  souscription_logement_id  uuid references souscriptions_logements(id) on delete cascade,
  numero                    int not null,
  numero_parcelle           text,
  created_at                timestamptz not null default now(),
  constraint parcelles_une_seule_souscription check (
    (souscription_terrain_id is not null) <> (souscription_logement_id is not null)
  ),
  unique (souscription_terrain_id, numero),
  unique (souscription_logement_id, numero)
);

alter table parcelles enable row level security;
create policy "allow_all_parcelles" on parcelles for all using (true) with check (true);

-- Génère automatiquement les N lignes de parcelles à chaque nouveau dossier
-- (N = nb_terrains), pour que la table reste toujours à jour sans changer le
-- code applicatif qui crée les souscriptions.
create or replace function generer_parcelles_terrain()
returns trigger
language plpgsql
as $$
begin
  insert into parcelles (souscription_terrain_id, numero)
  select new.id, gs from generate_series(1, new.nb_terrains) as gs;
  return new;
end;
$$;

create trigger trg_generer_parcelles_terrain
  after insert on souscriptions_terrains
  for each row execute function generer_parcelles_terrain();

create or replace function generer_parcelles_logement()
returns trigger
language plpgsql
as $$
begin
  if new.type_villa = 'terrain' then
    insert into parcelles (souscription_logement_id, numero)
    select new.id, gs from generate_series(1, coalesce(new.nb_terrains, 1)) as gs;
  end if;
  return new;
end;
$$;

create trigger trg_generer_parcelles_logement
  after insert on souscriptions_logements
  for each row execute function generer_parcelles_logement();

-- Backfill des dossiers déjà existants.
insert into parcelles (souscription_terrain_id, numero)
select s.id, gs
from souscriptions_terrains s, generate_series(1, s.nb_terrains) gs
where not exists (select 1 from parcelles p where p.souscription_terrain_id = s.id);

insert into parcelles (souscription_logement_id, numero)
select s.id, gs
from souscriptions_logements s, generate_series(1, coalesce(s.nb_terrains, 1)) gs
where s.type_villa = 'terrain'
  and not exists (select 1 from parcelles p where p.souscription_logement_id = s.id);
