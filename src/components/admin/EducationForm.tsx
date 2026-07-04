import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EducationRow, type CertEntry } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CertListEditor } from "./shared";

type FormState = {
  id: string | null;
  year_range: string;
  title: string;
  school: string;
  meta: string;
  detail: string;
  certs: CertEntry[];
  position: number;
};

function toForm(e: EducationRow | null): FormState {
  if (!e) return { id: null, year_range: "", title: "", school: "", meta: "", detail: "", certs: [], position: 0 };
  return {
    id: e.id,
    year_range: e.year_range,
    title: e.title,
    school: e.school,
    meta: e.meta,
    detail: e.detail ?? "",
    certs: e.certs,
    position: e.position,
  };
}

export function EducationForm({ item, onDone }: { item: EducationRow | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(toForm(item));

  const saveMutation = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        year_range: f.year_range,
        title: f.title,
        school: f.school,
        meta: f.meta,
        detail: f.detail || null,
        certs: f.certs,
        position: f.position,
      };
      if (f.id) {
        const { error } = await supabase.from("education").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("education").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Education updated" : "Education added");
      queryClient.invalidateQueries({ queryKey: ["education"] });
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("education").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Education removed");
      queryClient.invalidateQueries({ queryKey: ["education"] });
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
          <Label>Year range</Label>
          <Input placeholder="2021 — 2025" value={form.year_range} onChange={(e) => setForm({ ...form, year_range: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Position (order)</Label>
          <Input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>School / Institution</Label>
          <Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Meta (GPA/CGPA)</Label>
          <Input placeholder="CGPA 3.76 / 4.00" value={form.meta} onChange={(e) => setForm({ ...form, meta: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Detail (optional)</Label>
        <Textarea rows={3} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
      </div>
      <CertListEditor certs={form.certs} onChange={(certs) => setForm({ ...form, certs })} />
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {form.id ? "Save changes" : "Add education"}
        </Button>
        {form.id && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (confirm(`Delete "${form.title}"?`)) deleteMutation.mutate(form.id!);
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
