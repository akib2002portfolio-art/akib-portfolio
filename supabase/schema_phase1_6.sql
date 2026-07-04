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
