create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  username text,
  avatar_url text,
  created_at timestamptz not null default now()
);
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null default 'Main profile',
  avatar_url text,
  is_kids_profile boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);
create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_id bigint unique not null,
  title text not null,
  overview text not null default '',
  poster_path text,
  backdrop_path text,
  release_date date,
  rating numeric(3,1),
  runtime integer,
  media_type text not null default 'movie' check (media_type in ('movie','tv')),
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(profile_id, movie_id)
);
create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  progress_seconds integer not null default 0 check (progress_seconds >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(profile_id, movie_id)
);
create table if not exists public.favorite_genres (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  genre_id integer not null,
  unique(profile_id, genre_id)
);
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.featured_content (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  position integer not null default 0,
  active boolean not null default true,
  unique(movie_id)
);
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists watchlist_profile_created_idx on public.watchlist(profile_id, created_at desc);
create index if not exists watch_history_profile_updated_idx on public.watch_history(profile_id, updated_at desc);
create index if not exists movies_title_idx on public.movies using gin (to_tsvector('english', title));
create index if not exists featured_position_idx on public.featured_content(position) where active;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users(id,email,username) values(new.id,new.email,new.raw_user_meta_data->>'username') on conflict(id) do update set email=excluded.email;
  insert into public.profiles(user_id,name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name','Main profile')) on conflict do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.watchlist enable row level security;
alter table public.watch_history enable row level security;
alter table public.favorite_genres enable row level security;
alter table public.admin_users enable row level security;
alter table public.featured_content enable row level security;

create policy "Users read own account" on public.users for select using (id = (select auth.uid()));
create policy "Users update own account" on public.users for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Profiles are visible to their owner" on public.profiles for select using (user_id = (select auth.uid()));
create policy "Owners manage profiles" on public.profiles for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Movies are readable" on public.movies for select using (true);
create policy "Authenticated users add TMDB metadata" on public.movies for insert to authenticated with check (true);
create policy "Admins manage movies" on public.movies for all using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
create policy "Owners manage watchlist" on public.watchlist for all using (exists(select 1 from public.profiles p where p.id=profile_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy "Owners manage history" on public.watch_history for all using (exists(select 1 from public.profiles p where p.id=profile_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy "Owners manage favorite genres" on public.favorite_genres for all using (exists(select 1 from public.profiles p where p.id=profile_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy "Admins read admin membership" on public.admin_users for select using (user_id=(select auth.uid()));
create policy "Featured content is readable" on public.featured_content for select using (active);
create policy "Admins manage featured content" on public.featured_content for all using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
