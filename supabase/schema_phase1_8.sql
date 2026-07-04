-- ============================================================
-- PHASE 1.8 — run this in Supabase SQL Editor -> New query
-- Cleans up the schema and fixes the "duplicate entries" bug.
--
-- Root cause of the duplicates: the seed inserts in schema.sql /
-- schema_phase1_5.sql use `on conflict do nothing`, but the tables never
-- had a unique constraint for that to match against. Every re-run of
-- those scripts (or any duplicate insert) silently added new rows with
-- new random ids instead of being skipped — hence the doubled
-- education / experience / project / skill cards you saw on the site.
--
-- This migration is safe to re-run:
--   1) Removes existing duplicate rows, keeping the oldest copy of each.
--   2) Adds unique constraints so this can never happen again.
--   3) Adds the document attachment columns for "Recent updates".
--   4) Backfills the new editable stats fields on site_settings.
-- ============================================================

-- ---------- 1) De-duplicate existing rows ----------
with ranked as (
  select id, row_number() over (
    partition by title, school, year_range order by created_at asc, id asc
  ) rn
  from public.education
)
delete from public.education where id in (select id from ranked where rn > 1);

with ranked as (
  select id, row_number() over (
    partition by role, company, period order by created_at asc, id asc
  ) rn
  from public.experience
)
delete from public.experience where id in (select id from ranked where rn > 1);

with ranked as (
  select id, row_number() over (
    partition by name order by created_at asc, id asc
  ) rn
  from public.skill_groups
)
delete from public.skill_groups where id in (select id from ranked where rn > 1);

with ranked as (
  select id, row_number() over (
    partition by name order by created_at asc, id asc
  ) rn
  from public.projects
)
delete from public.projects where id in (select id from ranked where rn > 1);


-- ---------- 2) Unique constraints so seed re-runs can never duplicate again ----------
do $$ begin
  alter table public.education add constraint education_unique_entry unique (title, school, year_range);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.experience add constraint experience_unique_entry unique (role, company, period);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.skill_groups add constraint skill_groups_unique_name unique (name);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.projects add constraint projects_unique_name unique (name);
exception when duplicate_object then null; end $$;


-- ---------- 3) Document attachments on "Recent updates" ----------
alter table public.status_updates add column if not exists document_url text;
alter table public.status_updates add column if not exists document_name text;


-- ---------- 4) Backfill new editable stats fields on site_settings ----------
-- Adds heroStats (hero card's 3-up strip) and achievementStats (the GPA /
-- CGPA / shipped-projects strip) into the existing settings row, without
-- touching anything else already saved there.
update public.site_settings
set data = data || jsonb_build_object(
  'heroStats', coalesce(
    data->'heroStats',
    '[{"value":"20+","label":"Projects"},{"value":"3.76","label":"CGPA / 4"},{"value":"4+","label":"Yrs Coding"}]'::jsonb
  ),
  'achievementStats', coalesce(
    data->'achievementStats',
    '[{"value":"3.76","label":"B.Sc. CGPA / 4.00"},{"value":"5.00","label":"HSC GPA / 5.00"},{"value":"5.00","label":"SSC GPA / 5.00"},{"value":"8+","label":"Shipped projects"}]'::jsonb
  )
)
where id = 'main';
