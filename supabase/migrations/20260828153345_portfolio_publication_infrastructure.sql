begin;

-- Publishing is intentionally available only through publish_portfolio(),
-- which keeps the portfolio and deployment snapshot in one transaction.
revoke insert (published_content, status, published_at)
  on table public.portfolios from authenticated;
revoke update (published_content, status, published_at)
  on table public.portfolios from authenticated;

create function public.save_resume_review_as_draft(
  p_resume_id uuid,
  p_draft_content jsonb,
  p_title text,
  p_slug_base text
)
returns table (
  portfolio_id uuid,
  portfolio_slug text,
  portfolio_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_portfolio_id uuid;
  v_portfolio_slug text;
  v_portfolio_status text;
  v_slug_base text;
  v_slug_candidate text;
  v_slug_suffix text;
  v_title text;
  v_collision_number integer := 1;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if jsonb_typeof(p_draft_content) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'invalid_draft_content';
  end if;

  v_title := coalesce(nullif(btrim(p_title), ''), 'Portfolio');
  v_slug_base := trim(
    both '-' from regexp_replace(
      lower(coalesce(p_slug_base, '')),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
  v_slug_base := trim(both '-' from left(v_slug_base, 90));

  if v_slug_base = '' then
    v_slug_base := 'portfolio';
  end if;

  -- The profile row serializes concurrent draft creation for the same user.
  perform 1
  from public.profiles
  where id = v_user_id
    and account_status = 'active'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'active_account_required';
  end if;

  perform 1
  from public.resumes
  where id = p_resume_id
    and user_id = v_user_id
    and status = 'completed'
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'resume_not_found';
  end if;

  update public.resumes
  set extracted_data = p_draft_content
  where id = p_resume_id;

  select portfolios.id, portfolios.slug, portfolios.status
  into v_portfolio_id, v_portfolio_slug, v_portfolio_status
  from public.portfolios
  where portfolios.user_id = v_user_id
  order by portfolios.created_at, portfolios.id
  limit 1
  for update;

  if found then
    update public.portfolios
    set
      draft_content = p_draft_content,
      title = v_title
    where id = v_portfolio_id
    returning id, slug, status
    into v_portfolio_id, v_portfolio_slug, v_portfolio_status;
  else
    loop
      if v_collision_number = 1 then
        v_slug_candidate := v_slug_base;
      else
        v_slug_suffix := '-' || v_collision_number::text;
        v_slug_candidate :=
          trim(both '-' from left(v_slug_base, 100 - char_length(v_slug_suffix)))
          || v_slug_suffix;
      end if;

      insert into public.portfolios (
        user_id,
        slug,
        title,
        draft_content,
        status
      )
      values (
        v_user_id,
        v_slug_candidate,
        v_title,
        p_draft_content,
        'draft'
      )
      on conflict (slug) do nothing
      returning id, slug, status
      into v_portfolio_id, v_portfolio_slug, v_portfolio_status;

      exit when v_portfolio_id is not null;

      v_collision_number := v_collision_number + 1;
      if v_collision_number > 10000 then
        raise exception using errcode = 'P0001', message = 'slug_unavailable';
      end if;
    end loop;
  end if;

  return query
  select v_portfolio_id, v_portfolio_slug, v_portfolio_status;
end;
$$;

create function public.publish_portfolio(
  p_portfolio_id uuid,
  p_draft_content jsonb,
  p_theme_id uuid,
  p_theme_config jsonb
)
returns table (
  portfolio_id uuid,
  portfolio_slug text,
  deployment_version integer,
  publication_time timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_portfolio public.portfolios%rowtype;
  v_next_version integer;
  v_publication_time timestamptz := now();
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  perform 1
  from public.profiles
  where id = v_user_id
    and account_status = 'active'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'active_account_required';
  end if;

  select portfolios.*
  into v_portfolio
  from public.portfolios
  where portfolios.id = p_portfolio_id
    and portfolios.user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'portfolio_not_found';
  end if;

  if v_portfolio.draft_content is distinct from p_draft_content
    or v_portfolio.theme_id is distinct from p_theme_id
    or v_portfolio.theme_config is distinct from p_theme_config
  then
    raise exception using errcode = '40001', message = 'portfolio_changed';
  end if;

  if v_portfolio.theme_id is null
    or v_portfolio.theme_config = '{}'::jsonb
    or not exists (
      select 1
      from public.themes
      where themes.id = v_portfolio.theme_id
        and themes.is_active = true
    )
  then
    raise exception using errcode = 'P0001', message = 'theme_required';
  end if;

  if jsonb_typeof(v_portfolio.draft_content) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'invalid_draft_content';
  end if;

  select coalesce(max(deployments.version), 0) + 1
  into v_next_version
  from public.deployments
  where deployments.portfolio_id = v_portfolio.id;

  update public.deployments
  set status = 'historical'
  where deployments.portfolio_id = v_portfolio.id
    and deployments.status = 'current';

  insert into public.deployments (
    portfolio_id,
    version,
    content_snapshot,
    theme_id,
    theme_config_snapshot,
    status,
    published_by,
    created_at
  )
  values (
    v_portfolio.id,
    v_next_version,
    v_portfolio.draft_content,
    v_portfolio.theme_id,
    v_portfolio.theme_config,
    'current',
    v_user_id,
    v_publication_time
  );

  update public.portfolios
  set
    published_content = v_portfolio.draft_content,
    status = 'published',
    published_at = v_publication_time
  where id = v_portfolio.id;

  return query
  select
    v_portfolio.id,
    v_portfolio.slug,
    v_next_version,
    v_publication_time;
end;
$$;

create function public.get_published_portfolio(p_slug text)
returns table (
  portfolio_id uuid,
  portfolio_slug text,
  portfolio_title text,
  published_content jsonb,
  theme_id uuid,
  theme_config jsonb,
  published_at timestamptz,
  theme_slug text,
  theme_name text,
  theme_layout_key text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    portfolios.id,
    portfolios.slug,
    portfolios.title,
    portfolios.published_content,
    deployments.theme_id,
    deployments.theme_config_snapshot,
    portfolios.published_at,
    themes.slug,
    themes.name,
    themes.layout_key
  from public.portfolios
  join public.deployments
    on deployments.portfolio_id = portfolios.id
    and deployments.status = 'current'
  join public.themes
    on themes.id = deployments.theme_id
  where portfolios.slug = p_slug
    and portfolios.status = 'published'
    and portfolios.published_content is not null
  limit 1
$$;

revoke all on function public.save_resume_review_as_draft(uuid, jsonb, text, text)
  from public, anon, authenticated;
revoke all on function public.publish_portfolio(uuid, jsonb, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.get_published_portfolio(text)
  from public, anon, authenticated;

grant execute on function public.save_resume_review_as_draft(uuid, jsonb, text, text)
  to authenticated;
grant execute on function public.publish_portfolio(uuid, jsonb, uuid, jsonb)
  to authenticated;
grant execute on function public.get_published_portfolio(text)
  to anon, authenticated;

commit;
