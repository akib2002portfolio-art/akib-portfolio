import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Every piece of copy / media / theming that the site owner can edit from
 * admin mode lives in ONE row (id = "main") in the `site_settings` table,
 * inside a single jsonb `data` column. This keeps the schema simple while
 * still letting every field below be edited independently.
 */
export type ServiceItem = { title: string; description: string };
export type SocialLink = { label: string; url: string };
export type StatItem = { value: string; label: string };

export type SiteSettings = {
  navName: string;
  heroKicker: string;
  heroGreeting: string;
  heroHeadline: string[];
  heroSubtitle: string;
  heroRoles: string[];
  heroBigTitle: string[];
  heroTags: string[];
  heroPhotoUrl: string;
  quoteText: string;
  quoteAuthor: string;
  aboutIntro: string;
  aboutObjective: string;
  aboutFocus: string[];
  services: ServiceItem[];
  socialLinks: SocialLink[];
  heroStats: StatItem[];
  achievementStats: StatItem[];
  resumeUrl: string;
  themeHue: number;
  welcomeTitle: string;
  welcomeSubtitle: string;
  contactKicker: string;
  contactTitle: string;
  contactSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
};

// Fallback used until the row loads (or if a field is missing), so the
// site always renders Akib's real content by default.
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  navName: "Akib",
  heroKicker: "// hello world",
  heroGreeting: "Hey, I'm Akib",
  heroHeadline: ["Engineer.", "Builder.", "Problem solver."],
  heroSubtitle:
    "I design and ship full-stack products, mobile apps and AI-powered systems — turning ambiguous problems into clean, working software.",
  heroRoles: ["Full Stack Developer", "AI / ML Enthusiast", "Mobile App Developer", "Computer Vision Engineer"],
  heroBigTitle: ["Software", "Engineer"],
  heroTags: ["#01 Full-Stack", "#02 AI / ML", "#03 Computer Vision", "#04 IoT"],
  heroPhotoUrl: "",
  quoteText:
    "Great software isn't just written — it's crafted, questioned, and rebuilt until every line earns its place.",
  quoteAuthor: "Akib Al Imran",
  aboutIntro:
    "I'm a Software Engineer from Bangladesh with a Computer Science background and a love for shipping things that work. I work across the stack — web, mobile, ML and embedded — and care most about clarity, performance and the small details users actually feel.",
  aboutObjective:
    "To join a high-craft engineering team where I can grow as a full-stack and ML engineer, ship products with measurable impact, and contribute to systems that matter — from user-facing apps to intelligent automation.",
  aboutFocus: [
    "Full-stack web & mobile products",
    "Applied ML & computer vision",
    "Clean architecture & DX",
    "Shipping with measurable impact",
  ],
  services: [
    { title: "Full-Stack Web Development", description: "React, Node and MySQL/Mongo systems built for clarity and speed." },
    { title: "Mobile App Development", description: "Native Android apps in Java & Kotlin — clean UI, solid offline." },
    { title: "AI & Machine Learning", description: "Practical ML — from data prep to deployable models and APIs." },
    { title: "Computer Vision Systems", description: "Real-time detection, tracking and image analysis with OpenCV." },
    { title: "API & Database Design", description: "REST APIs, schema design, and integrations that won't bite back." },
    { title: "IoT & Embedded", description: "Arduino-based prototypes — sensors, robots, smart automation." },
  ],
  socialLinks: [
    { label: "GH", url: "https://github.com/akib2002portfolio-art" },
    { label: "in", url: "https://www.linkedin.com/in/akib-al-imran" },
    { label: "YT", url: "https://www.youtube.com/@akibalimran2002.portfolio" },
  ],
  heroStats: [
    { value: "20+", label: "Projects" },
    { value: "3.76", label: "CGPA / 4" },
    { value: "4+", label: "Yrs Coding" },
  ],
  achievementStats: [
    { value: "3.76", label: "B.Sc. CGPA / 4.00" },
    { value: "5.00", label: "HSC GPA / 5.00" },
    { value: "5.00", label: "SSC GPA / 5.00" },
    { value: "8+", label: "Shipped projects" },
  ],
  resumeUrl: "/Akib-Al-Imran_Resume.pdf",
  themeHue: 245,
  welcomeTitle: "Welcome back, Akib 👋",
  welcomeSubtitle: "You're in admin mode — hover any section to edit it live, right on the page.",
  contactKicker: "// let's talk",
  contactTitle: "Have a project in mind?",
  contactSubtitle:
    "I'm open to internships, full-time roles and freelance work. Drop a message and I'll get back within a day.",
  contactEmail: "akib2002.portfolio@gmail.com",
  contactPhone: "+880 1619-375433",
  contactLocation: "Dhaka, Bangladesh",
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("data").eq("id", "main").maybeSingle();
      if (error) throw error;
      return { ...DEFAULT_SITE_SETTINGS, ...((data?.data as Partial<SiteSettings>) ?? {}) };
    },
    staleTime: 30_000,
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<SiteSettings>) => {
      // Merge against the freshest cached copy so a partial-tab save
      // (e.g. just the Hero tab) never wipes out other fields.
      const current = queryClient.getQueryData<SiteSettings>(["site_settings"]) ?? DEFAULT_SITE_SETTINGS;
      const next = { ...current, ...patch };
      const { error } = await supabase.from("site_settings").upsert({ id: "main", data: next, updated_at: new Date().toISOString() });
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(["site_settings"], next);
    },
  });
}

/** Applies the chosen theme hue as CSS variable overrides (works for both
 * light and dark mode since inline styles beat class-based rules). */
export function applyThemeHue(hue: number) {
  const root = document.documentElement.style;
  root.setProperty("--primary", `oklch(0.7 0.18 ${hue})`);
  root.setProperty("--accent", `oklch(0.78 0.16 ${hue - 25})`);
  root.setProperty("--accent-glow", `oklch(0.7 0.2 ${hue})`);
  root.setProperty("--sidebar-primary", `oklch(0.488 0.243 ${hue})`);
}

export const THEME_PRESETS: { name: string; hue: number }[] = [
  { name: "Sky blue", hue: 245 },
  { name: "Violet", hue: 280 },
  { name: "Emerald", hue: 150 },
  { name: "Amber", hue: 60 },
  { name: "Rose", hue: 340 },
  { name: "Teal", hue: 195 },
];
