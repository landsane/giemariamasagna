-- Le code membre passe de 4 caractères alphanumériques à un code PIN
-- purement numérique (4 chiffres, ex : 0427) : évite toute confusion visuelle
-- entre lettres et chiffres ressemblants (0/O, I/l/1...).
create or replace function generate_code_membre()
returns text
language plpgsql
as $$
declare
  code text;
begin
  loop
    code := lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from membres where id_membre = code);
  end loop;
  return code;
end;
$$;

-- Réattribue un code PIN aux membres existants (les anciens codes alpha-
-- numériques ne correspondent plus au nouveau format). Un membre à la fois,
-- pour que chaque appel voie bien les codes déjà attribués dans la boucle.
do $$
declare
  r record;
begin
  for r in select id from membres loop
    update membres set id_membre = generate_code_membre() where id = r.id;
  end loop;
end $$;
