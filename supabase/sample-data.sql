-- OPTIONAL: fill one account with sample applications for testing.
-- 1. Sign up in the app first.  2. Replace the email below.  3. Run in Supabase → SQL Editor.
-- To remove it later:  delete from public.applications where user_id = (select id from auth.users where email = 'you@example.com');

with me as (select id from auth.users where email = 'you@example.com')
insert into public.applications (user_id, company, role, logo, status, interview_stage, applied_date, next_step, due_date)
select me.id, v.company, v.role, v.logo, v.status, v.stage, v.applied::date, v.next_step, v.due::date
from me, (values
  ('Vercel',      'Senior Product Designer',   'https://thesvg.org/icons/vercel/default.svg', 'Interviewing',       'hiring-manager', current_date - 20, 'Hiring manager interview', current_date + 1),
  ('Figma',       'Product Designer, Growth',  'https://thesvg.org/icons/figma/default.svg',  'Take-home',          null,             current_date - 14, 'Submit design exercise',   current_date + 3),
  ('Linear',      'Product Designer',          'https://thesvg.org/icons/linear/default.svg', 'Applied',            null,             current_date - 6,  'Follow up with recruiter', current_date + 5),
  ('Ramp',        'Staff Product Designer',    'https://thesvg.org/icons/ramp/default.svg',   'Interviewing',       'recruiter',      current_date - 9,  'Share availability',       current_date),
  ('Notion',      'Product Designer, AI',      null,                                          'Applied',            null,             current_date - 2,  '',                         null),
  ('Stripe',      'Product Designer',          null,                                          'Not moving forward', null,             current_date - 25, '',                         null),
  ('Manifest OS', 'Product Designer',          null,                                          'Interested',         null,             null,              '',                         null)
) as v(company, role, logo, status, stage, applied, next_step, due);
