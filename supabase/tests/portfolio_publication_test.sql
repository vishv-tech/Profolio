begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(25);

insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'portfolio-owner@example.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'slug-collision@example.test');

update public.profiles
set username = 'vishv_lange', full_name = 'Vishv Lange'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

insert into public.resumes (
  id,
  user_id,
  file_path,
  file_name,
  status,
  extracted_data
)
values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/resume.pdf',
  'resume.pdf',
  'completed',
  '{"version":0}'::jsonb
);

insert into public.portfolios (user_id, slug, title, draft_content)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'vishv-lange',
    'Collision one',
    '{}'::jsonb
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'vishv-lange-2',
    'Collision two',
    '{}'::jsonb
  );

insert into public.themes (
  id,
  name,
  slug,
  layout_key,
  default_config
)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Test theme',
  'test-theme',
  'test-theme',
  '{}'::jsonb
);

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select results_eq(
  $$
    select portfolio_slug
    from public.save_resume_review_as_draft(
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      '{"version":1}'::jsonb,
      'Vishv Lange',
      'vishv-lange'
    )
  $$,
  array['vishv-lange-3'::text],
  'database uniqueness advances a colliding slug to the next suffix'
);

select results_eq(
  $$
    select draft_content
    from public.portfolios
    where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  array['{"version":1}'::jsonb],
  'the first review save writes draft_content'
);

select results_eq(
  $$
    select published_content is null
    from public.portfolios
    where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  array[true],
  'the first review save does not write published_content'
);

select results_eq(
  $$
    select status
    from public.portfolios
    where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  array['draft'::text],
  'a new portfolio starts as a draft'
);

select throws_ok(
  $$
    select *
    from public.publish_portfolio(
      (
        select id
        from public.portfolios
        where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      ),
      '{"version":1}'::jsonb,
      null,
      '{}'::jsonb
    )
  $$,
  'P0001',
  'theme_required',
  'publishing is rejected until a theme and configuration are selected'
);

reset role;

update public.portfolios
set
  theme_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  theme_config = '{"configured":true}'::jsonb
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

set local role authenticated;

select results_eq(
  $$
    select deployment_version
    from public.publish_portfolio(
      (
        select id
        from public.portfolios
        where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      ),
      '{"version":1}'::jsonb,
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      '{"configured":true}'::jsonb
    )
  $$,
  array[1],
  'the first publish creates deployment version 1'
);

select results_eq(
  $$
    select published_content
    from public.portfolios
    where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  array['{"version":1}'::jsonb],
  'the first publish copies the validated draft snapshot'
);

select results_eq(
  $$
    select status
    from public.portfolios
    where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  array['published'::text],
  'the first publish marks the portfolio published'
);

select results_eq(
  $$
    select version || ':' || status
    from public.deployments
    order by version
  $$,
  array['1:current'::text],
  'the first deployment is current'
);

select results_eq(
  $$
    select portfolio_slug
    from public.save_resume_review_as_draft(
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      '{"version":2}'::jsonb,
      'Updated title',
      'a-different-slug'
    )
  $$,
  array['vishv-lange-3'::text],
  'later review saves preserve the existing public slug'
);

select results_eq(
  $$
    select draft_content
    from public.portfolios
    where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  array['{"version":2}'::jsonb],
  'a later review save updates draft_content'
);

select results_eq(
  $$
    select published_content
    from public.portfolios
    where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  array['{"version":1}'::jsonb],
  'editing the draft leaves the published snapshot unchanged'
);

select results_eq(
  $$
    select status
    from public.portfolios
    where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  array['published'::text],
  'editing a published portfolio does not unpublish it'
);

select results_eq(
  $$
    select deployment_version
    from public.publish_portfolio(
      (
        select id
        from public.portfolios
        where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      ),
      '{"version":2}'::jsonb,
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      '{"configured":true}'::jsonb
    )
  $$,
  array[2],
  'the second publish creates deployment version 2'
);

select results_eq(
  $$
    select published_content
    from public.portfolios
    where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  array['{"version":2}'::jsonb],
  'the second publish replaces the public content snapshot'
);

select results_eq(
  $$
    select version || ':' || status
    from public.deployments
    order by version
  $$,
  array['1:historical'::text, '2:current'::text],
  'the second publish makes version 1 historical and version 2 current'
);

select results_eq(
  $$
    select portfolio_slug
    from public.save_resume_review_as_draft(
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      '{"version":3}'::jsonb,
      'Updated again',
      'ignored-slug'
    )
  $$,
  array['vishv-lange-3'::text],
  'the third draft save still preserves the slug'
);

select results_eq(
  $$
    select deployment_version
    from public.publish_portfolio(
      (
        select id
        from public.portfolios
        where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      ),
      '{"version":3}'::jsonb,
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      '{"configured":true}'::jsonb
    )
  $$,
  array[3],
  'the third publish creates deployment version 3'
);

select results_eq(
  $$
    select version || ':' || status
    from public.deployments
    order by version
  $$,
  array[
    '1:historical'::text,
    '2:historical'::text,
    '3:current'::text
  ],
  'only version 3 remains current after the third publish'
);

reset role;
set local role anon;

select results_eq(
  $$
    select published_content
    from public.get_published_portfolio('vishv-lange-3')
  $$,
  array['{"version":3}'::jsonb],
  'public fetching returns the published portfolio snapshot'
);

select results_eq(
  $$
    select to_jsonb(published) ? 'draft_content'
    from public.get_published_portfolio('vishv-lange-3') as published
  $$,
  array[false],
  'the public function contract never contains draft_content'
);

reset role;

insert into public.portfolios (
  id,
  user_id,
  slug,
  title,
  draft_content,
  published_content,
  theme_id,
  theme_config,
  status
)
values
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'draft-hidden',
    'Draft hidden',
    '{"draft":true}'::jsonb,
    '{"published":true}'::jsonb,
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '{"configured":true}'::jsonb,
    'draft'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'private-hidden',
    'Private hidden',
    '{"draft":true}'::jsonb,
    '{"published":true}'::jsonb,
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '{"configured":true}'::jsonb,
    'private'
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'missing-published-content',
    'Missing published content',
    '{"draft":true}'::jsonb,
    null,
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '{"configured":true}'::jsonb,
    'published'
  );

insert into public.deployments (
  portfolio_id,
  version,
  content_snapshot,
  theme_id,
  theme_config_snapshot,
  status,
  published_by
)
select
  portfolios.id,
  1,
  '{"published":true}'::jsonb,
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '{"configured":true}'::jsonb,
  'current',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
from public.portfolios
where portfolios.id in (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '99999999-9999-9999-9999-999999999999'
);

set local role anon;

select is_empty(
  $$select * from public.get_published_portfolio('draft-hidden')$$,
  'draft portfolios are not publicly exposed'
);

select is_empty(
  $$select * from public.get_published_portfolio('private-hidden')$$,
  'private portfolios are not publicly exposed'
);

select is_empty(
  $$select * from public.get_published_portfolio('missing-published-content')$$,
  'published portfolios without published_content are not exposed'
);

reset role;
set local role authenticated;

select throws_ok(
  $$
    update public.portfolios
    set published_content = '{"bypass":true}'::jsonb
    where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  '42501',
  null,
  'authenticated clients cannot bypass the publish action'
);

reset role;
select * from finish(true);
rollback;
