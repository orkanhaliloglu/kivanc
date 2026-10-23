-- Allow per-user workout plans on Saturday (6) and Sunday (7).
alter table public.user_workout_plans
  drop constraint if exists user_workout_plans_weekday_check;
alter table public.user_workout_plans
  add constraint user_workout_plans_weekday_check check (weekday between 1 and 7);

-- Keep the shared template table consistent for future default schedules.
alter table public.workout_plans
  drop constraint if exists workout_plans_weekday_check;
alter table public.workout_plans
  add constraint workout_plans_weekday_check check (weekday between 1 and 7);
