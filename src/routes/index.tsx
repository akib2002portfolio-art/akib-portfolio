import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import portrait from "@/assets/akib-portrait-new.jpg";
const resumeUrl = "/Akib-Al-Imran_Resume.pdf";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type ProjectRow, type SkillGroupRow, type ExperienceRow, type EducationRow } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AdminProvider, useAdmin } from "@/lib/admin-context";
import { LoginModal, EditModalShell, EditButton, AddButton } from "@/components/admin/shared";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { SkillGroupForm } from "@/components/admin/SkillGroupForm";
import { ExperienceForm } from "@/components/admin/ExperienceForm";
import { EducationForm } from "@/components/admin/EducationForm";
import { StatusUpdateForm } from "@/components/admin/StatusUpdateForm";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";
import type { StatusRow, RatingRow } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { useSiteSettings, applyThemeHue, DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Akib Al Imran — Software Engineer · Full-Stack · AI/ML" },
      { name: "description", content: "Akib Al Imran — Software Engineer from Dhaka, Bangladesh. Full-stack web, mobile, AI/ML, computer vision and IoT projects." },
      { property: "og:title", content: "Akib Al Imran — Software Engineer" },
      { property: "og:description", content: "Full-Stack · AI/ML · Computer Vision · Mobile · IoT" },
    ],
  }),
  component: Index,
});

/**
 * Defensive client-side de-dupe. The database now enforces uniqueness
 * (see supabase/schema_phase1_8.sql), but this keeps already-duplicated
 * rows from rendering twice on sites that haven't run that migration yet.
 * Keeps the earliest (oldest created_at) row for each key.
 */
function dedupeByKey<T extends { created_at: string }>(rows: T[], keyOf: (row: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const row of rows) {
    const key = keyOf(row);
    const existing = seen.get(key);
    if (!existing || new Date(row.created_at) < new Date(existing.created_at)) {
      seen.set(key, row);
    }
  }
  return Array.from(seen.values());
}

const ROLES = [
  "Full Stack Developer",
  "AI / ML Enthusiast",
  "Mobile App Developer",
  "Computer Vision Engineer",
];

function useTypewriter(words: string[], typeMs = 70, holdMs = 1400) {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[i % words.length];
    const done = !del && text === word;
    const empty = del && text === "";
    const delay = done ? holdMs : empty ? 250 : del ? 35 : typeMs;
    const t = setTimeout(() => {
      if (done) setDel(true);
      else if (empty) {
        setDel(false);
        setI((n) => n + 1);
      } else {
        setText((prev) =>
          del ? prev.slice(0, -1) : word.slice(0, prev.length + 1),
        );
      }
    }, delay);
    return () => clearTimeout(t);
  }, [text, del, i, words, typeMs, holdMs]);
  return text;
}

