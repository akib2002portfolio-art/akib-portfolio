import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SkillGroupRow, type SkillItem } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SkillItemsEditor } from "./shared";

type FormState = {
  id: string | null;
  name: string;
  accent: string;
  items: SkillItem[];
  position: number;
};

function toForm(g: SkillGroupRow | null): FormState {
  if (!g) return { id: null, name: "", accent: "from-sky-400 to-blue-500", items: [], position: 0 };
  return { id: g.id, name: g.name, accent: g.accent, items: g.items, position: g.position };
}

const ACCENT_OPTIONS = [
  "from-sky-400 to-blue-500",
  "from-cyan-400 to-teal-500",
  "from-emerald-400 to-green-500",
  "from-fuchsia-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-violet-400 to-indigo-500",
];

export function SkillGroupForm({ item, onDone }: { item: SkillGroupRow | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(toForm(item));

  const saveMutation = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = { name: f.name, accent: f.accent, items: f.items, position: f.position };
      if (f.id) {
        const { error } = await supabase.from("skill_groups").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("skill_groups").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Skill group updated" : "Skill group added");
      queryClient.invalidateQueries({ queryKey: ["skill_groups"] });
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skill_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Skill group removed");
      queryClient.invalidateQueries({ queryKey: ["skill_groups"] });
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
          <Label>Group name</Label>
          <Input required placeholder="e.g. Frontend" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Position (display order)</Label>
          <Input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Accent color</Label>
        <div className="flex flex-wrap gap-2">
          {ACCENT_OPTIONS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setForm({ ...form, accent: a })}
              className={`h-8 w-16 rounded-full bg-gradient-to-br ${a} ${form.accent === a ? "ring-2 ring-white" : "opacity-70"}`}
            />
          ))}
        </div>
      </div>
      <SkillItemsEditor items={form.items} onChange={(items) => setForm({ ...form, items })} />
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {form.id ? "Save changes" : "Add skill group"}
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
