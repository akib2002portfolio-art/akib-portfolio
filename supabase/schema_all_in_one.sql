-- ============================================================
-- ALL-IN-ONE — run this single file in Supabase SQL Editor.
-- This is schema.sql + schema_phase1_5.sql + schema_phase1_6.sql +
-- schema_phase1_7.sql + schema_phase1_8.sql concatenated in the
-- correct order, with the realtime-publication bug fixed.
-- 100% safe to re-run any number of times.
-- ============================================================

-- ============================================================
-- Run this once in Supabase Dashboard -> SQL Editor -> New query
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================

-- ---------- PROJECTS (Phase 1 — built now) ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  name text not null,
  description text not null default '',
  tags text[] not null default '{}',
  image_url text not null default '',
  github_url text,
  github_backend_url text,
  live_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Anyone (including logged-out visitors) can read projects.
drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
  on public.projects for select
  using (true);

-- Only a logged-in admin (you) can insert/update/delete.
drop policy if exists "Authenticated can manage projects" on public.projects;
create policy "Authenticated can manage projects"
  on public.projects for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ---------- STATUS / UPDATES (Phase 2 — built later) ----------
create table if not exists public.status_updates (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  link text,
  created_at timestamptz not null default now()
);

alter table public.status_updates enable row level security;

drop policy if exists "Public can read status" on public.status_updates;
create policy "Public can read status"
  on public.status_updates for select
  using (true);

drop policy if exists "Authenticated can manage status" on public.status_updates;
create policy "Authenticated can manage status"
  on public.status_updates for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ---------- RATINGS (Phase 2 — built later, realtime) ----------
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  stars smallint not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.ratings enable row level security;

-- Visitors can read all ratings (to compute a live average) and submit
-- one of their own. They cannot edit or delete anyone's rating —
-- only you can, via the admin panel using an authenticated session.
drop policy if exists "Public can read ratings" on public.ratings;
create policy "Public can read ratings"
  on public.ratings for select
  using (true);

drop policy if exists "Public can submit ratings" on public.ratings;
create policy "Public can submit ratings"
  on public.ratings for insert
  with check (true);

drop policy if exists "Authenticated can moderate ratings" on public.ratings;
create policy "Authenticated can moderate ratings"
  on public.ratings for delete
  using (auth.role() = 'authenticated');

