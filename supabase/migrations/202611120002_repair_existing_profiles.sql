-- Repair public account/profile rows for Supabase Auth users created before
-- the Cineverse signup trigger was installed.
create policy "Users insert own account" on public.users
  for insert to authenticated with check (id = (select auth.uid()));

insert into public.users (id, email, username)
select u.id, coalesce(u.email, ''), coalesce(u.raw_user_meta_data->>'username', u.raw_user_meta_data->>'display_name')
from auth.users u
on conflict (id) do update set email = excluded.email;

insert into public.profiles (user_id, name)
select u.id, coalesce(nullif(u.raw_user_meta_data->>'display_name', ''), 'Main profile')
from auth.users u
where not exists (select 1 from public.profiles p where p.user_id = u.id);
