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
