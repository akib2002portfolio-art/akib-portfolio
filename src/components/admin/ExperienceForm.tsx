import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type ExperienceRow, type CertEntry } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CertListEditor } from "./shared";

type FormState = {
  id: string | null;
  role: string;
  company: string;
  type: string;
  period: string;
  location: string;
  points: string; // newline separated in the textarea
  certs: CertEntry[];
  position: number;
};

function toForm(e: ExperienceRow | null): FormState {
  if (!e) return { id: null, role: "", company: "", type: "", period: "", location: "", points: "", certs: [], position: 0 };
  return {
    id: e.id,
    role: e.role,
    company: e.company,
    type: e.type,
    period: e.period,
    location: e.location,
    points: e.points.join("\n"),
    certs: e.certs,
    position: e.position,
  };
}

export function ExperienceForm({ item, onDone }: { item: ExperienceRow | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(toForm(item));

  const saveMutation = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        role: f.role,
        company: f.company,
        type: f.type,
        period: f.period,
        location: f.location,
        points: f.points.split("\n").map((p) => p.trim()).filter(Boolean),
        certs: f.certs,
        position: f.position,
      };
      if (f.id) {
        const { error } = await supabase.from("experience").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("experience").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Experience updated" : "Experience added");
      queryClient.invalidateQueries({ queryKey: ["experience"] });
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experience").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Experience removed");
      queryClient.invalidateQueries({ queryKey: ["experience"] });
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
          <Label>Role</Label>
          <Input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Company</Label>
          <Input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Input placeholder="Internship · On-site" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Period</Label>
          <Input placeholder="Apr 2026 — Present" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Position (order)</Label>
          <Input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Highlights (one per line)</Label>
        <Textarea rows={4} value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} />
      </div>
      <CertListEditor certs={form.certs} onChange={(certs) => setForm({ ...form, certs })} />
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {form.id ? "Save changes" : "Add experience"}
        </Button>
        {form.id && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (confirm(`Delete "${form.role}"?`)) deleteMutation.mutate(form.id!);
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
