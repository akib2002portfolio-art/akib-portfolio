# Supabase schema — run order

**Easiest path:** just run **`schema_all_in_one.sql`**. It's all 5 files
below concatenated in the correct order, with every known bug fixed
(including the `alter publication` error some people hit on re-runs). It
is 100% safe to run once, or many times — nothing will duplicate.

If you'd rather run things incrementally, use these individually — in
this order — in the Supabase Dashboard → **SQL Editor → New query**:

| # | File | What it does |
|---|------|---------------|
| — | `schema_all_in_one.sql` | **Recommended.** All of the below, concatenated, in order, with fixes applied. Run this one file. |
| 1 | `schema.sql` | Core tables: `projects`, `status_updates`, `ratings`, storage bucket + policies, seed projects. |
| 2 | `schema_phase1_5.sql` | Adds `skill_groups`, `experience`, `education` tables + seed data + `site-media` storage bucket. |
| 3 | `schema_phase1_6.sql` | Adds `site_settings` (all editable page copy) + `name`/`email` columns on `ratings`. |
| 4 | `schema_phase1_7.sql` | Adds `image_url` on `status_updates` (photo/screenshot on "Recent updates"). |
| 5 | `schema_phase1_8.sql` | **Cleanup migration** — de-duplicates any repeated rows, adds unique constraints so seeds can never duplicate again, adds document attachments on updates, and backfills the new editable stats fields. |

If you've already run 1–4 on a live project, you only need to run
`schema_phase1_8.sql` to get the fixes below.

## What `schema_phase1_8.sql` fixes

- **"relation ratings is already member of publication" error** —
  `schema.sql`'s `alter publication supabase_realtime add table
  public.ratings;` isn't idempotent by itself; re-running the combined
  script after realtime was already enabled throws this error and stops
  execution before anything after it runs. Fixed by wrapping it in a
  guarded block that no-ops if it's already a member. If you already have
  a copy of `schema.sql` from before, replace it with the updated one in
  this folder (or just use `schema_all_in_one.sql`).
- **Duplicate education / experience / project / skill cards** — the
  original seed scripts used `on conflict do nothing` without a matching
  unique constraint, so re-running them silently inserted copies instead
  of being skipped. This migration removes the duplicates (keeping the
  oldest row of each) and adds real unique constraints so it can't
  happen again.
- **Reviews missing name/email** — if you never ran `schema_phase1_6.sql`,
  the `name`/`email` columns don't exist yet, so the site was silently
  saving reviews without them. Run 1→5 in order to pick that up.
- **Document attachments on "Recent updates"** — adds `document_url` /
  `document_name` so you can attach a PDF/Word doc to an update, not just
  a photo.
- **Editable GPA/CGPA/shipped-projects stats** — backfills the
  `heroStats` / `achievementStats` fields inside `site_settings.data` so
  those numbers are editable from **Edit site content → Stats** instead
  of being hardcoded.
