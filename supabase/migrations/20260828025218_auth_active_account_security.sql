begin;

-- Keep the existing own-profile SELECT policy unchanged so every authenticated
-- account can read the database-backed role and account status used by the app.
-- Profile writes use the row's protected account_status column directly to
-- avoid a recursive profiles policy.

drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
  and account_status = 'active'
)
with check (
  (select auth.uid()) = id
  and account_status = 'active'
);

drop policy if exists "Users can read their own resumes" on public.resumes;
drop policy if exists "Users can insert their own resumes" on public.resumes;
drop policy if exists "Users can update their own resumes" on public.resumes;
drop policy if exists "Users can delete their own resumes" on public.resumes;

create policy "Users can read their own resumes"
on public.resumes
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can insert their own resumes"
on public.resumes
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can update their own resumes"
on public.resumes
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can delete their own resumes"
on public.resumes
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

drop policy if exists "Users can read their own portfolios" on public.portfolios;
drop policy if exists "Users can insert their own portfolios" on public.portfolios;
drop policy if exists "Users can update their own portfolios" on public.portfolios;
drop policy if exists "Users can delete their own portfolios" on public.portfolios;

create policy "Users can read their own portfolios"
on public.portfolios
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can insert their own portfolios"
on public.portfolios
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can update their own portfolios"
on public.portfolios
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can delete their own portfolios"
on public.portfolios
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

drop policy if exists "Portfolio owners can read deployments"
on public.deployments;

create policy "Portfolio owners can read deployments"
on public.deployments
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    join public.profiles on profiles.id = portfolios.user_id
    where portfolios.id = deployments.portfolio_id
      and portfolios.user_id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

drop policy if exists "Portfolio owners can read analytics events"
on public.portfolio_events;

create policy "Portfolio owners can read analytics events"
on public.portfolio_events
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    join public.profiles on profiles.id = portfolios.user_id
    where portfolios.id = portfolio_events.portfolio_id
      and portfolios.user_id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

drop policy if exists "Users can read their own resume files" on storage.objects;
drop policy if exists "Users can upload their own resume files" on storage.objects;
drop policy if exists "Users can update their own resume files" on storage.objects;
drop policy if exists "Users can delete their own resume files" on storage.objects;

create policy "Users can read their own resume files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can upload their own resume files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can update their own resume files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
)
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can delete their own resume files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

drop policy if exists "Users can read their own avatar files" on storage.objects;
drop policy if exists "Users can upload their own avatar files" on storage.objects;
drop policy if exists "Users can update their own avatar files" on storage.objects;
drop policy if exists "Users can delete their own avatar files" on storage.objects;

create policy "Users can read their own avatar files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can upload their own avatar files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can update their own avatar files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can delete their own avatar files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

drop policy if exists "Users can read their own portfolio assets" on storage.objects;
drop policy if exists "Users can upload their own portfolio assets" on storage.objects;
drop policy if exists "Users can update their own portfolio assets" on storage.objects;
drop policy if exists "Users can delete their own portfolio assets" on storage.objects;

create policy "Users can read their own portfolio assets"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can upload their own portfolio assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can update their own portfolio assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
)
with check (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

create policy "Users can delete their own portfolio assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.account_status = 'active'
  )
);

commit;