-- Enable realtime on ratings so the live average updates without a refresh.
-- Guarded because `alter publication ... add table` errors (instead of
-- no-op'ing) if the table is already a publication member.
do $$ begin
  alter publication supabase_realtime add table public.ratings;
exception when duplicate_object then null;
end $$;


-- ---------- STORAGE (project images, uploaded from the admin panel) ----------
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view project images" on storage.objects;
create policy "Public can view project images"
  on storage.objects for select
  using (bucket_id = 'project-images');

drop policy if exists "Authenticated can upload project images" on storage.objects;
create policy "Authenticated can upload project images"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can delete project images" on storage.objects;
create policy "Authenticated can delete project images"
  on storage.objects for delete
  using (bucket_id = 'project-images' and auth.role() = 'authenticated');


-- ---------- SEED: your current 11 projects ----------
-- This preserves what's already live on your site. Image URLs point at
-- your existing GitHub-hosted repo assets so you don't need to re-upload
-- anything right now — you can replace them later from the admin panel.
-- image_url values below are relative paths served from your app's /public
-- folder (e.g. https://akibalimran.vercel.app/projects/proj-ashgrove.jpg).
-- Replace any of them later from the admin panel by uploading a new image.
insert into public.projects (position, name, description, tags, image_url, github_url, github_backend_url, live_url, featured)
values
  (1, 'Ashgrove Hall — Hostel Management', 'Full-stack hostel management platform with JWT auth, role-based access, room allocation, complaint tracking and admin analytics.', array['Node.js','Express','PostgreSQL','JWT'], '/projects/proj-ashgrove.jpg', 'https://github.com/akib2002portfolio-art/ashgrove-hall-frontend', 'https://github.com/akib2002portfolio-art/ashgrove-hall-api', 'https://ashgrove-hall-frontend.vercel.app/', true),
  (2, 'Cafeteria Management System', 'Food ordering and inventory dashboard with real-time tickets, kitchen queue and sales analytics for busy cafeterias.', array['Full-Stack','Node','MySQL'], '/projects/project-cafeteria.jpg', 'https://github.com/akib2002portfolio-art/smart-cafe-management-system.git', null, 'https://code-arcade.github.io/food-order-web/', true),
  (3, 'Routine Management System', 'Automated class & exam scheduling with conflict detection, teacher workload balancing and shareable timetables.', array['Web','MySQL','PHP'], '/projects/project-routine.jpg', 'https://github.com/akib2002portfolio-art/Routine-Management-System.git', null, 'https://diu-routine-assist-bd.vercel.app/', true),
  (4, 'AI Powered Daily Task Manager', 'Smart to-do platform that organizes daily tasks and uses AI to suggest follow-ups, priorities and next best actions.', array['React','Vite','AI','Vercel'], '/projects/proj-daily.jpg', 'https://github.com/akib2002portfolio-art/AI-powered-daily-task', null, 'https://ai-powered-daily-task.vercel.app/', false),
  (5, 'Workspace OS', 'Widget-based productivity dashboard — a customizable workspace with notes, tasks, focus timer and quick-launch tiles.', array['React','TypeScript','Tailwind'], '/projects/proj-workspace.jpg', 'https://github.com/akib2002portfolio-art/Workspace-OS', null, 'https://workspace-os-nu.vercel.app/', false),
  (6, 'Full-Stack-Social-Media-Platform', 'A full-stack social platform with posts, feeds, likes, comments and real-time interactions.', array['React','Node.js','MongoDB'], '/projects/project-social.jpg', 'https://github.com/akib2002portfolio-art/Full-Stack-Social-Media-Platform', null, 'https://socializerme.vercel.app/', false),
  (7, 'Online-Trip-Organizer', 'AI-powered trip planning platform that builds personalized itineraries based on preferences and budget.', array['Next.js','AI','Vercel'], '/projects/project-trip.jpg', 'https://github.com/akib2002portfolio-art/Online-Trip-Organizer', null, 'https://triptailor-ai.vercel.app/', false),
  (8, 'Dashboard-web-project', 'A modern dashboard landing template with analytics widgets, charts and responsive UI components.', array['React','shadcn/ui','Tailwind'], '/projects/project-dashboard.jpg', 'https://github.com/akib2002portfolio-art/Dashboard-web-project', null, 'https://shadcnstore.com/templates/dashboard/shadcn-dashboard-landing-template/dashboard', false),
  (9, 'Spotify Clone', 'Android music streaming app with playlists, playback controls and offline favorites.', array['Android','Kotlin'], '/projects/project-spotify.jpg', 'https://github.com/akib2002portfolio-art/Spotify-Clone.git', null, 'https://spotify-demo-pp2k.netlify.app/', false),
  (10, 'Photo Editing Application', 'Native Android image editor with filters, layers and one-tap export presets.', array['Android','Java'], '/projects/project-photo.jpg', 'https://github.com/akib2002portfolio-art/Photo-Editing-Application.git', null, 'https://swapan-code.github.io/Photo-Editor-Project/', false),
  (11, 'Line Follower Robot', 'Arduino-based autonomous robot with PID-tuned line tracking and obstacle handling.', array['Arduino','C++','IoT'], '/projects/project-robot.jpg', 'https://github.com/akib2002portfolio-art/Line-Follower-Robot.git', null, null, false)
on conflict do nothing;

-- ============================================================
-- PHASE 1.5 — run this in Supabase SQL Editor -> New query
-- Makes Skills, Experience and Education editable from /admin,
-- same pattern as the projects table (public read, admin write).
-- Safe to re-run.
-- ============================================================

-- ---------- SKILLS (grouped, e.g. "Frontend" -> [React, Next.js, ...]) ----------
create table if not exists public.skill_groups (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  name text not null,
  accent text not null default 'from-sky-400 to-blue-500',
  items jsonb not null default '[]', -- [{ "name": "React", "icon": "⚛️" }, ...]
  created_at timestamptz not null default now()
);

alter table public.skill_groups enable row level security;

drop policy if exists "Public can read skill_groups" on public.skill_groups;
create policy "Public can read skill_groups"
  on public.skill_groups for select
  using (true);

drop policy if exists "Authenticated can manage skill_groups" on public.skill_groups;
create policy "Authenticated can manage skill_groups"
  on public.skill_groups for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ---------- EXPERIENCE ----------
create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  role text not null,
  company text not null,
  type text not null default '',
  period text not null default '',
  location text not null default '',
  points text[] not null default '{}',
  certs jsonb not null default '[]', -- [{ "title","issuer","date","image_url","rotate" }]
  created_at timestamptz not null default now()
);

alter table public.experience enable row level security;

drop policy if exists "Public can read experience" on public.experience;
create policy "Public can read experience"
  on public.experience for select
  using (true);

drop policy if exists "Authenticated can manage experience" on public.experience;
create policy "Authenticated can manage experience"
  on public.experience for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ---------- EDUCATION ----------
create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  year_range text not null default '',
  title text not null,
  school text not null default '',
  meta text not null default '',
  detail text,
  certs jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.education enable row level security;

drop policy if exists "Public can read education" on public.education;
create policy "Public can read education"
  on public.education for select
  using (true);

drop policy if exists "Authenticated can manage education" on public.education;
create policy "Authenticated can manage education"
  on public.education for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ---------- STORAGE bucket for certificate images ----------
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

drop policy if exists "Public can view site media" on storage.objects;
create policy "Public can view site media"
  on storage.objects for select
  using (bucket_id = 'site-media');

drop policy if exists "Authenticated can upload site media" on storage.objects;
create policy "Authenticated can upload site media"
  on storage.objects for insert
  with check (bucket_id = 'site-media' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can delete site media" on storage.objects;
create policy "Authenticated can delete site media"
  on storage.objects for delete
  using (bucket_id = 'site-media' and auth.role() = 'authenticated');


-- ---------- SEED: your current skills, experience and education ----------
insert into public.skill_groups (position, name, accent, items) values
  (1, 'Languages', 'from-sky-400 to-blue-500', '[{"name":"Python","icon":"🐍"},{"name":"JavaScript","icon":"🟨"},{"name":"TypeScript","icon":"🔷"},{"name":"C / C++","icon":"🧩"},{"name":"Java","icon":"☕"},{"name":"Kotlin","icon":"🅺"},{"name":"PHP","icon":"🐘"}]'),
  (2, 'Frontend', 'from-cyan-400 to-teal-500', '[{"name":"React.js","icon":"⚛️"},{"name":"Next.js","icon":"▲"},{"name":"HTML5","icon":"🧱"},{"name":"CSS3 / Tailwind","icon":"🎨"},{"name":"Bootstrap","icon":"🅱️"}]'),
  (3, 'Backend', 'from-emerald-400 to-green-500', '[{"name":"Node.js","icon":"🟢"},{"name":"Express.js","icon":"🚂"},{"name":"Laravel","icon":"🅻"},{"name":"REST APIs","icon":"🔗"},{"name":"JWT Auth","icon":"🔐"}]'),
  (4, 'Mobile & AI/ML', 'from-fuchsia-400 to-pink-500', '[{"name":"Android (Java)","icon":"🤖"},{"name":"Android (Kotlin)","icon":"📱"},{"name":"Machine Learning","icon":"🧠"},{"name":"Computer Vision","icon":"👁️"},{"name":"OpenCV","icon":"🎯"}]'),
  (5, 'Data & Storage', 'from-amber-400 to-orange-500', '[{"name":"MySQL","icon":"🐬"},{"name":"PostgreSQL","icon":"🐘"},{"name":"MongoDB","icon":"🍃"},{"name":"Firebase","icon":"🔥"}]'),
  (6, 'Tools & DevOps', 'from-violet-400 to-indigo-500', '[{"name":"Git & GitHub","icon":"🐙"},{"name":"VS Code","icon":"🧑‍💻"},{"name":"Vercel","icon":"▲"},{"name":"Railway","icon":"🚄"},{"name":"Arduino / IoT","icon":"⚡"},{"name":"Postman","icon":"📮"}]')
on conflict do nothing;

insert into public.experience (position, role, company, type, period, location, points, certs) values
  (1, 'Network Engineer', 'Agni Systems PLC', 'Internship · On-site', 'Apr 2026 — Present', 'Gulshan, Dhaka, Bangladesh',
    array['Hands-on with ISP-grade network engineering and infrastructure.','Real-time monitoring, routing and troubleshooting on live networks.'],
    '[{"title":"Internship Program — Network Engineering","issuer":"Agni Systems PLC","date":"Apr 2026 – Sep 2026","image_url":"/certs/cert-agni.jpg"}]'),
  (2, 'Engineer Intern', 'weDevs', 'Part-time · On-site', 'Apr 2026 — Jun 2026', 'Dhaka, Bangladesh',
    array['Web engineering & software development on production products.','Collaborated on features, code review and problem solving.'],
    '[{"title":"Internship Program — Web Engineering & Software Development","issuer":"weDevs","date":"Apr 2026 – Jun 2026","image_url":"/certs/cert-wedevs.jpg"}]')
on conflict do nothing;

insert into public.education (position, year_range, title, school, meta, detail, certs) values
  (1, '2021 — 2025', 'B.Sc. in Computer Science & Engineering', 'Bangladesh Army University of Engineering & Technology', 'CGPA 3.76 / 4.00',
    'Full-stack development, mobile apps and applied AI/ML through team-based academic projects. Also earned an Industrial Training Certificate (Laravel) and competed in MIND STORM 4.0 & 5.0 programming events.',
    '[{"title":"B.Sc. in CSE — Degree Certificate","issuer":"BAUET","date":"May 2026","image_url":"/certs/cert-bsc.jpg"},{"title":"Industrial Training Program (Laravel)","issuer":"LABAR","date":"Jan 2024","image_url":"/certs/cert-labar.jpg"},{"title":"MIND STORM 5.0 — Participation","issuer":"BAUET","date":"Mar 2024","image_url":"/certs/cert-mind5.jpg"},{"title":"MIND STORM 4.0 — Participation","issuer":"BAUET","date":"Mar 2023","image_url":"/certs/cert-mind4.jpg"}]'),
  (2, '2017 — 2019', 'Higher Secondary Certificate', 'Rajuk Uttara Model College', 'GPA 5.00 / 5.00', null,
    '[{"title":"Higher Secondary School Certificate","issuer":"Board of Intermediate & Secondary Education, Dhaka","date":"Jul 2019","image_url":"/certs/cert-hsc.jpg"}]'),
  (3, '2015 — 2017', 'Secondary School Certificate', 'Rajuk Uttara Model College', 'GPA 5.00 / 5.00', null,
    '[{"title":"Secondary School Certificate","issuer":"Board of Intermediate & Secondary Education, Dhaka","date":"May 2017","image_url":"/certs/cert-ssc.jpg"}]')
on conflict do nothing;

-- ============================================================
-- PHASE 1.6 — run this in Supabase SQL Editor -> New query
-- Adds:
--   1) public.site_settings  — ONE row that stores every editable
--      piece of site content (nav name, hero copy, quote, about
--      text, services, social links, resume url, theme color).
--   2) name / email columns on public.ratings so reviewers can
--      leave their name + email with a review.
-- Safe to re-run.
-- ============================================================

