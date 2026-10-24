-- Private avatar storage for Mami. Only Mami and the Ritim admin can read this object.
insert into storage.buckets (id, name, public)
values ('ritim-avatars', 'ritim-avatars', false)
on conflict (id) do update set public = false;

drop policy if exists "mami avatar private read" on storage.objects;
create policy "mami avatar private read"
on storage.objects for select to authenticated
using (
  bucket_id = 'ritim-avatars'
  and name = 'ad6f06ba-2712-48c0-a811-14a8629b9acf/avatar.jpeg'
  and (
    auth.uid() = 'ad6f06ba-2712-48c0-a811-14a8629b9acf'::uuid
    or public.is_ritim_admin()
  )
);
