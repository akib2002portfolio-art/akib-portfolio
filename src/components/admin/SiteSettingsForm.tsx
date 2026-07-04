import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ImageUploadField, FileUploadField } from "@/components/admin/shared";
import {
  useSiteSettings,
  useUpdateSiteSettings,
  applyThemeHue,
  THEME_PRESETS,
  type SiteSettings,
  type ServiceItem,
  type SocialLink,
  type StatItem,
} from "@/lib/site-settings";

/* ---------- small reusable list editors ---------- */
function StringListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={v}
            placeholder={placeholder}
            onChange={(e) => onChange(items.map((it, idx) => (idx === i ? e.target.value : it)))}
          />
          <Button type="button" size="sm" variant="destructive" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
            ✕
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        + Add
      </Button>
    </div>
  );
}

function ServicesEditor({ items, onChange }: { items: ServiceItem[]; onChange: (v: ServiceItem[]) => void }) {
  function update(i: number, patch: Partial<ServiceItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  return (
    <div className="space-y-3">
      <Label>Services</Label>
      {items.map((it, i) => (
        <div key={i} className="glass rounded-2xl p-4 space-y-2">
          <Input placeholder="Service title" value={it.title} onChange={(e) => update(i, { title: e.target.value })} />
          <Textarea placeholder="Short description" rows={2} value={it.description} onChange={(e) => update(i, { description: e.target.value })} />
          <Button type="button" size="sm" variant="destructive" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
            Remove service
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { title: "", description: "" }])}>
        + Add service
      </Button>
    </div>
  );
}

function SocialLinksEditor({ items, onChange }: { items: SocialLink[]; onChange: (v: SocialLink[]) => void }) {
  function update(i: number, patch: Partial<SocialLink>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  return (
    <div className="space-y-3">
      <Label>Social links</Label>
      <p className="text-xs text-muted-foreground -mt-1">Add as many as you like — GitHub, LinkedIn, YouTube, X, personal site, etc.</p>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="GH" value={it.label} onChange={(e) => update(i, { label: e.target.value })} className="w-16 text-center" title="Short icon label shown on the badge" />
          <Input placeholder="https://…" value={it.url} onChange={(e) => update(i, { url: e.target.value })} className="flex-1" />
          <Button type="button" size="sm" variant="destructive" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
            ✕
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { label: "", url: "" }])}>
        + Add link
      </Button>
    </div>
  );
}

function StatsEditor({ label, hint, items, onChange }: { label: string; hint?: string; items: StatItem[]; onChange: (v: StatItem[]) => void }) {
  function update(i: number, patch: Partial<StatItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="Value, e.g. 3.76" value={it.value} onChange={(e) => update(i, { value: e.target.value })} className="w-28" />
          <Input placeholder="Label, e.g. B.Sc. CGPA / 4.00" value={it.label} onChange={(e) => update(i, { label: e.target.value })} className="flex-1" />
          <Button type="button" size="sm" variant="destructive" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
            ✕
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { value: "", label: "" }])}>
        + Add stat
      </Button>
    </div>
  );
}

