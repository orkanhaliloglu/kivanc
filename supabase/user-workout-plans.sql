-- Give every athlete a separate weekly plan while preserving existing plans.
create table if not exists public.user_workout_plans (
  user_id uuid not null references public.profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 5),
  plan_type text not null check (plan_type in ('upper','legs','mobility')),
  label text not null,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  updated_at timestamptz not null default now(),
  primary key (user_id, weekday)
);

alter table public.user_workout_plans enable row level security;

drop policy if exists "owner or admin reads user workout plans" on public.user_workout_plans;
create policy "owner or admin reads user workout plans"
on public.user_workout_plans for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_ritim_admin()));

drop policy if exists "admins insert user workout plans" on public.user_workout_plans;
create policy "admins insert user workout plans"
on public.user_workout_plans for insert to authenticated
with check ((select public.is_ritim_admin()));

drop policy if exists "admins update user workout plans" on public.user_workout_plans;
create policy "admins update user workout plans"
on public.user_workout_plans for update to authenticated
using ((select public.is_ritim_admin()))
with check ((select public.is_ritim_admin()));

drop policy if exists "admins delete user workout plans" on public.user_workout_plans;
create policy "admins delete user workout plans"
on public.user_workout_plans for delete to authenticated
using ((select public.is_ritim_admin()));

grant select, insert, update, delete on public.user_workout_plans to authenticated;

-- Copy the current shared plan to each existing profile. Existing rows are kept.
insert into public.user_workout_plans(user_id, weekday, plan_type, label, items)
select p.id, w.weekday, w.plan_type, w.label, w.items
from public.profiles p
cross join public.workout_plans w
on conflict (user_id, weekday) do nothing;

-- New accounts inherit the current default plan until an admin personalizes it.
create or replace function public.make_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''), 'athlete')
  on conflict (id) do update set email = excluded.email;

  insert into public.user_workout_plans(user_id, weekday, plan_type, label, items)
  select new.id, weekday, plan_type, label, items from public.workout_plans
  on conflict (user_id, weekday) do nothing;

  return new;
end;
$$;