const NAV = [
  { id: "about", label: "About" },
  { id: "background", label: "Background" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "services", label: "Services" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

function Nav() {
  const [light, setLight] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAdmin, setLoginOpen, signOut, openEditor } = useAdmin();
  const { data: settings } = useSiteSettings();
  const navName = settings?.navName ?? DEFAULT_SITE_SETTINGS.navName;
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isLight = saved === "light";
    setLight(isLight);
    document.documentElement.classList.toggle("light", isLight);
  }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("theme", next ? "light" : "dark");
  };
  return (
    <header className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[min(96%,1100px)]">
      <div className="glass rounded-full pl-5 pr-2 py-2 flex items-center justify-between gap-3">
        <a href="#top" className="flex items-center gap-2 font-display font-bold tracking-tight shrink-0">
          <span className="size-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--accent-glow)]" />
          {navName}<span className="text-primary">.</span>
        </a>
        <nav className="hidden lg:flex items-center gap-1 text-[13px] text-muted-foreground">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="px-3 py-1.5 rounded-full hover:text-foreground hover:bg-white/5 transition-colors">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline-flex text-[11px] font-mono text-primary glass rounded-full px-3 py-1.5">● Admin mode</span>
              <button
                onClick={() => openEditor("siteSettings", { initialTab: "identity" })}
                title="Edit site content"
                aria-label="Edit site content"
                className="size-9 rounded-full glass flex items-center justify-center text-primary hover:bg-primary/10 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>
              <button
                onClick={signOut}
                className="hidden sm:inline-flex text-[11px] font-semibold rounded-full glass px-3 py-1.5 hover:bg-white/10 transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              aria-label="Admin login"
              title="Admin login"
              className="hidden sm:flex size-9 rounded-full glass items-center justify-center text-foreground hover:bg-foreground/5 transition"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
          )}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="size-9 rounded-full glass flex items-center justify-center text-foreground hover:bg-foreground/5 transition"
            title={light ? "Switch to dark" : "Switch to light"}
          >
            {light ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            )}
          </button>
          <a
            href="#contact"
            className="hidden sm:inline-flex text-sm font-medium rounded-full px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Get in touch
          </a>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="lg:hidden size-9 rounded-full glass flex items-center justify-center text-foreground hover:bg-foreground/5 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="glass-strong border-r border-white/10 w-72 p-0 flex flex-col">
              <div className="p-6 border-b border-white/10">
                <p className="font-display font-bold text-xl">{navName}<span className="text-primary">.</span></p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">// navigation</p>
              </div>
              <nav className="flex-1 p-4 flex flex-col gap-1">
                {NAV.map((n) => (
                  <a
                    key={n.id}
                    href={`#${n.id}`}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 rounded-2xl text-sm font-medium hover:bg-primary/10 hover:text-primary transition flex items-center justify-between group"
                  >
                    <span>{n.label}</span>
                    <span className="text-primary opacity-0 group-hover:opacity-100 transition">→</span>
                  </a>
                ))}
              </nav>
              <div className="p-4 border-t border-white/10 space-y-2">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => { setOpen(false); openEditor("siteSettings", { initialTab: "identity" }); }}
                      className="block w-full text-center rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
                    >
                      ✎ Edit site content
                    </button>
                    <button
                      onClick={signOut}
                      className="block w-full text-center rounded-full glass px-4 py-2.5 text-sm font-semibold hover:bg-white/10 transition"
                    >
                      ● Admin mode — Sign out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setOpen(false); setLoginOpen(true); }}
                    className="block w-full text-center rounded-full glass px-4 py-2.5 text-sm font-semibold hover:bg-white/10 transition"
                  >
                    Admin login
                  </button>
                )}
                <a
                  href={settings?.resumeUrl ?? resumeUrl}
                  download="Resume.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
                >
                  Download Resume
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { data: settings } = useSiteSettings();
  const s = settings ?? DEFAULT_SITE_SETTINGS;
  const { isAdmin, openEditor } = useAdmin();
  const typed = useTypewriter(s.heroRoles.length ? s.heroRoles : ROLES);
  const [line1, line2, line3] = s.heroHeadline.length === 3 ? s.heroHeadline : DEFAULT_SITE_SETTINGS.heroHeadline;
  const [big1, big2] = s.heroBigTitle.length === 2 ? s.heroBigTitle : DEFAULT_SITE_SETTINGS.heroBigTitle;
  return (
    <section id="top" className="relative pt-32 pb-16 px-4 overflow-hidden">
      {/* Animated background layer */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div className="absolute -top-32 -left-24 size-[420px] rounded-full bg-primary/25 blur-3xl animate-orb" />
        <div className="absolute top-40 -right-24 size-[480px] rounded-full bg-accent/20 blur-3xl animate-orb" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-0 left-1/3 size-[360px] rounded-full bg-primary/15 blur-3xl animate-orb" style={{ animationDelay: "-3s" }} />
      </div>

      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left intro card */}
        <div className="lg:col-span-5 glass-strong rounded-3xl p-8 flex flex-col justify-between animate-fade-up relative overflow-hidden group">
          {isAdmin && <EditButton label="Edit hero content" onClick={() => openEditor("siteSettings", { initialTab: "hero" })} />}
          <div className="pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div>
            <div className="inline-flex items-center gap-2 glass rounded-full pl-2 pr-4 py-1.5 mb-6">
              <span className="relative flex size-2.5">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse-ring" />
                <span className="relative size-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Available for new opportunities
              </span>
            </div>
            <p className="text-primary text-sm font-mono mb-3">{s.heroKicker}</p>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05]">
              {line1}<br />{line2}<br />
              <span className="text-gradient">{line3}</span>
            </h1>
            <p className="mt-6 text-muted-foreground max-w-md">{s.heroSubtitle}</p>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {(s.heroStats.length ? s.heroStats : DEFAULT_SITE_SETTINGS.heroStats).map((stat) => (
              <div key={stat.label} className="glass rounded-2xl px-3 py-3 text-center">
                <div className="text-xl font-display font-bold text-gradient">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#projects" className="group/btn relative rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold glow-primary hover:translate-y-[-1px] transition inline-flex items-center gap-2">
              View Projects
              <span className="transition-transform group-hover/btn:translate-x-1">→</span>
            </a>
            <a href="#contact" className="rounded-full glass px-5 py-2.5 text-sm font-semibold hover:bg-white/10 transition">
              Contact Me
            </a>
            <a href={s.resumeUrl} download="Resume.pdf" target="_blank" rel="noreferrer" className="rounded-full glass px-5 py-2.5 text-sm font-semibold hover:bg-white/10 transition inline-flex items-center gap-2">
              Download Resume
            </a>
          </div>
        </div>

        {/* Hero portrait card */}
        <div className="hero-card lg:col-span-7 relative rounded-3xl overflow-hidden glass-strong min-h-[460px] animate-fade-up" style={{ animationDelay: "120ms" }}>
          {/* decorative spinning ring */}
          <div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full border border-dashed border-primary/30 animate-spin-slow" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full border border-dashed border-accent/20 animate-spin-slow" style={{ animationDirection: "reverse" }} />

          <img
            src={s.heroPhotoUrl || portrait}
            alt={`Portrait of ${s.navName}`}
            width={896}
            height={1152}
            className="absolute inset-0 size-full object-cover object-top opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />

          <div className="relative h-full p-8 md:p-10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="glass rounded-full px-3 py-1 text-xs font-mono text-muted-foreground">
                {s.heroGreeting}
              </span>
              <div className="flex items-center gap-2">
                {s.socialLinks.map((social) => (
                  <a key={social.label + social.url} href={social.url} target="_blank" rel="noreferrer"
                     className="glass rounded-full size-9 grid place-items-center text-xs font-mono hover:bg-primary/20 hover:text-primary transition">
                    {social.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <h2 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[0.95] text-white drop-shadow-lg">
                {big1}<br />{big2}
              </h2>
              <div className="mt-5 font-mono text-base md:text-lg text-primary min-h-[1.6em]">
                <span className="text-muted-foreground">{'>'} </span>
                <span>{typed}</span>
                <span className="animate-caret">|</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                {s.heroTags.map((t) => (
                  <span key={t} className="glass rounded-full px-3 py-1 text-muted-foreground hover:text-primary hover:border-primary/40 transition cursor-default">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Infinite marquee strip */}
      <div className="mx-auto max-w-6xl mt-6 glass rounded-full py-3 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex animate-marquee whitespace-nowrap text-xs font-mono text-muted-foreground">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-10 px-5">
              {["◆ React", "◆ Next.js", "◆ Node.js", "◆ Python", "◆ Android", "◆ TensorFlow", "◆ OpenCV", "◆ Arduino", "◆ PostgreSQL", "◆ TypeScript"].map((t) => (
                <span key={t + i} className="hover:text-primary transition-colors">{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:flex flex-col items-center gap-2 mt-10 text-muted-foreground">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-primary to-transparent" />
      </div>
    </section>
  );
}

function SectionLabel({ kicker, title, intro }: { kicker: string; title: string; intro?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
      <div className="md:col-span-5">
        <p className="text-primary text-sm font-mono">// {kicker}</p>
        <h2 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight">{title}</h2>
      </div>
      {intro && (
        <p className="md:col-span-7 md:pt-12 text-muted-foreground text-lg max-w-xl">{intro}</p>
      )}
    </div>
  );
}

/* ---------- Updates (manual "what I'm up to" feed) ---------- */
function useUpdates() {
  return useQuery({
    queryKey: ["status_updates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("status_updates").select("*").order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data as StatusRow[];
    },
    staleTime: 30_000,
  });
}

function Updates() {
  const { data: updates, isLoading, isError } = useUpdates();
  const { isAdmin, openEditor } = useAdmin();

  if (!isLoading && !isError && (!updates || updates.length === 0) && !isAdmin) return null;

  return (
    <section id="updates" className="px-4 pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-primary">what I'm up to</p>
              <h3 className="text-lg font-bold mt-1">Recent updates</h3>
            </div>
            {isAdmin && <AddButton label="Post update" onClick={() => openEditor("statusUpdate")} />}
          </div>
          {isLoading && <div className="grid gap-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 rounded-2xl glass animate-pulse" />)}</div>}
          {isError && <p className="text-sm text-muted-foreground">Couldn't load updates right now.</p>}
          {!isLoading && !isError && (
            <div className="grid gap-3">
              {(updates ?? []).length === 0 && <p className="text-sm text-muted-foreground">No updates posted yet.</p>}
              {(updates ?? []).map((u) => (
                <div key={u.id} className="relative glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                  {isAdmin && <EditButton onClick={() => openEditor("statusUpdate", u)} />}
                  {u.image_url && (
                    <img
                      src={u.image_url}
                      alt=""
                      className="w-full sm:w-32 h-32 sm:h-20 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                  )}
                  <div className="min-w-0 flex-1 pr-8 sm:pr-0">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                    </span>
                    <p className="text-sm leading-relaxed mt-1">{u.message}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {u.link && (
                        <a href={u.link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline inline-block">
                          View post ↗
                        </a>
                      )}
                      {u.document_url && (
                        <a
                          href={u.document_url}
                          target="_blank"
                          rel="noreferrer"
                          download={u.document_name ?? undefined}
                          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          📎 {u.document_name || "Attached document"} ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Quote() {
  const { data: settings } = useSiteSettings();
  const s = settings ?? DEFAULT_SITE_SETTINGS;
  const { isAdmin, openEditor } = useAdmin();
  return (
    <section className="px-4 py-24 relative">
      <div className="mx-auto max-w-4xl text-center relative">
        {isAdmin && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => openEditor("siteSettings", { initialTab: "quote" })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full glass px-3.5 py-1.5 hover:bg-primary/10 hover:text-primary transition"
            >
              ✎ Edit quote
            </button>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 -z-10 grid place-items-center">
          <div className="size-[420px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <span className="font-display text-[120px] md:text-[180px] leading-none text-primary/30 select-none block -mb-8">"</span>
        <blockquote className="font-display text-2xl md:text-4xl font-semibold leading-snug text-gradient">
          {s.quoteText}
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-3 text-muted-foreground">
          <span className="h-px w-10 bg-primary/50" />
          <span className="font-mono text-sm">{s.quoteAuthor}</span>
          <span className="h-px w-10 bg-primary/50" />
        </div>
        <p className="mt-3 text-xs font-mono text-muted-foreground/70 uppercase tracking-[0.4em]">
          Thanks for scrolling ✦ let's build something
        </p>
      </div>
    </section>
  );
}

function About() {
  const { data: settings } = useSiteSettings();
  const s = settings ?? DEFAULT_SITE_SETTINGS;
  const { isAdmin, openEditor } = useAdmin();
  const facts = [
    { k: "Location", v: "Dhaka, Bangladesh", i: "📍" },
    { k: "Languages", v: "Bengali · English", i: "🗣" },
    { k: "CGPA", v: "3.76 / 4.00", i: "🎓" },
    { k: "Status", v: "Open to roles", i: "💼" },
  ];
  return (
    <section id="about" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <SectionLabel
            kicker="about me"
            title="Curious mind, careful builder."
            intro={s.aboutIntro}
          />
          {isAdmin && <AddButton label="Edit about section" onClick={() => openEditor("siteSettings", { initialTab: "about" })} />}
        </div>
        {/* Quick facts strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {facts.map((f) => (
            <div key={f.k} className="glass rounded-2xl p-4 flex items-center gap-3">
              <span className="text-xl shrink-0">{f.i}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{f.k}</p>
                <p className="mt-0.5 font-semibold text-sm truncate">{f.v}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Career objective — full width now that Education is its own section */}
        <div className="glass-strong rounded-3xl p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <span className="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center font-mono text-sm">01</span>
            <h3 className="text-2xl font-bold">Career objective</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">{s.aboutObjective}</p>
          <div className="mt-7 pt-6 border-t border-border/60">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Current focus</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {s.aboutFocus.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_8px_var(--accent-glow)]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function useSkillGroups() {
  return useQuery({
    queryKey: ["skill_groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skill_groups").select("*").order("position", { ascending: true });
      if (error) throw error;
      return dedupeByKey(data as SkillGroupRow[], (g) => g.name.trim().toLowerCase());
    },
    staleTime: 30_000,
  });
}

function SkillsPanel() {
  const { data: groups, isLoading, isError } = useSkillGroups();
  const { isAdmin, openEditor } = useAdmin();
  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-8">
          <AddButton label="Add skill group" onClick={() => openEditor("skillGroup")} />
        </div>
      )}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl glass-strong h-40 animate-pulse" />
          ))}
        </div>
      )}
      {isError && <p className="text-sm text-muted-foreground">Couldn't load skills right now.</p>}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(groups ?? []).map((g) => (
            <div
              key={g.id}
              className="group glass-strong rounded-3xl p-6 hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden"
            >
              {isAdmin && <EditButton onClick={() => openEditor("skillGroup", g)} />}
              <div className={`absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br ${g.accent} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500`} />
              <div className="flex items-center gap-3 mb-5">
                <span className={`size-10 rounded-xl bg-gradient-to-br ${g.accent} text-white grid place-items-center font-bold text-xs shadow-lg`}>
                  {g.name.charAt(0)}
                </span>
                <h3 className="text-lg font-bold">{g.name}</h3>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">{g.items.length}</span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {g.items.map((item) => (
                  <li
                    key={item.name}
                    className="glass rounded-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition cursor-default"
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Certificate Lightbox ---------- */
type Cert = { image_url: string; title: string; issuer: string; date: string; rotate?: number };

function CertBadge({ cert, onOpen }: { cert: Cert; onOpen: (c: Cert) => void }) {
  return (
    <button
      onClick={() => onOpen(cert)}
      className="group/cert glass rounded-xl p-2 flex flex-col text-left w-28 sm:w-32 shrink-0 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
      title={`View: ${cert.title}`}
    >
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-black/40 ring-1 ring-white/10 mb-2">
        <img
          src={cert.image_url}
          alt={cert.title}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover/cert:scale-[1.05]"
          style={{
            imageRendering: "-webkit-optimize-contrast" as any,
            transform: cert.rotate ? `rotate(${cert.rotate}deg)` : undefined,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute bottom-1 right-1 text-[8px] font-mono text-white bg-primary/90 rounded-full px-1.5 py-0.5 opacity-0 group-hover/cert:opacity-100 transition">🔍</span>
      </div>
      <div className="min-w-0 px-0.5">
        <p className="text-[8px] font-mono text-primary uppercase tracking-widest">{cert.date}</p>
        <p className="text-[11px] font-semibold leading-tight mt-0.5 line-clamp-2">{cert.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{cert.issuer}</p>
      </div>
    </button>
  );
}

function CertModal({ cert, onClose }: { cert: Cert | null; onClose: () => void }) {
  useEffect(() => {
    if (!cert) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cert, onClose]);
  if (!cert) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md grid place-items-center p-4 animate-fade-up"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full glass-strong rounded-3xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <p className="text-[11px] font-mono text-primary uppercase tracking-widest">{cert.date}</p>
            <h3 className="text-xl font-bold leading-tight mt-1">{cert.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{cert.issuer}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-10 rounded-full glass grid place-items-center hover:bg-white/10 transition shrink-0"
          >
            ✕
          </button>
        </div>
        <div className="p-6 bg-black/50 max-h-[80vh] overflow-auto grid place-items-center">
          <img
            src={cert.image_url}
            alt={cert.title}
            className="w-full max-w-4xl rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
            style={{
              imageRendering: "-webkit-optimize-contrast" as any,
              filter: "contrast(1.05) saturate(1.05)",
              transform: cert.rotate ? `rotate(${cert.rotate}deg)` : undefined,
            }}
          />
        </div>
        <div className="p-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-mono">Press ESC or click outside to close</span>
          <a href={cert.image_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono">Open full size ↗</a>
        </div>
      </div>
    </div>
  );
}

function useExperience() {
  return useQuery({
    queryKey: ["experience"],
    queryFn: async () => {
      const { data, error } = await supabase.from("experience").select("*").order("position", { ascending: true });
      if (error) throw error;
      return dedupeByKey(data as ExperienceRow[], (e) => `${e.role}|${e.company}|${e.period}`.trim().toLowerCase());
    },
    staleTime: 30_000,
  });
}

function Experience({ onOpen }: { onOpen: (c: Cert) => void }) {
  const { data: experience, isLoading, isError } = useExperience();
  const { isAdmin, openEditor } = useAdmin();
  return (
    <section id="experience" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <SectionLabel
            kicker="experience"
            title="Where I've worked."
            intro="Early-career roles in web engineering and network infrastructure — shipping real work on real systems."
          />
          {isAdmin && <AddButton label="Add experience" onClick={() => openEditor("experience")} />}
        </div>
        {isLoading && <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="rounded-3xl glass-strong h-48 animate-pulse" />)}</div>}
        {isError && <p className="text-sm text-muted-foreground">Couldn't load experience right now.</p>}
        {!isLoading && !isError && (
          <ol className="relative space-y-8 md:pl-10 before:absolute before:left-[9px] md:before:left-[13px] before:top-6 before:bottom-6 before:w-px before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent">
            {(experience ?? []).map((e, idx) => (
              <li key={e.id} className="relative">
                <span className="hidden md:block absolute left-[5px] top-10 size-4 rounded-full bg-primary ring-4 ring-background shadow-[0_0_14px_var(--accent-glow)] z-10" />
                <div className="relative glass-strong rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6" style={{ animationDelay: `${idx * 80}ms` }}>
                  {isAdmin && <EditButton onClick={() => openEditor("experience", e)} />}
                  <div className="md:col-span-7">
                    <p className="text-[11px] font-mono text-primary uppercase tracking-widest">{e.period}</p>
                    <h3 className="mt-1 text-xl md:text-2xl font-bold">{e.role}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{e.company} · {e.type}</p>
                    <p className="text-[11px] font-mono text-muted-foreground mt-1">📍 {e.location}</p>
                    <ul className="mt-4 space-y-2">
                      {e.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="md:col-span-5">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Related certificate</p>
                    <div className="flex flex-wrap gap-2">
                      {e.certs.map((c) => (
                        <CertBadge key={c.title} cert={c} onOpen={onOpen} />
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function useEducation() {
  return useQuery({
    queryKey: ["education"],
    queryFn: async () => {
      const { data, error } = await supabase.from("education").select("*").order("position", { ascending: true });
      if (error) throw error;
      return dedupeByKey(data as EducationRow[], (e) => `${e.title}|${e.school}|${e.year_range}`.trim().toLowerCase());
    },
    staleTime: 30_000,
  });
}

function EducationPanel({ onOpen }: { onOpen: (c: Cert) => void }) {
  const { data: education, isLoading, isError } = useEducation();
  const { isAdmin, openEditor } = useAdmin();
  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-8">
          <AddButton label="Add education" onClick={() => openEditor("education")} />
        </div>
      )}
      {isLoading && <div className="grid gap-6">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-3xl glass-strong h-40 animate-pulse" />)}</div>}
      {isError && <p className="text-sm text-muted-foreground">Couldn't load education right now.</p>}
      {!isLoading && !isError && (
        <div className="grid gap-6">
          {(education ?? []).map((e, idx) => (
            <div key={e.id} className="relative glass-strong rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6" style={{ animationDelay: `${idx * 80}ms` }}>
              {isAdmin && <EditButton onClick={() => openEditor("education", e)} />}
              <div className="md:col-span-6">
                <p className="text-[11px] font-mono text-primary uppercase tracking-widest">{e.year_range}</p>
                <h3 className="mt-1 text-xl md:text-2xl font-bold leading-snug">{e.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{e.school}</p>
                <p className="inline-block mt-3 text-[11px] font-mono text-primary glass rounded-full px-2.5 py-1">{e.meta}</p>
                {e.detail && (
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{e.detail}</p>
                )}
              </div>
              <div className="md:col-span-6">
                <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
                  Certificates ({e.certs.length}) · click to view
                </p>
                <div className="flex flex-wrap gap-2">
                  {e.certs.map((c) => (
                    <CertBadge key={c.title} cert={c} onOpen={onOpen} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Background({ onOpen }: { onOpen: (c: Cert) => void }) {
  return (
    <section id="background" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionLabel
          kicker="background"
          title="Education & skills."
          intro="My academic path and the toolkit I bring to every project — click a tab to switch."
        />
        <Tabs defaultValue="education" className="mt-2">
          <TabsList className="h-auto rounded-full p-1.5 gap-1 bg-white/5">
            <TabsTrigger
              value="education"
              className="rounded-full px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30"
            >
              Education
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="rounded-full px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30"
            >
              Skills
            </TabsTrigger>
          </TabsList>
          <TabsContent value="education" className="mt-8">
            <EducationPanel onOpen={onOpen} />
          </TabsContent>
          <TabsContent value="skills" className="mt-8">
            <SkillsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return dedupeByKey(data as ProjectRow[], (p) => p.name.trim().toLowerCase());
    },
    staleTime: 30_000,
  });
}

function Projects() {
  const { data: projects, isLoading, isError } = useProjects();
  const { isAdmin, openEditor } = useAdmin();

  return (
    <section id="projects" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <SectionLabel
            kicker="selected work"
            title="Projects that ship and solve."
            intro="A mix of academic, personal and applied work — spanning web platforms, mobile apps, machine learning systems and embedded robotics."
          />
          {isAdmin && <AddButton label="Add project" onClick={() => openEditor("project")} />}
        </div>
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl glass-strong aspect-[4/3] animate-pulse" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-sm text-muted-foreground">
            Couldn't load projects right now — please refresh in a moment.
          </p>
        )}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(projects ?? []).map((p, idx) => (
              <article
                key={p.id}
                className={`group relative overflow-hidden rounded-3xl glass-strong flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_var(--accent-glow)] ${
                  p.featured ? "ring-1 ring-primary/40" : ""
                }`}
              >
                {isAdmin && <EditButton onClick={() => openEditor("project", p)} />}
                <div className="project-media relative aspect-[16/10] overflow-hidden">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    width={1280}
                    height={800}
                    className="absolute inset-0 size-full object-cover object-top transition-transform duration-[900ms] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-transparent transition-colors duration-500" />
                  <span className="absolute top-4 left-4 font-mono text-[11px] text-primary glass rounded-full px-2.5 py-1">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {p.featured && (
                    <span className="absolute top-4 right-4 text-[10px] font-mono bg-primary text-primary-foreground rounded-full px-2.5 py-1 shadow-lg shadow-primary/40">
                      ★ Featured
                    </span>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-bold leading-tight">{p.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="text-[10px] font-mono glass rounded-full px-2.5 py-1 text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-5 flex flex-wrap gap-2">
                    {p.live_url && (
                      <a href={p.live_url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold rounded-full bg-primary text-primary-foreground px-3.5 py-2 hover:opacity-90 transition inline-flex items-center gap-1">
                        Live <span aria-hidden>↗</span>
                      </a>
                    )}
                    <a href={p.github_url ?? "https://github.com/akib2002portfolio-art"} target="_blank" rel="noreferrer" className="text-[11px] font-semibold rounded-full glass px-3.5 py-2 hover:bg-white/10 transition inline-flex items-center gap-1">
                      {p.github_backend_url ? "Frontend" : "GitHub"} <span aria-hidden>↗</span>
                    </a>
                    {p.github_backend_url && (
                      <a href={p.github_backend_url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold rounded-full glass px-3.5 py-2 hover:bg-white/10 transition inline-flex items-center gap-1">
                        Backend <span aria-hidden>↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Services() {
  const { data: settings } = useSiteSettings();
  const s = settings ?? DEFAULT_SITE_SETTINGS;
  const { isAdmin, openEditor } = useAdmin();
  const items = s.services;
  return (
    <section id="services" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <SectionLabel
            kicker="services"
            title="What I can build for you."
            intro="Pick a card — or combine a few. I take projects from idea sketches all the way to deployment."
          />
          {isAdmin && <AddButton label="Edit services" onClick={() => openEditor("siteSettings", { initialTab: "services" })} />}
        </div>
        <div className="glass-strong rounded-3xl overflow-hidden">
          {items.map((it, idx) => (
            <a
              href="#contact"
              key={it.title + idx}
              className={`group grid grid-cols-1 md:grid-cols-12 gap-6 items-center px-6 md:px-10 py-7 hover:bg-white/[0.03] transition ${
                idx !== items.length - 1 ? "border-b border-white/5" : ""
              }`}
            >
              <span className="md:col-span-1 font-mono text-primary">{String(idx + 1).padStart(2, "0")}</span>
              <h3 className="md:col-span-4 text-xl md:text-2xl font-bold">{it.title}</h3>
              <p className="md:col-span-6 text-muted-foreground">{it.description}</p>
              <span className="md:col-span-1 text-right text-primary opacity-0 group-hover:opacity-100 transition">→</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Achievements() {
  const { data: settings } = useSiteSettings();
  const { isAdmin, openEditor } = useAdmin();
  const stats = settings?.achievementStats?.length ? settings.achievementStats : DEFAULT_SITE_SETTINGS.achievementStats;
  return (
    <section className="px-4 py-12">
      <div className="relative mx-auto max-w-6xl glass-strong rounded-3xl p-8 md:p-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        {isAdmin && <EditButton label="Edit stats" onClick={() => openEditor("siteSettings", { initialTab: "stats" })} />}
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-4xl md:text-5xl font-extrabold text-gradient">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function useRatings() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("ratings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "ratings" }, () => {
        queryClient.invalidateQueries({ queryKey: ["ratings"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["ratings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ratings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as RatingRow[];
    },
    staleTime: 10_000,
  });
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="text-2xl leading-none" aria-label={`${n} star${n > 1 ? "s" : ""}`}>
          <span className={n <= value ? "text-primary" : "text-muted-foreground/30"}>★</span>
        </button>
      ))}
    </div>
  );
}

function Reviews() {
  const { data: ratings, isLoading, isError } = useRatings();
  const { isAdmin } = useAdmin();
  const queryClient = useQueryClient();
  const [stars, setStars] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const average = ratings && ratings.length > 0 ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const full = {
      stars,
      comment: comment.trim() || null,
      name: name.trim() || null,
      email: email.trim() || null,
    };
    // The name/email columns are added by a later migration (see
    // supabase/schema_phase1_6.sql). If a site hasn't run that migration
    // yet, Postgres/PostgREST reports "could not find column X in schema
    // cache" — fall back to inserting without those columns instead of
    // just failing the whole review.
    let { error } = await supabase.from("ratings").insert(full);
    if (error && /column/i.test(error.message) && /schema cache/i.test(error.message)) {
      const { stars: s2, comment: c2 } = full;
      ({ error } = await supabase.from("ratings").insert({ stars: s2, comment: c2 }));
      if (!error) {
        toast.message("Review saved, but names & emails aren't enabled yet.", {
          description: "Run supabase/schema_phase1_6.sql in your Supabase project to store reviewer name/email.",
        });
      }
    }
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Thanks for your feedback!");
      setComment("");
      setName("");
      setEmail("");
      setStars(5);
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
    }
  }

  async function removeRating(id: string) {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("ratings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Review removed");
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
    }
  }

  return (
    <section id="reviews" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionLabel
          kicker="feedback"
          title="What visitors say."
          intro="Rate this portfolio and leave a comment — it updates live for every visitor, instantly."
        />
        <div className="grid md:grid-cols-[320px_1fr] gap-8">
          <div className="glass-strong rounded-3xl p-6 h-fit">
            <p className="text-5xl font-extrabold text-gradient">{average.toFixed(1)}</p>
            <div className="flex gap-0.5 mt-2 text-lg">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= Math.round(average) ? "text-primary" : "text-muted-foreground/30"}>★</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {ratings?.length ?? 0} review{(ratings?.length ?? 0) === 1 ? "" : "s"}
            </p>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <StarPicker value={stars} onChange={setStars} />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl glass px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl glass px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <Textarea placeholder="Leave a comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit review"}
              </Button>
            </form>
          </div>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl glass animate-pulse" />)}
            {isError && <p className="text-sm text-muted-foreground">Couldn't load reviews right now.</p>}
            {!isLoading && !isError && (ratings ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No reviews yet — be the first!</p>
            )}
            {(ratings ?? []).map((r) => (
              <div key={r.id} className="glass rounded-2xl p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-0.5 text-sm">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={n <= r.stars ? "text-primary" : "text-muted-foreground/30"}>★</span>
                      ))}
                    </div>
                    {r.name && <span className="text-xs font-semibold text-foreground">— {r.name}</span>}
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground mt-1.5">{r.comment}</p>}
                  <p className="text-[11px] font-mono text-muted-foreground mt-1.5">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    {isAdmin && r.email && <span className="ml-2 text-primary">· {r.email}</span>}
                  </p>
                </div>
                {isAdmin && (
                  <button onClick={() => removeRating(r.id)} className="text-xs text-destructive hover:underline shrink-0">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const { data: settings } = useSiteSettings();
  const s = settings ?? DEFAULT_SITE_SETTINGS;
  const { isAdmin, openEditor } = useAdmin();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    setSending(true);
    setError(null);
    try {
      const emailjs = (await import("@emailjs/browser")).default;
      await emailjs.sendForm(
        "service_trgwmka",
        "template_rcnt0ia",
        formRef.current,
        { publicKey: "RGKAEdA-o60u2R_Gw" }
      );
      setSent(true);
      formRef.current.reset();
    } catch (err) {
      console.error(err);
      setError("Couldn't send. Please try again or email me directly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="px-4 py-24">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 glass-strong rounded-3xl p-8 relative">
          {isAdmin && <EditButton label="Edit contact section" onClick={() => openEditor("siteSettings", { initialTab: "contact" })} />}
          <p className="text-primary text-sm font-mono">{s.contactKicker}</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight">
            {s.contactTitle}
          </h2>
          <p className="mt-4 text-muted-foreground">{s.contactSubtitle}</p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-muted-foreground font-mono">email</span>
              <a href={`mailto:${s.contactEmail}`} className="hover:text-primary">{s.contactEmail}</a>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-muted-foreground font-mono">phone</span>
              <a href={`tel:${s.contactPhone.replace(/[^+\d]/g, "")}`} className="hover:text-primary">{s.contactPhone}</a>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-muted-foreground font-mono">location</span>
              <span>{s.contactLocation}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground font-mono">social</span>
              <span className="flex gap-3">
                {s.socialLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer" className="hover:text-primary">{link.label}</a>
                ))}
              </span>
            </li>
          </ul>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="md:col-span-7 glass-strong rounded-3xl p-8 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Your name" name="name" placeholder="Jane Doe" />
            <Field label="Email" name="email" type="email" placeholder="jane@company.com" />
          </div>
          <Field label="Subject" name="subject" placeholder="Project, role or hello" />
          <div>
            <label className="text-xs font-mono text-muted-foreground">Message</label>
            <textarea
              required
              name="message"
              rows={5}
              placeholder="Tell me about what you're building…"
              className="mt-2 w-full glass rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/60 text-sm resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold glow-primary hover:translate-y-[-1px] transition"
          >
            {sending ? "Sending…" : sent ? "✓ Message sent" : "Send message →"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-mono text-muted-foreground">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="mt-2 w-full glass rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-primary/60 text-sm"
      />
    </div>
  );
}

function Footer() {
  return (
    <footer className="px-4 pb-10 pt-6">
      <div className="mx-auto max-w-6xl glass rounded-3xl px-6 py-6 flex flex-wrap items-center justify-center sm:justify-between gap-4 text-sm text-muted-foreground text-center sm:text-left">
        <p>© {new Date().getFullYear()} Akib Al Imran. Crafted with care in Dhaka.</p>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="hover:text-foreground transition">{n.label}</a>
          ))}
        </nav>
        <a href={resumeUrl} download="Akib-Al-Imran_Resume.pdf" target="_blank" rel="noreferrer" className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition">
          Download Resume ↓
        </a>
      </div>
    </footer>
  );
}

function IndexContent() {
  const [openCert, setOpenCert] = useState<Cert | null>(null);
  const { loginOpen, setLoginOpen, editState, closeEditor } = useAdmin();
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (settings?.themeHue != null) applyThemeHue(settings.themeHue);
  }, [settings?.themeHue]);

  return (
    <div className="min-h-screen text-foreground">
      <Nav />
      <main className="scroll-smooth">
        <Hero />
        <Updates />
        <About />
        <Background onOpen={setOpenCert} />
        <Projects />
        <Experience onOpen={setOpenCert} />
        <Achievements />
        <Services />
        <Reviews />
        <Contact />
        <Quote />
      </main>
      <Footer />
      <CertModal cert={openCert} onClose={() => setOpenCert(null)} />
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {editState?.kind === "project" && (
        <EditModalShell title={editState.item ? "Edit project" : "Add project"} onClose={closeEditor}>
          <ProjectForm item={editState.item} onDone={closeEditor} />
        </EditModalShell>
      )}
      {editState?.kind === "skillGroup" && (
        <EditModalShell title={editState.item ? "Edit skill group" : "Add skill group"} onClose={closeEditor}>
          <SkillGroupForm item={editState.item} onDone={closeEditor} />
        </EditModalShell>
      )}
      {editState?.kind === "experience" && (
        <EditModalShell title={editState.item ? "Edit experience" : "Add experience"} onClose={closeEditor}>
          <ExperienceForm item={editState.item} onDone={closeEditor} />
        </EditModalShell>
      )}
      {editState?.kind === "education" && (
        <EditModalShell title={editState.item ? "Edit education" : "Add education"} onClose={closeEditor}>
          <EducationForm item={editState.item} onDone={closeEditor} />
        </EditModalShell>
      )}
      {editState?.kind === "statusUpdate" && (
        <EditModalShell title={editState.item ? "Edit update" : "Post an update"} onClose={closeEditor}>
          <StatusUpdateForm item={editState.item} onDone={closeEditor} />
        </EditModalShell>
      )}
      {editState?.kind === "siteSettings" && (
        <EditModalShell title="Edit site content" onClose={closeEditor}>
          <SiteSettingsForm initialTab={editState.item?.initialTab ?? "identity"} />
        </EditModalShell>
      )}
    </div>
  );
}

function Index() {
  return (
    <AdminProvider>
      <IndexContent />
    </AdminProvider>
  );
}
