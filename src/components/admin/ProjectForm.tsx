import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type ProjectRow } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ImageUploadField } from "./shared";

type FormState = {
  id: string | null;
  name: string;
  description: string;
  tags: string;
  image_url: string;
  github_url: string;
  github_backend_url: string;
  live_url: string;
  featured: boolean;
  position: number;
};

function toForm(p: ProjectRow | null): FormState {
  if (!p) {
    return { id: null, name: "", description: "", tags: "", image_url: "", github_url: "", github_backend_url: "", live_url: "", featured: false, position: 0 };
  }
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    tags: p.tags.join(", "),
    image_url: p.image_url,
    github_url: p.github_url ?? "",
    github_backend_url: p.github_backend_url ?? "",
    live_url: p.live_url ?? "",
    featured: p.featured,
    position: p.position,
  };
}

export function ProjectForm({ item, onDone }: { item: ProjectRow | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(toForm(item));

  const saveMutation = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        name: f.name,
        description: f.description,
        tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
        image_url: f.image_url,
        github_url: f.github_url || null,
        github_backend_url: f.github_backend_url || null,
        live_url: f.live_url || null,
        featured: f.featured,
        position: f.position,
      };
      if (f.id) {
        const { error } = await supabase.from("projects").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Project updated" : "Project added");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project removed");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate(form);
      }}
      className="space-y-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Position (display order)</Label>
          <Input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Tags (comma separated)</Label>
        <Input placeholder="React, Node.js, PostgreSQL" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
      </div>
      <ImageUploadField label="Image" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>GitHub URL</Label>
          <Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Backend GitHub URL</Label>
          <Input value={form.github_backend_url} onChange={(e) => setForm({ ...form, github_backend_url: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Live URL</Label>
          <Input value={form.live_url} onChange={(e) => setForm({ ...form, live_url: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="featured" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: !!v })} />
        <Label htmlFor="featured">Featured</Label>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {form.id ? "Save changes" : "Add project"}
        </Button>
        {form.id && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (confirm(`Delete "${form.name}"?`)) deleteMutation.mutate(form.id!);
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
