-- =====================================================================
-- MoussaCode · Admin du site freelance · Schéma Supabase
-- À coller dans Supabase > SQL Editor > New query, puis "Run".
-- Le script peut être relancé : il ne casse rien s'il a déjà tourné.
--
-- Ce projet Supabase est partagé avec l'admin du portfolio.
-- Ce script réutilise public.admins, public.is_admin() et public.set_updated_at(),
-- créés par supabase-admin.sql, et ne touche à aucune table du portfolio.
-- Toutes les tables, le bucket et les policies de stockage sont préfixés « freelance ».
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Vérification : le schéma du portfolio doit déjà être en place
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('public.admins') is null
     or to_regprocedure('public.is_admin()') is null
     or to_regprocedure('public.set_updated_at()') is null then
    raise exception 'Lance d''abord supabase-admin.sql (admins, is_admin, set_updated_at manquants).';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. Services
--    Textes en _fr (obligatoire) et _en (null = à traduire, le site affiche le français).
--    Exactement 3 points « Ce que vous recevez » par langue. Pas de prix.
-- ---------------------------------------------------------------------
create table if not exists public.freelance_services (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name_fr     text not null check (char_length(name_fr) between 1 and 60),
  name_en     text check (name_en is null or char_length(name_en) between 1 and 60),
  pitch_fr    text not null check (char_length(pitch_fr) between 1 and 200),
  pitch_en    text check (pitch_en is null or char_length(pitch_en) between 1 and 200),
  points_fr   text[] not null check (cardinality(points_fr) = 3),
  points_en   text[] check (points_en is null or cardinality(points_en) = 3),
  visible     boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists freelance_services_visible_position_idx
  on public.freelance_services (visible, position);
drop trigger if exists freelance_services_updated_at on public.freelance_services;
create trigger freelance_services_updated_at before update on public.freelance_services
  for each row execute function public.set_updated_at();
alter table public.freelance_services enable row level security;
drop policy if exists "Freelance : services visibles pour tous" on public.freelance_services;
create policy "Freelance : services visibles pour tous" on public.freelance_services
  for select to anon, authenticated using (visible = true);
drop policy if exists "Freelance : admin gère les services" on public.freelance_services;
create policy "Freelance : admin gère les services" on public.freelance_services
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 2. Réalisations
--    cover_id   : une des affiches dessinées du site (composant Cover)
--    image_path : ou une image importée dans le bucket freelance-images
--    Au moins l'un des deux. Pas de nom de client sans son accord.
-- ---------------------------------------------------------------------
create table if not exists public.freelance_works (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name_fr     text not null check (char_length(name_fr) between 1 and 80),
  name_en     text check (name_en is null or char_length(name_en) between 1 and 80),
  kind_fr     text not null check (char_length(kind_fr) between 1 and 40),
  kind_en     text check (kind_en is null or char_length(kind_en) between 1 and 40),
  frame_fr    text not null check (char_length(frame_fr) between 1 and 80),
  frame_en    text check (frame_en is null or char_length(frame_en) between 1 and 80),
  text_fr     text not null check (char_length(text_fr) between 1 and 300),
  text_en     text check (text_en is null or char_length(text_en) between 1 and 300),
  cover_id    text check (cover_id is null or cover_id in ('jappo', 'eco', 'teranga', 'smart', 'shop')),
  image_path  text check (image_path is null or image_path ~ '^[a-z0-9-]+\.(png|jpg|webp)$'),
  url         text check (url is null or (url ~ '^https://' and char_length(url) <= 300)),
  visible     boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint freelance_works_cover_check check (cover_id is not null or image_path is not null)
);
create index if not exists freelance_works_visible_position_idx
  on public.freelance_works (visible, position);
drop trigger if exists freelance_works_updated_at on public.freelance_works;
create trigger freelance_works_updated_at before update on public.freelance_works
  for each row execute function public.set_updated_at();
alter table public.freelance_works enable row level security;
drop policy if exists "Freelance : réalisations visibles pour tous" on public.freelance_works;
create policy "Freelance : réalisations visibles pour tous" on public.freelance_works
  for select to anon, authenticated using (visible = true);
drop policy if exists "Freelance : admin gère les réalisations" on public.freelance_works;
create policy "Freelance : admin gère les réalisations" on public.freelance_works
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 3. Questions fréquentes
--    slug : identifiant stable, sert au seed pour ne pas créer de doublon.
-- ---------------------------------------------------------------------
create table if not exists public.freelance_faq (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  question_fr  text not null check (char_length(question_fr) between 1 and 160),
  question_en  text check (question_en is null or char_length(question_en) between 1 and 160),
  answer_fr    text not null check (char_length(answer_fr) between 1 and 800),
  answer_en    text check (answer_en is null or char_length(answer_en) between 1 and 800),
  visible      boolean not null default false,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists freelance_faq_visible_position_idx
  on public.freelance_faq (visible, position);
drop trigger if exists freelance_faq_updated_at on public.freelance_faq;
create trigger freelance_faq_updated_at before update on public.freelance_faq
  for each row execute function public.set_updated_at();
alter table public.freelance_faq enable row level security;
drop policy if exists "Freelance : questions visibles pour tous" on public.freelance_faq;
create policy "Freelance : questions visibles pour tous" on public.freelance_faq
  for select to anon, authenticated using (visible = true);
drop policy if exists "Freelance : admin gère les questions" on public.freelance_faq;
create policy "Freelance : admin gère les questions" on public.freelance_faq
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 4. Avis clients
--    Un avis ne peut être visible que si l'accord écrit de la personne est noté (consent_at).
--    Auteur : prénom et rôle, jamais le nom d'une entreprise sans accord.
-- ---------------------------------------------------------------------
create table if not exists public.freelance_testimonials (
  id          uuid primary key default gen_random_uuid(),
  quote_fr    text not null check (char_length(quote_fr) between 1 and 500),
  quote_en    text check (quote_en is null or char_length(quote_en) between 1 and 500),
  author      text not null check (char_length(author) between 1 and 80),
  consent_at  timestamptz,
  visible     boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint freelance_testimonials_consent_check check (not visible or consent_at is not null)
);
create index if not exists freelance_testimonials_visible_position_idx
  on public.freelance_testimonials (visible, position);
drop trigger if exists freelance_testimonials_updated_at on public.freelance_testimonials;
create trigger freelance_testimonials_updated_at before update on public.freelance_testimonials
  for each row execute function public.set_updated_at();
alter table public.freelance_testimonials enable row level security;
drop policy if exists "Freelance : avis publiés pour tous" on public.freelance_testimonials;
create policy "Freelance : avis publiés pour tous" on public.freelance_testimonials
  for select to anon, authenticated using (visible = true and consent_at is not null);
drop policy if exists "Freelance : admin gère les avis" on public.freelance_testimonials;
create policy "Freelance : admin gère les avis" on public.freelance_testimonials
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 5. Réglages du site freelance (une seule ligne)
--    whatsapp_number   : chiffres seuls avec l'indicatif ; null = WhatsApp masqué partout.
--    whatsapp_messages :
--      { "contact": { "fr": "...", "en": "..." },
--        "quote":   { "fr": "... ce service : {service}.", "en": "..." },
--        "brief":   { "fr": "Bonjour Moussa,", "en": "..." } }
--    socials : { "linkedin": "https://...", "github": "...", "instagram": "...", "tiktok": "..." }
-- ---------------------------------------------------------------------
create table if not exists public.freelance_settings (
  id                integer primary key default 1 check (id = 1),
  email             text check (email is null or (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 120)),
  whatsapp_number   text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{8,15}$'),
  whatsapp_messages jsonb not null default '{}'::jsonb check (jsonb_typeof(whatsapp_messages) = 'object'),
  is_available      boolean not null default true,
  socials           jsonb not null default '{}'::jsonb check (jsonb_typeof(socials) = 'object'),
  photo_path        text check (photo_path is null or photo_path ~ '^[a-z0-9-]+\.(png|jpg|webp)$'),
  updated_at        timestamptz not null default now()
);
insert into public.freelance_settings (id) values (1) on conflict (id) do nothing;
drop trigger if exists freelance_settings_updated_at on public.freelance_settings;
create trigger freelance_settings_updated_at before update on public.freelance_settings
  for each row execute function public.set_updated_at();
alter table public.freelance_settings enable row level security;
drop policy if exists "Freelance : réglages lisibles par tous" on public.freelance_settings;
create policy "Freelance : réglages lisibles par tous" on public.freelance_settings
  for select to anon, authenticated using (true);
drop policy if exists "Freelance : admin modifie les réglages" on public.freelance_settings;
create policy "Freelance : admin modifie les réglages" on public.freelance_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 6. Stockage : bucket freelance-images (couvertures des réalisations, photo)
--    Lecture publique (bucket public), écriture réservée à l'admin.
--    PNG, JPEG, WebP, 2 Mo maximum. Jamais de SVG.
--    Policies au nom préfixé : celles du portfolio ne sont pas touchées.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('freelance-images', 'freelance-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Freelance : admin voit les images" on storage.objects;
create policy "Freelance : admin voit les images" on storage.objects
  for select to authenticated
  using (bucket_id = 'freelance-images' and (select public.is_admin()));
drop policy if exists "Freelance : admin ajoute des images" on storage.objects;
create policy "Freelance : admin ajoute des images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'freelance-images' and (select public.is_admin()));
drop policy if exists "Freelance : admin modifie des images" on storage.objects;
create policy "Freelance : admin modifie des images" on storage.objects
  for update to authenticated
  using (bucket_id = 'freelance-images' and (select public.is_admin()))
  with check (bucket_id = 'freelance-images' and (select public.is_admin()));
drop policy if exists "Freelance : admin supprime des images" on storage.objects;
create policy "Freelance : admin supprime des images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'freelance-images' and (select public.is_admin()));

-- ---------------------------------------------------------------------
-- 7. Accès API aux tables (car "Grant API access automatically" est décoché)
--    Les règles RLS plus haut décident toujours de QUI voit ou modifie QUOI.
--    anon          : lecture seule (filtrée par RLS)
--    authenticated : lecture + écriture (RLS : réservée à is_admin())
--    service_role  : tout (script de seed, côté serveur uniquement)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on public.freelance_services, public.freelance_works, public.freelance_faq,
                public.freelance_testimonials, public.freelance_settings
  to anon, authenticated;
grant insert, update, delete on public.freelance_services, public.freelance_works,
                                public.freelance_faq, public.freelance_testimonials
  to authenticated;
grant update on public.freelance_settings to authenticated;
grant all on public.freelance_services, public.freelance_works, public.freelance_faq,
             public.freelance_testimonials, public.freelance_settings
  to service_role;
-- La table admins reste fermée à l'API (déjà fait par supabase-admin.sql, rappelé ici).
revoke all on public.admins from anon, authenticated;
