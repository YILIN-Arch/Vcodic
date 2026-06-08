/*
Create the bucket `submission-images` in the Supabase Dashboard first.
Recommended bucket settings:

- private bucket
- allowed mime types: image/jpeg, image/png, image/webp
- file size limit: 5 MB
*/

drop policy if exists "submission images are readable by service role" on storage.objects;
create policy "submission images are readable by service role"
on storage.objects
for select
to service_role
using (bucket_id = 'submission-images');

drop policy if exists "anonymous users can upload submission images" on storage.objects;
create policy "anonymous users can upload submission images"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'submission-images'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists "service role can update submission images" on storage.objects;
create policy "service role can update submission images"
on storage.objects
for update
to service_role
using (bucket_id = 'submission-images')
with check (bucket_id = 'submission-images');

drop policy if exists "service role can delete submission images" on storage.objects;
create policy "service role can delete submission images"
on storage.objects
for delete
to service_role
using (bucket_id = 'submission-images');