/* ---------- main settings form ---------- */
export function SiteSettingsForm({ initialTab = "identity" }: { initialTab?: string }) {
  const { data: settings, isLoading } = useSiteSettings();
  const mutation = useUpdateSiteSettings();
  const [form, setForm] = useState<SiteSettings | null>(null);

  const s = form ?? settings ?? null;

  if (isLoading || !s) {
    return <p className="text-sm text-muted-foreground">Loading site settings…</p>;
  }

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm({ ...(s as SiteSettings), [key]: value });
  }

  async function save() {
    if (!form) {
      toast.info("Nothing changed yet.");
      return;
    }
    try {
      await mutation.mutateAsync(form);
      toast.success("Site content updated for every visitor.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save changes.");
    }
  }

  return (
    <div className="space-y-5">
      <Tabs defaultValue={initialTab}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-5 h-auto gap-1.5 bg-transparent p-0">
          {[
            ["identity", "Identity"],
            ["hero", "Hero"],
            ["quote", "Quote"],
            ["about", "About"],
            ["services", "Services"],
            ["social", "Social"],
            ["contact", "Contact"],
            ["stats", "Stats"],
            ["theme", "Theme"],
          ].map(([v, l]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="rounded-full px-2 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-white/5 truncate"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="identity" className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Site / nav name</Label>
            <p className="text-xs text-muted-foreground">Shown in the navbar logo, e.g. "Akib."</p>
            <Input value={s.navName} onChange={(e) => set("navName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Welcome message title (shown after admin sign-in)</Label>
            <Input value={s.welcomeTitle} onChange={(e) => set("welcomeTitle", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Welcome message subtitle</Label>
            <Input value={s.welcomeSubtitle} onChange={(e) => set("welcomeSubtitle", e.target.value)} />
          </div>
        </TabsContent>

        <TabsContent value="hero" className="mt-6 space-y-4">
          <ImageUploadField label="Profile photo (hero portrait)" value={s.heroPhotoUrl} onChange={(url) => set("heroPhotoUrl", url)} />
          <div className="space-y-2">
            <Label>Kicker line</Label>
            <Input value={s.heroKicker} onChange={(e) => set("heroKicker", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Greeting badge (top-right of portrait)</Label>
            <Input value={s.heroGreeting} onChange={(e) => set("heroGreeting", e.target.value)} />
          </div>
          <StringListEditor label="Headline (3 stacked lines)" items={s.heroHeadline} onChange={(v) => set("heroHeadline", v)} />
          <div className="space-y-2">
            <Label>Subtitle paragraph</Label>
            <Textarea rows={3} value={s.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} />
          </div>
          <StringListEditor label="Typewriter roles" items={s.heroRoles} onChange={(v) => set("heroRoles", v)} />
          <StringListEditor label="Big title on portrait (2 lines)" items={s.heroBigTitle} onChange={(v) => set("heroBigTitle", v)} />
          <StringListEditor label="Portrait tag chips" items={s.heroTags} onChange={(v) => set("heroTags", v)} />
        </TabsContent>

        <TabsContent value="quote" className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Quotation</Label>
            <Textarea rows={3} value={s.quoteText} onChange={(e) => set("quoteText", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Attributed to</Label>
            <Input value={s.quoteAuthor} onChange={(e) => set("quoteAuthor", e.target.value)} />
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Intro paragraph</Label>
            <Textarea rows={4} value={s.aboutIntro} onChange={(e) => set("aboutIntro", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Career objective</Label>
            <Textarea rows={4} value={s.aboutObjective} onChange={(e) => set("aboutObjective", e.target.value)} />
          </div>
          <StringListEditor label="Current focus bullets" items={s.aboutFocus} onChange={(v) => set("aboutFocus", v)} />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <ServicesEditor items={s.services} onChange={(v) => set("services", v)} />
        </TabsContent>

        <TabsContent value="social" className="mt-6 space-y-6">
          <SocialLinksEditor items={s.socialLinks} onChange={(v) => set("socialLinks", v)} />
          <FileUploadField label="Resume (PDF)" value={s.resumeUrl} onChange={(url) => set("resumeUrl", url)} />
        </TabsContent>

        <TabsContent value="contact" className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Kicker line</Label>
            <Input value={s.contactKicker} onChange={(e) => set("contactKicker", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input value={s.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subtitle paragraph</Label>
            <Textarea rows={3} value={s.contactSubtitle} onChange={(e) => set("contactSubtitle", e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={s.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={s.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={s.contactLocation} onChange={(e) => set("contactLocation", e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">The social links shown here come from the "Social & Resume" tab.</p>
        </TabsContent>

        <TabsContent value="stats" className="mt-6 space-y-8">
          <StatsEditor
            label="Hero stats row (3 shown under the headline)"
            hint="e.g. Projects, CGPA, Years coding — shown as the 3-up strip in the hero card."
            items={s.heroStats}
            onChange={(v) => set("heroStats", v)}
          />
          <StatsEditor
            label="Achievements strip (shown lower on the page)"
            hint="e.g. B.Sc. CGPA, HSC GPA, SSC GPA, Shipped projects."
            items={s.achievementStats}
            onChange={(v) => set("achievementStats", v)}
          />
        </TabsContent>

        <TabsContent value="theme" className="mt-6 space-y-6">
          <div
            className="rounded-3xl p-6 relative overflow-hidden border border-white/10"
            style={{ background: `linear-gradient(135deg, oklch(0.7 0.18 ${s.themeHue} / 0.35), oklch(0.78 0.16 ${s.themeHue - 25} / 0.2))` }}
          >
            <div
              className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-3xl transition-colors duration-500"
              style={{ background: `oklch(0.7 0.2 ${s.themeHue} / 0.6)` }}
            />
            <p className="relative text-xs font-mono uppercase tracking-widest text-white/70">Live preview</p>
            <p className="relative mt-1 text-lg font-bold">This is your site's accent color</p>
            <div className="relative mt-4 flex flex-wrap gap-2">
              <span
                className="rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
                style={{ background: `oklch(0.7 0.18 ${s.themeHue})`, color: "black" }}
              >
                Primary button
              </span>
              <span className="rounded-full px-4 py-2 text-sm font-semibold glass">Glass button</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Presets</Label>
            <div className="flex flex-wrap gap-3">
              {THEME_PRESETS.map((p) => {
                const active = s.themeHue === p.hue;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      set("themeHue", p.hue);
                      applyThemeHue(p.hue);
                    }}
                    title={p.name}
                    className={`group flex flex-col items-center gap-1.5 transition-transform ${active ? "scale-105" : "hover:scale-105"}`}
                  >
                    <span
                      className={`size-10 rounded-full transition-all duration-300 ${active ? "ring-2 ring-offset-2 ring-offset-background ring-white/80 shadow-[0_0_20px_var(--swatch-glow)]" : "group-hover:shadow-[0_0_14px_var(--swatch-glow)]"}`}
                      style={{ background: `oklch(0.7 0.18 ${p.hue})`, ["--swatch-glow" as string]: `oklch(0.7 0.2 ${p.hue})` }}
                    />
                    <span className={`text-[11px] font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom hue ({s.themeHue}°)</Label>
            <input
              type="range"
              min={0}
              max={360}
              value={s.themeHue}
              onChange={(e) => {
                const hue = Number(e.target.value);
                set("themeHue", hue);
                applyThemeHue(hue);
              }}
              className="w-full h-3 rounded-full appearance-none cursor-pointer accent-primary"
              style={{
                background:
                  "linear-gradient(to right, oklch(0.7 0.18 0), oklch(0.7 0.18 60), oklch(0.7 0.18 120), oklch(0.7 0.18 180), oklch(0.7 0.18 240), oklch(0.7 0.18 300), oklch(0.7 0.18 360))",
              }}
            />
            <p className="text-xs text-muted-foreground">Preview updates live. Click "Save all changes" below to publish this theme for every visitor.</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10 sticky bottom-0 bg-background/60 backdrop-blur-md -mx-6 -mb-6 px-6 py-4">
        <Button onClick={save} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save all changes"}
        </Button>
      </div>
    </div>
  );
}