-- ---------- SITE SETTINGS (singleton row, id = 'main') ----------
create table if not exists public.site_settings (
  id text primary key default 'main',
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Public can read site_settings" on public.site_settings;
create policy "Public can read site_settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Authenticated can manage site_settings" on public.site_settings;
create policy "Authenticated can manage site_settings"
  on public.site_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed the single settings row with the current live content, so
-- nothing changes visually until you edit something from /admin mode.
insert into public.site_settings (id, data) values (
  'main',
  '{
    "navName": "Akib",
    "heroKicker": "// hello world",
    "heroGreeting": "Hey, I''m Akib",
    "heroHeadline": ["Engineer.", "Builder.", "Problem solver."],
    "heroSubtitle": "I design and ship full-stack products, mobile apps and AI-powered systems — turning ambiguous problems into clean, working software.",
    "heroRoles": ["Full Stack Developer", "AI / ML Enthusiast", "Mobile App Developer", "Computer Vision Engineer"],
    "heroBigTitle": ["Software", "Engineer"],
    "heroTags": ["#01 Full-Stack", "#02 AI / ML", "#03 Computer Vision", "#04 IoT"],
    "heroPhotoUrl": "",
    "quoteText": "Great software isn''t just written — it''s crafted, questioned, and rebuilt until every line earns its place.",
    "quoteAuthor": "Akib Al Imran",
    "aboutIntro": "I''m a Software Engineer from Bangladesh with a Computer Science background and a love for shipping things that work. I work across the stack — web, mobile, ML and embedded — and care most about clarity, performance and the small details users actually feel.",
    "aboutObjective": "To join a high-craft engineering team where I can grow as a full-stack and ML engineer, ship products with measurable impact, and contribute to systems that matter — from user-facing apps to intelligent automation.",
    "aboutFocus": ["Full-stack web & mobile products", "Applied ML & computer vision", "Clean architecture & DX", "Shipping with measurable impact"],
    "services": [
      {"title": "Full-Stack Web Development", "description": "React, Node and MySQL/Mongo systems built for clarity and speed."},
      {"title": "Mobile App Development", "description": "Native Android apps in Java & Kotlin — clean UI, solid offline."},
      {"title": "AI & Machine Learning", "description": "Practical ML — from data prep to deployable models and APIs."},
      {"title": "Computer Vision Systems", "description": "Real-time detection, tracking and image analysis with OpenCV."},
      {"title": "API & Database Design", "description": "REST APIs, schema design, and integrations that won''t bite back."},
      {"title": "IoT & Embedded", "description": "Arduino-based prototypes — sensors, robots, smart automation."}
    ],
    "socialLinks": [
      {"label": "GH", "url": "https://github.com/akib2002portfolio-art"},
      {"label": "in", "url": "https://www.linkedin.com/in/akib-al-imran"},
      {"label": "YT", "url": "https://www.youtube.com/@akibalimran2002.portfolio"}
    ],
    "resumeUrl": "/Akib-Al-Imran_Resume.pdf",
    "themeHue": 245,
    "welcomeTitle": "Welcome back",
    "welcomeSubtitle": "Admin mode is on — everything on this page is now editable."
  }'::jsonb
)
on conflict (id) do nothing;


-- ---------- REVIEWS: add reviewer name + email ----------
alter table public.ratings add column if not exists name text;
alter table public.ratings add column if not exists email text;

-- Phase 1.7 — media on "Recent updates" posts.
-- Run this once in the Supabase SQL editor (Project → SQL Editor) so the
-- image upload field in "Post update" / "Edit update" persists correctly.
-- Safe to re-run: `add column if not exists` is a no-op if already applied.

alter table public.status_updates add column if not exists image_url text;

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
