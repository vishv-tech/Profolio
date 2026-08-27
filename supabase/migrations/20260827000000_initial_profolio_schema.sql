begin;

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  role text not null default 'user',
  account_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null
    or (
      char_length(username) between 3 and 30
      and username = lower(username)
      and username ~ '^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$'
    )
  ),
  constraint profiles_role_check check (role in ('user', 'admin')),
  constraint profiles_account_status_check check (
    account_status in ('active', 'suspended')
  )
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  layout_key text not null,
  preview_image_url text,
  default_config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint themes_name_not_blank check (btrim(name) <> ''),
  constraint themes_slug_format check (
    char_length(slug) between 1 and 100
    and slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint themes_layout_key_format check (
    char_length(layout_key) between 1 and 100
    and layout_key ~ '^[a-z][a-z0-9-]*$'
  ),
  constraint themes_default_config_object check (
    jsonb_typeof(default_config) = 'object'
  )
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  status text not null default 'uploaded',
  improve_with_ai boolean not null default false,
  extracted_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resumes_file_path_not_blank check (btrim(file_path) <> ''),
  constraint resumes_file_name_not_blank check (btrim(file_name) <> ''),
  constraint resumes_status_check check (
    status in ('uploaded', 'processing', 'completed', 'failed')
  ),
  constraint resumes_extracted_data_object check (
    extracted_data is null or jsonb_typeof(extracted_data) = 'object'
  )
);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique,
  title text not null,
  draft_content jsonb not null,
  published_content jsonb,
  theme_id uuid references public.themes (id) on delete restrict,
  theme_config jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint portfolios_slug_format check (
    char_length(slug) between 1 and 100
    and slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint portfolios_title_not_blank check (btrim(title) <> ''),
  constraint portfolios_draft_content_object check (
    jsonb_typeof(draft_content) = 'object'
  ),
  constraint portfolios_published_content_object check (
    published_content is null or jsonb_typeof(published_content) = 'object'
  ),
  constraint portfolios_theme_config_object check (
    jsonb_typeof(theme_config) = 'object'
  ),
  constraint portfolios_status_check check (
    status in ('draft', 'published', 'private')
  )
);

create table public.deployments (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  version integer not null,
  content_snapshot jsonb not null,
  theme_id uuid not null references public.themes (id) on delete restrict,
  theme_config_snapshot jsonb not null,
  status text not null,
  created_at timestamptz not null default now(),
  published_by uuid references public.profiles (id) on delete set null,
  constraint deployments_version_positive check (version > 0),
  constraint deployments_content_snapshot_object check (
    jsonb_typeof(content_snapshot) = 'object'
  ),
  constraint deployments_theme_config_snapshot_object check (
    jsonb_typeof(theme_config_snapshot) = 'object'
  ),
  constraint deployments_status_check check (
    status in ('current', 'historical', 'rolled_back')
  ),
  constraint deployments_portfolio_version_key unique (portfolio_id, version)
);

create table public.portfolio_events (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  event_type text not null,
  visitor_identifier text,
  referrer text,
  created_at timestamptz not null default now(),
  constraint portfolio_events_event_type_check check (event_type in ('view'))
);

create index resumes_user_id_created_at_idx
  on public.resumes (user_id, created_at desc);

create index portfolios_user_id_idx on public.portfolios (user_id);
create index portfolios_status_idx on public.portfolios (status);
create index portfolios_theme_id_idx on public.portfolios (theme_id);

create index deployments_portfolio_id_created_at_idx
  on public.deployments (portfolio_id, created_at desc);
create index deployments_status_idx on public.deployments (status);
create unique index deployments_one_current_per_portfolio_idx
  on public.deployments (portfolio_id)
  where status = 'current';

create index portfolio_events_portfolio_id_created_at_idx
  on public.portfolio_events (portfolio_id, created_at desc);
create index portfolio_events_event_type_idx
  on public.portfolio_events (event_type);

create index themes_is_active_idx on public.themes (is_active);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_resumes_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

create trigger set_portfolios_updated_at
before update on public.portfolios
for each row execute function public.set_updated_at();

create trigger set_themes_updated_at
before update on public.themes
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    role,
    account_status
  )
  values (
    new.id,
    nullif(lower(btrim(new.raw_user_meta_data ->> 'username')), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    'user',
    'active'
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.portfolios enable row level security;
alter table public.themes enable row level security;
alter table public.deployments enable row level security;
alter table public.portfolio_events enable row level security;

revoke all privileges on table public.profiles from anon, authenticated;
revoke all privileges on table public.resumes from anon, authenticated;
revoke all privileges on table public.portfolios from anon, authenticated;
revoke all privileges on table public.themes from anon, authenticated;
revoke all privileges on table public.deployments from anon, authenticated;
revoke all privileges on table public.portfolio_events from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (username, full_name, avatar_url)
  on table public.profiles to authenticated;

grant select, delete on table public.resumes to authenticated;
grant insert (user_id, file_path, file_name, status, improve_with_ai, extracted_data)
  on table public.resumes to authenticated;
grant update (file_path, file_name, status, improve_with_ai, extracted_data)
  on table public.resumes to authenticated;

grant select, delete on table public.portfolios to authenticated;
grant insert (
  user_id,
  slug,
  title,
  draft_content,
  published_content,
  theme_id,
  theme_config,
  status,
  published_at
) on table public.portfolios to authenticated;
grant update (
  slug,
  title,
  draft_content,
  published_content,
  theme_id,
  theme_config,
  status,
  published_at
) on table public.portfolios to authenticated;

grant select on table public.themes to anon, authenticated;
grant select on table public.deployments to authenticated;
grant select on table public.portfolio_events to authenticated;

grant all privileges on table public.profiles to service_role;
grant all privileges on table public.resumes to service_role;
grant all privileges on table public.portfolios to service_role;
grant all privileges on table public.themes to service_role;
grant all privileges on table public.deployments to service_role;
grant all privileges on table public.portfolio_events to service_role;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read their own resumes"
on public.resumes
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own resumes"
on public.resumes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own resumes"
on public.resumes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own resumes"
on public.resumes
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own portfolios"
on public.portfolios
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own portfolios"
on public.portfolios
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own portfolios"
on public.portfolios
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own portfolios"
on public.portfolios
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Anyone can read active themes"
on public.themes
for select
to anon, authenticated
using (is_active = true);

create policy "Portfolio owners can read deployments"
on public.deployments
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = deployments.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Portfolio owners can read analytics events"
on public.portfolio_events
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_events.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  ('resumes', 'resumes', false, 10485760, array['application/pdf']::text[]),
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'theme-previews',
    'theme-previews',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'portfolio-assets',
    'portfolio-assets',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket downloads are handled by the Storage public-object endpoint.
-- RLS below grants authenticated owners the SELECT needed for update/upsert.

create policy "Users can read their own resume files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can upload their own resume files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update their own resume files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete their own resume files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can read their own avatar files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can upload their own avatar files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update their own avatar files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete their own avatar files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can read their own portfolio assets"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can upload their own portfolio assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update their own portfolio assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete their own portfolio assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- No client write policy is created for theme-previews. Future authorized
-- Admin server operations will use the service-role client for that bucket.

commit;
