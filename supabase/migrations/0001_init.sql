-- Noteflix — schéma initial du SaaS cloud
-- Postgres + pgvector, multi-utilisateur, RLS, recherche sémantique.

-- Extensions ---------------------------------------------------------------
create extension if not exists vector;

-- Catégories (par utilisateur) ---------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

-- Items : vidéos & idées (par utilisateur) ---------------------------------
create table if not exists public.items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  type         text not null default 'video' check (type in ('video', 'idea')),
  url          text,
  platform     text,
  video_id     text,
  title        text not null,
  description  text not null default '',
  author       text,
  thumbnail    text,
  category_id  uuid references public.categories (id) on delete set null,
  tags         text[] not null default '{}',
  transcript   text,              -- réservé pour la transcription auto (futur)
  embedding    vector(384),       -- gte-small (Supabase Edge AI)
  view_count   int  not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists items_user_created_idx
  on public.items (user_id, created_at desc);

create index if not exists items_user_category_idx
  on public.items (user_id, category_id);

-- Recherche vectorielle (cosinus) via HNSW
create index if not exists items_embedding_idx
  on public.items using hnsw (embedding vector_cosine_ops);

-- Parcours d'apprentissage générés par l'IA --------------------------------
create table if not exists public.paths (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  goal        text not null,
  title       text not null,
  steps       jsonb not null default '[]'::jsonb,  -- [{day, item_id, title, why}]
  created_at  timestamptz not null default now()
);

create index if not exists paths_user_created_idx
  on public.paths (user_id, created_at desc);

-- Row Level Security -------------------------------------------------------
alter table public.categories enable row level security;
alter table public.items      enable row level security;
alter table public.paths      enable row level security;

-- Chaque utilisateur ne voit/agit que sur ses propres lignes.
create policy categories_select on public.categories
  for select using (user_id = auth.uid());
create policy categories_insert on public.categories
  for insert with check (user_id = auth.uid());
create policy categories_update on public.categories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy categories_delete on public.categories
  for delete using (user_id = auth.uid());

create policy items_select on public.items
  for select using (user_id = auth.uid());
create policy items_insert on public.items
  for insert with check (user_id = auth.uid());
create policy items_update on public.items
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy items_delete on public.items
  for delete using (user_id = auth.uid());

create policy paths_select on public.paths
  for select using (user_id = auth.uid());
create policy paths_insert on public.paths
  for insert with check (user_id = auth.uid());
create policy paths_update on public.paths
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy paths_delete on public.paths
  for delete using (user_id = auth.uid());

-- Recherche sémantique : voisins les plus proches (RLS appliquée via invoker)
create or replace function public.match_items(
  query_embedding vector(384),
  match_count int default 12
)
returns setof public.items
language sql
stable
as $$
  select *
  from public.items
  where embedding is not null
  order by embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

-- Catégories par défaut à l'inscription ------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (user_id, name, position) values
    (new.id, 'Setting & Closing', 0),
    (new.id, 'Nœuds', 1),
    (new.id, 'Mandarin', 2),
    (new.id, 'Idées', 3)
  on conflict (user_id, name) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
