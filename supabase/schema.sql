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
