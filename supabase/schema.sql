-- Ritim: Supabase schema, access rules, default workout plans.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'athlete' check (role in ('admin','athlete')),
  created_at timestamptz not null default now()
);

create table if not exists public.daily_records (
  user_id uuid not null references public.profiles(id) on delete cascade,
  record_date date not null,
  data jsonb not null default '{"done":[],"sleepGoal":false,"bed":"","note":""}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, record_date),
  check (jsonb_typeof(data) = 'object')
);

create table if not exists public.workout_plans (
  weekday smallint primary key check (weekday between 1 and 7),
  plan_type text not null check (plan_type in ('upper','legs','mobility')),
  label text not null,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  updated_at timestamptz not null default now()
);

create or replace function public.make_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''), 'athlete')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users for each row execute function public.make_profile_for_new_user();

create or replace function public.is_ritim_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_ritim_admin() from public;
grant execute on function public.is_ritim_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.daily_records enable row level security;
alter table public.workout_plans enable row level security;

drop policy if exists "profile owner or admin reads profiles" on public.profiles;
create policy "profile owner or admin reads profiles" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_ritim_admin()));

drop policy if exists "owner or admin reads daily records" on public.daily_records;
create policy "owner or admin reads daily records" on public.daily_records for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_ritim_admin()));
drop policy if exists "owner or admin creates daily records" on public.daily_records;
create policy "owner or admin creates daily records" on public.daily_records for insert to authenticated
with check (user_id = (select auth.uid()) or (select public.is_ritim_admin()));
drop policy if exists "owner or admin updates daily records" on public.daily_records;
create policy "owner or admin updates daily records" on public.daily_records for update to authenticated
using (user_id = (select auth.uid()) or (select public.is_ritim_admin()))
with check (user_id = (select auth.uid()) or (select public.is_ritim_admin()));

drop policy if exists "signed in users read workout plans" on public.workout_plans;
create policy "signed in users read workout plans" on public.workout_plans for select to authenticated using (true);
drop policy if exists "admins insert workout plans" on public.workout_plans;
create policy "admins insert workout plans" on public.workout_plans for insert to authenticated with check ((select public.is_ritim_admin()));
drop policy if exists "admins update workout plans" on public.workout_plans;
create policy "admins update workout plans" on public.workout_plans for update to authenticated using ((select public.is_ritim_admin())) with check ((select public.is_ritim_admin()));
drop policy if exists "admins delete workout plans" on public.workout_plans;
create policy "admins delete workout plans" on public.workout_plans for delete to authenticated using ((select public.is_ritim_admin()));

grant select on public.profiles to authenticated;
grant select, insert, update on public.daily_records to authenticated;
grant select, insert, update, delete on public.workout_plans to authenticated;

insert into public.workout_plans(weekday, plan_type, label, items) values
(1,'upper','Üst vücut + core','[["rope","1 dk ip atlama"],["quick","Çabukluk ve sıçrama"],["wide","Geniş kol şınavı · 10 × 1"],["narrow","Dar kol şınavı · 8 × 1"],["triceps","Arka kol · 10 × 1"],["pullup","Barfiks · 2 × 2"],["upper","Üst karın · 20 sn"],["side","Yan karın · 20 sn"],["lower","Alt karın · 20 sn"],["plank1","Plank 1 · 20 sn"],["plank2","Plank 2 · 20 sn"],["mobility","Esneklik ve mobilite"]]'),
(2,'legs','Denge + alt vücut','[["rope","1 dk ip atlama"],["balance","Denge ve koordinasyon"],["hip","Kalça · 10 × 1"],["quad","Ön bacak (quadriceps) · 10 × 1"],["ham","Arka bacak (hamstring) · 10 × 1"],["calf","Calf · 10 × 1"],["plank1","Plank 1 · 20 sn"],["plank2","Plank 2 · 20 sn"],["mobility","Esneklik ve mobilite"]]'),
(3,'mobility','Esneklik + mobilite','[["mobility","Esneklik ve mobilite"]]'),
(4,'upper','Üst vücut + core','[["rope","1 dk ip atlama"],["quick","Çabukluk ve sıçrama"],["wide","Geniş kol şınavı · 10 × 1"],["narrow","Dar kol şınavı · 8 × 1"],["triceps","Arka kol · 10 × 1"],["pullup","Barfiks · 2 × 2"],["upper","Üst karın · 20 sn"],["side","Yan karın · 20 sn"],["lower","Alt karın · 20 sn"],["plank1","Plank 1 · 20 sn"],["plank2","Plank 2 · 20 sn"],["mobility","Esneklik ve mobilite"]]'),
(5,'legs','Denge + alt vücut','[["rope","1 dk ip atlama"],["balance","Denge ve koordinasyon"],["hip","Kalça · 10 × 1"],["quad","Ön bacak (quadriceps) · 10 × 1"],["ham","Arka bacak (hamstring) · 10 × 1"],["calf","Calf · 10 × 1"],["plank1","Plank 1 · 20 sn"],["plank2","Plank 2 · 20 sn"],["mobility","Esneklik ve mobilite"]]')
on conflict (weekday) do nothing;
