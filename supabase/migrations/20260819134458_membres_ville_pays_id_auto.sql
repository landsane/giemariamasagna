-- Ville et pays de résidence du membre, à afficher systématiquement à côté de
-- son prénom/nom pour le différencier facilement (remplace l'identifiant
-- SN0xx affiché jusqu'ici, désormais purement interne — voir plus bas).
alter table membres
  add column if not exists ville text,
  add column if not exists pays text;

-- L'identifiant SN0xx était jusqu'ici calculé côté client (relecture du
-- dernier id_membre trié + incrément), une méthode fragile en cas d'écritures
-- concurrentes. Il est désormais généré naturellement en base via une
-- séquence, et n'est plus affiché sur le site (usage interne uniquement).
create sequence if not exists membres_id_membre_seq;

-- Redémarre la séquence après le dernier numéro déjà attribué, pour ne pas
-- entrer en collision avec les membres existants.
select setval(
  'membres_id_membre_seq',
  coalesce((select max(substring(id_membre from 3)::int) from membres), 0)
);

create or replace function set_id_membre()
returns trigger
language plpgsql
as $$
begin
  new.id_membre := 'SN' || lpad(nextval('membres_id_membre_seq')::text, 3, '0');
  return new;
end;
$$;

drop trigger if exists trg_set_id_membre on membres;
create trigger trg_set_id_membre
  before insert on membres
  for each row execute function set_id_membre();
