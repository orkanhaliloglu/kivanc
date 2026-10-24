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

-- Kıvanç can read only his own avatar; the Ritim admin can also read it.
drop policy if exists "kivanc avatar private read" on storage.objects;
create policy "kivanc avatar private read"
on storage.objects for select to authenticated
using (
  bucket_id = 'ritim-avatars'
  and name = '0a47c1e5-2d3a-4c8a-b611-4f36926630e2/avatar.jpeg'
  and (
    auth.uid() = '0a47c1e5-2d3a-4c8a-b611-4f36926630e2'::uuid
    or public.is_ritim_admin()
  )
);
