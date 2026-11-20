-- =====================================================================
-- MoussaCode · Admin du site freelance · Étape 9 : Réalisations et Avis en un seul lot
-- À coller dans Supabase > SQL Editor > New query, puis "Run", APRÈS freelance-admin-2.sql.
-- Le script peut être relancé. Même principe que freelance-admin-2.sql :
-- tout le lot passe en une transaction, ou rien ; SECURITY INVOKER + is_admin().
-- =====================================================================

-- ---------------------------------------------------------------------
-- Réalisations
-- image_path arrive déjà envoyé dans le bucket par le serveur (nom au format de la contrainte).
-- ---------------------------------------------------------------------
create or replace function public.freelance_save_works(items jsonb, deleted uuid[])
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

  delete from public.freelance_works where id = any(coalesce(deleted, '{}'));

  for it in select value from jsonb_array_elements(items) loop
    if nullif(it->>'id', '') is not null then
      update public.freelance_works set
        name_fr    = it->>'name_fr',
        name_en    = nullif(it->>'name_en', ''),
        kind_fr    = it->>'kind_fr',
        kind_en    = nullif(it->>'kind_en', ''),
        frame_fr   = it->>'frame_fr',
        frame_en   = nullif(it->>'frame_en', ''),
        text_fr    = it->>'text_fr',
        text_en    = nullif(it->>'text_en', ''),
        cover_id   = nullif(it->>'cover_id', ''),
        image_path = nullif(it->>'image_path', ''),
        url        = nullif(it->>'url', ''),
        visible    = (it->>'visible')::boolean,
        position   = pos
      where id = (it->>'id')::uuid;
      if not found then
        raise exception 'Réalisation introuvable : %', it->>'id' using errcode = 'P0002';
      end if;
    else
      insert into public.freelance_works
        (slug, name_fr, name_en, kind_fr, kind_en, frame_fr, frame_en, text_fr, text_en,
         cover_id, image_path, url, visible, position)
      values (
        it->>'slug',
        it->>'name_fr', nullif(it->>'name_en', ''),
        it->>'kind_fr', nullif(it->>'kind_en', ''),
        it->>'frame_fr', nullif(it->>'frame_en', ''),
        it->>'text_fr', nullif(it->>'text_en', ''),
        nullif(it->>'cover_id', ''),
        nullif(it->>'image_path', ''),
        nullif(it->>'url', ''),
        (it->>'visible')::boolean,
        pos
      );
    end if;
    pos := pos + 1;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Avis clients
-- "consent" (booléen) : accord écrit de la personne. Coché → consent_at garde sa date, ou prend
-- la date du jour s'il vient d'être donné. Décoché → consent_at effacé (et la contrainte
-- freelance_testimonials_consent_check refuse alors tout avis visible).
-- ---------------------------------------------------------------------
create or replace function public.freelance_save_testimonials(items jsonb, deleted uuid[])
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

  delete from public.freelance_testimonials where id = any(coalesce(deleted, '{}'));

  for it in select value from jsonb_array_elements(items) loop
    if nullif(it->>'id', '') is not null then
      update public.freelance_testimonials set
        quote_fr   = it->>'quote_fr',
        quote_en   = nullif(it->>'quote_en', ''),
        author     = it->>'author',
        consent_at = case when (it->>'consent')::boolean then coalesce(consent_at, now()) end,
        visible    = (it->>'visible')::boolean,
        position   = pos
      where id = (it->>'id')::uuid;
      if not found then
        raise exception 'Avis introuvable : %', it->>'id' using errcode = 'P0002';
      end if;
    else
      insert into public.freelance_testimonials (quote_fr, quote_en, author, consent_at, visible, position)
      values (
        it->>'quote_fr',
        nullif(it->>'quote_en', ''),
        it->>'author',
        case when (it->>'consent')::boolean then now() end,
        (it->>'visible')::boolean,
        pos
      );
    end if;
    pos := pos + 1;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Droits : connecté uniquement (is_admin() décide ensuite), jamais les visiteurs.
-- ---------------------------------------------------------------------
revoke all on function public.freelance_save_works(jsonb, uuid[]) from public, anon;
revoke all on function public.freelance_save_testimonials(jsonb, uuid[]) from public, anon;
grant execute on function public.freelance_save_works(jsonb, uuid[]) to authenticated;
grant execute on function public.freelance_save_testimonials(jsonb, uuid[]) to authenticated;

-- PostgREST recharge sa liste de fonctions.
notify pgrst, 'reload schema';
