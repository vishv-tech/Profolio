begin;

create or replace function public.save_resume_review_as_draft(
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
security invoker
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
        draft_content
      )
      values (
        v_user_id,
        v_slug_candidate,
        v_title,
        p_draft_content
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

commit;
