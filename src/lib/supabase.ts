import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly in dev instead of silently breaking data fetches.
  console.error(
    "Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ---- Shared types ----
export type ProjectRow = {
  id: string;
  position: number;
  name: string;
  description: string;
  tags: string[];
  image_url: string;
  github_url: string | null;
  github_backend_url: string | null;
  live_url: string | null;
  featured: boolean;
  created_at: string;
};

export type StatusRow = {
  id: string;
  message: string;
  link: string | null;
  image_url: string | null;
  document_url: string | null;
  document_name: string | null;
  created_at: string;
};

export type RatingRow = {
  id: string;
  stars: number;
  comment: string | null;
  name: string | null;
  email: string | null;
  created_at: string;
};

export type SkillItem = { name: string; icon: string };
export type SkillGroupRow = {
  id: string;
  position: number;
  name: string;
  accent: string;
  items: SkillItem[];
  created_at: string;
};

export type CertEntry = {
  title: string;
  issuer: string;
  date: string;
  image_url: string;
  rotate?: number;
};

export type ExperienceRow = {
  id: string;
  position: number;
  role: string;
  company: string;
  type: string;
  period: string;
  location: string;
  points: string[];
  certs: CertEntry[];
  created_at: string;
};

export type EducationRow = {
  id: string;
  position: number;
  year_range: string;
  title: string;
  school: string;
  meta: string;
  detail: string | null;
  certs: CertEntry[];
  created_at: string;
};
