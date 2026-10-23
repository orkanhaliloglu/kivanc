-- Allow every athlete to manage only their own weekly plans.
-- Admins keep access to manage plans for any athlete.

drop policy if exists "admins insert user workout plans" on public.user_workout_plans;
create policy "owners or admins insert user workout plans"
on public.user_workout_plans for insert to authenticated
with check (user_id = (select auth.uid()) or (select public.is_ritim_admin()));

drop policy if exists "admins update user workout plans" on public.user_workout_plans;
create policy "owners or admins update user workout plans"
on public.user_workout_plans for update to authenticated
using (user_id = (select auth.uid()) or (select public.is_ritim_admin()))
with check (user_id = (select auth.uid()) or (select public.is_ritim_admin()));

drop policy if exists "admins delete user workout plans" on public.user_workout_plans;
create policy "owners or admins delete user workout plans"
on public.user_workout_plans for delete to authenticated
using (user_id = (select auth.uid()) or (select public.is_ritim_admin()));
