begin;

select plan(18);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'active@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'suspended@example.test');

update public.profiles
set account_status = 'suspended'
where id = '22222222-2222-2222-2222-222222222222';

insert into public.resumes (user_id, file_path, file_name)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111/active.pdf',
    'active.pdf'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222/suspended.pdf',
    'suspended.pdf'
  );

insert into public.portfolios (user_id, slug, title, draft_content)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'active-test',
    'Active test',
    '{}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'suspended-test',
    'Suspended test',
    '{}'::jsonb
  );

insert into storage.objects (bucket_id, name)
values
  (
    'resumes',
    '11111111-1111-1111-1111-111111111111/active.pdf'
  ),
  (
    'resumes',
    '22222222-2222-2222-2222-222222222222/suspended.pdf'
  );

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select results_eq(
  $$select account_status from public.profiles$$,
  array['suspended'::text],
  'a suspended account can still read its own status'
);

select is_empty(
  $$update public.profiles set full_name = 'Changed' returning full_name$$,
  'a suspended account cannot update its profile'
);

select throws_ok(
  $$update public.profiles set role = 'admin'$$,
  '42501',
  null,
  'an authenticated account cannot update role'
);

select throws_ok(
  $$update public.profiles set account_status = 'active'$$,
  '42501',
  null,
  'an authenticated account cannot update account status'
);

select is_empty(
  $$select file_name from public.resumes$$,
  'a suspended account cannot read its resumes'
);

select throws_ok(
  $$
    insert into public.resumes (user_id, file_path, file_name)
    values (
      '22222222-2222-2222-2222-222222222222',
      '22222222-2222-2222-2222-222222222222/new.pdf',
      'new.pdf'
    )
  $$,
  '42501',
  null,
  'a suspended account cannot insert a resume'
);

select is_empty(
  $$update public.resumes set file_name = 'changed.pdf' returning file_name$$,
  'a suspended account cannot update a resume'
);

select is_empty(
  $$delete from public.resumes returning file_name$$,
  'a suspended account cannot delete a resume'
);

select is_empty(
  $$select slug from public.portfolios$$,
  'a suspended account cannot read its portfolios'
);

select is_empty(
  $$update public.portfolios set title = 'Changed' returning title$$,
  'a suspended account cannot update a portfolio'
);

select is_empty(
  $$select name from storage.objects where bucket_id = 'resumes'$$,
  'a suspended account cannot read its resume objects'
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name)
    values (
      'resumes',
      '22222222-2222-2222-2222-222222222222/new.pdf'
    )
  $$,
  '42501',
  null,
  'a suspended account cannot upload a resume object'
);

select is_empty(
  $$
    update storage.objects
    set name = '22222222-2222-2222-2222-222222222222/changed.pdf'
    where bucket_id = 'resumes'
    returning name
  $$,
  'a suspended account cannot update a resume object'
);

select is_empty(
  $$delete from storage.objects where bucket_id = 'resumes' returning name$$,
  'a suspended account cannot delete a resume object'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$update public.profiles set full_name = 'Updated Active' returning full_name$$,
  array['Updated Active'::text],
  'an active account can update its profile'
);

select results_eq(
  $$select file_name from public.resumes$$,
  array['active.pdf'::text],
  'an active account can read its resumes'
);

select results_eq(
  $$select slug from public.portfolios$$,
  array['active-test'::text],
  'an active account can read its portfolios'
);

select results_eq(
  $$select name from storage.objects where bucket_id = 'resumes'$$,
  array['11111111-1111-1111-1111-111111111111/active.pdf'::text],
  'an active account can read its resume objects'
);

select * from finish();
rollback;
