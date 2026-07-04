import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CertEntry, SkillItem } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";

/**
 * "Click outside to close", done properly. A plain onClick on the backdrop
 * closes the modal whenever a click *event* reaches it — which also fires
 * if the mouse is pressed down inside the panel (dragging the theme
 * slider, selecting text, or just clicking tabs quickly while the panel's
 * height reflows) and drifts outside before release. Requiring both
 * mousedown AND mouseup to land on the backdrop itself fixes that.
 */
function useBackdropClose(onClose: () => void) {
  const pressedBackdrop = useRef(false);
  return {
    onMouseDown: (e: React.MouseEvent) => {
      pressedBackdrop.current = e.target === e.currentTarget;
    },
    onMouseUp: (e: React.MouseEvent) => {
      if (pressedBackdrop.current && e.target === e.currentTarget) onClose();
      pressedBackdrop.current = false;
    },
  };
}

/* ---------- Admin login modal (triggered from the navbar) ---------- */
export function LoginModal({ onClose }: { onClose: () => void }) {
  const { data: settings } = useSiteSettings();
  const s = settings ?? DEFAULT_SITE_SETTINGS;
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (!remember) {
      // "Keep me signed in" is off — end the session as soon as the tab closes,
      // rather than persisting it across browser restarts.
      window.addEventListener("beforeunload", () => {
        supabase.auth.signOut();
      });
    }
    toast.success(s.welcomeTitle, { description: s.welcomeSubtitle, duration: 5000 });
    onClose();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setLoading(false);
    if (error) setError(error.message);
    else setResetSent(true);
  }

  const backdrop = useBackdropClose(onClose);

  return (
    <div {...backdrop} className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md grid place-items-center p-4 animate-fade-up">
      <div className="w-full max-w-sm glass-strong rounded-3xl p-8 space-y-6 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -right-20 size-48 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="size-11 rounded-2xl bg-primary/15 text-primary grid place-items-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <div>
            <h3 className="text-xl font-bold">{mode === "signin" ? "Admin sign in" : "Reset your password"}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {mode === "signin" ? "Log in to edit this site directly." : "We'll email you a secure reset link."}
            </p>
          </div>
        </div>

        {mode === "signin" ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input id="admin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-primary size-3.5" />
                  Keep me signed in
                </label>
                <button type="button" onClick={() => { setMode("forgot"); setError(null); }} className="font-semibold text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            {resetSent ? (
              <p className="text-sm text-emerald-400">Check your inbox for a password reset link.</p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              {!resetSent && (
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              )}
              <Button type="button" variant="outline" className={resetSent ? "flex-1" : ""} onClick={() => { setMode("signin"); setError(null); setResetSent(false); }}>
                Back to sign in
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------- Modal shell: blurred backdrop + centered card ---------- */
export function EditModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const backdrop = useBackdropClose(onClose);

  return (
    <div
      {...backdrop}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md grid place-items-center p-4 overflow-y-auto animate-fade-up"
    >
      <div className="relative w-full max-w-2xl my-8 glass-strong rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-background/60 backdrop-blur-md z-10">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-9 rounded-full glass grid place-items-center hover:bg-white/10 transition shrink-0"
          >
            ✕
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Small inline "edit pencil" button for admin mode ---------- */
export function EditButton({ onClick, label = "Edit" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="absolute top-3 right-3 z-20 size-8 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 grid place-items-center hover:scale-110 transition-transform"
      title={label}
      aria-label={label}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    </button>
  );
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full glass px-4 py-2 hover:bg-primary/10 hover:text-primary transition"
    >
      <span className="text-primary">+</span> {label}
    </button>
  );
}

/* ---------- Image upload field (uploads to Supabase storage or accepts a pasted URL) ---------- */
export function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="max-w-xs"
        />
        {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
        {value && <img src={value} alt="preview" className="h-14 w-24 object-cover rounded-lg" />}
      </div>
      <Input placeholder="…or paste an image URL directly" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ---------- Generic file upload field (resume PDFs, etc.) ---------- */
export function FileUploadField({
  label,
  value,
  onChange,
  accept = "application/pdf",
}: {
  label: string;
  value: string;
  onChange: (url: string, originalName?: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      onChange(data.publicUrl, file.name);
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        <Input type="file" accept={accept} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="max-w-xs" />
        {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
      </div>
      <Input placeholder="…or paste a file URL directly" value={value} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <a href={value} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline inline-block">
          View current file ↗
        </a>
      )}
    </div>
  );
}

/* ---------- Certificate list editor (used by Experience + Education forms) ---------- */
export function CertListEditor({ certs, onChange }: { certs: CertEntry[]; onChange: (c: CertEntry[]) => void }) {
  function update(i: number, patch: Partial<CertEntry>) {
    onChange(certs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function remove(i: number) {
    onChange(certs.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...certs, { title: "", issuer: "", date: "", image_url: "" }]);
  }
  return (
    <div className="space-y-3">
      <Label>Certificates</Label>
      {certs.map((c, i) => (
        <div key={i} className="glass rounded-2xl p-4 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <Input placeholder="Title" value={c.title} onChange={(e) => update(i, { title: e.target.value })} />
            <Input placeholder="Issuer" value={c.issuer} onChange={(e) => update(i, { issuer: e.target.value })} />
            <Input placeholder="Date" value={c.date} onChange={(e) => update(i, { date: e.target.value })} />
          </div>
          <ImageUploadField label="Certificate image" value={c.image_url} onChange={(url) => update(i, { image_url: url })} />
          <Button type="button" size="sm" variant="destructive" onClick={() => remove(i)}>
            Remove certificate
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        + Add certificate
      </Button>
    </div>
  );
}

/* ---------- Skill item list editor (used by Skill Group form) ---------- */
export function SkillItemsEditor({ items, onChange }: { items: SkillItem[]; onChange: (i: SkillItem[]) => void }) {
  function update(i: number, patch: Partial<SkillItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, { name: "", icon: "🔧" }]);
  }
  return (
    <div className="space-y-2">
      <Label>Skill items</Label>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="🔧" value={it.icon} onChange={(e) => update(i, { icon: e.target.value })} className="w-16 text-center" />
          <Input placeholder="Skill name" value={it.name} onChange={(e) => update(i, { name: e.target.value })} />
          <Button type="button" size="sm" variant="destructive" onClick={() => remove(i)}>
            ✕
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        + Add skill
      </Button>
    </div>
  );
}
