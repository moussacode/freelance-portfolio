-- =====================================================================
-- MoussaCode · Admin du site freelance · Étape 8 : enregistrement en un seul lot
-- À coller dans Supabase > SQL Editor > New query, puis "Run", APRÈS freelance-admin.sql.
-- Le script peut être relancé.
--
-- Quand l'admin clique sur « Enregistrer », tous les changements d'une page (ajouts, modifications,
-- suppressions, nouvel ordre) sont appliqués en une seule transaction : tout passe, ou rien.
-- Fonctions en SECURITY INVOKER : elles tournent avec les droits de l'utilisateur connecté,
-- donc les règles RLS s'appliquent, et elles revérifient is_admin() elles-mêmes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Services
-- items   : tableau JSON dans l'ordre voulu sur le site ; un élément avec "id" est modifié, sans "id" il est créé.
-- deleted : identifiants à supprimer.
-- ---------------------------------------------------------------------
create or replace function public.freelance_save_services(items jsonb, deleted uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  it jsonb;
  pos integer := 0;
begin
  if not (select public.is_admin()) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if jsonb_typeof(items) <> 'array' then
    raise exception 'Format invalide' using errcode = '22023';
  end if;

  delete from public.freelance_services where id = any(coalesce(deleted, '{}'));

  for it in select value from jsonb_array_elements(items) loop
    if nullif(it->>'id', '') is not null then
      update public.freelance_services set
        name_fr   = it->>'name_fr',
        name_en   = nullif(it->>'name_en', ''),
        pitch_fr  = it->>'pitch_fr',
        pitch_en  = nullif(it->>'pitch_en', ''),
        points_fr = array(select jsonb_array_elements_text(it->'points_fr')),
        points_en = case when jsonb_typeof(it->'points_en') = 'array'
                         then array(select jsonb_array_elements_text(it->'points_en')) end,
        visible   = (it->>'visible')::boolean,
        position  = pos
      where id = (it->>'id')::uuid;
      if not found then
        raise exception 'Service introuvable : %', it->>'id' using errcode = 'P0002';
      end if;
    else
      insert into public.freelance_services
        (slug, name_fr, name_en, pitch_fr, pitch_en, points_fr, points_en, visible, position)
      values (
        it->>'slug',
        it->>'name_fr',
        nullif(it->>'name_en', ''),
        it->>'pitch_fr',
        nullif(it->>'pitch_en', ''),
        array(select jsonb_array_elements_text(it->'points_fr')),
        case when jsonb_typeof(it->'points_en') = 'array'
             then array(select jsonb_array_elements_text(it->'points_en')) end,
        (it->>'visible')::boolean,
        pos
      );
    end if;
    pos := pos + 1;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Questions fréquentes (même principe)
-- ---------------------------------------------------------------------
create or replace function public.freelance_save_faq(items jsonb, deleted uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  it jsonb;
  pos integer := 0;
begin
  if not (select public.is_admin()) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if jsonb_typeof(items) <> 'array' then
    raise exception 'Format invalide' using errcode = '22023';
  end if;

  delete from public.freelance_faq where id = any(coalesce(deleted, '{}'));

  for it in select value from jsonb_array_elements(items) loop
    if nullif(it->>'id', '') is not null then
      update public.freelance_faq set
        question_fr = it->>'question_fr',
        question_en = nullif(it->>'question_en', ''),
        answer_fr   = it->>'answer_fr',
        answer_en   = nullif(it->>'answer_en', ''),
        visible     = (it->>'visible')::boolean,
        position    = pos
      where id = (it->>'id')::uuid;
      if not found then
        raise exception 'Question introuvable : %', it->>'id' using errcode = 'P0002';
      end if;
    else
      insert into public.freelance_faq (slug, question_fr, question_en, answer_fr, answer_en, visible, position)
      values (
        it->>'slug',
        it->>'question_fr',
        nullif(it->>'question_en', ''),
        it->>'answer_fr',
        nullif(it->>'answer_en', ''),
        (it->>'visible')::boolean,
        pos
      );
    end if;
    pos := pos + 1;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Droits : seul un utilisateur connecté peut appeler ces fonctions (et is_admin() décide ensuite).
-- ---------------------------------------------------------------------
revoke all on function public.freelance_save_services(jsonb, uuid[]) from public, anon;
revoke all on function public.freelance_save_faq(jsonb, uuid[]) from public, anon;
grant execute on function public.freelance_save_services(jsonb, uuid[]) to authenticated;
grant execute on function public.freelance_save_faq(jsonb, uuid[]) to authenticated;
