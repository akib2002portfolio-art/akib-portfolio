import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type StatusRow } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ImageUploadField, FileUploadField } from "@/components/admin/shared";

type FormState = {
  id: string | null;
  message: string;
  link: string;
  image_url: string;
  document_url: string;
  document_name: string;
};

function toForm(s: StatusRow | null): FormState {
  if (!s) return { id: null, message: "", link: "", image_url: "", document_url: "", document_name: "" };
  return {
    id: s.id,
    message: s.message,
    link: s.link ?? "",
    image_url: s.image_url ?? "",
    document_url: s.document_url ?? "",
    document_name: s.document_name ?? "",
  };
}

export function StatusUpdateForm({ item, onDone }: { item: StatusRow | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(toForm(item));

  const saveMutation = useMutation({
    mutationFn: async (f: FormState) => {
      const full = {
        message: f.message,
        link: f.link || null,
        image_url: f.image_url || null,
        document_url: f.document_url || null,
        document_name: f.document_name || null,
      };
      async function run(payload: Record<string, unknown>) {
        if (f.id) return supabase.from("status_updates").update(payload).eq("id", f.id);
        return supabase.from("status_updates").insert(payload);
      }
      const isMissingColumn = (msg: string) => /column/i.test(msg) && /schema cache/i.test(msg);
      let { error } = await run(full);
      // document_url / document_name ship in supabase/schema_phase1_8.sql
      // and image_url ships in schema_phase1_7.sql. If those migrations
      // haven't been run yet, fall back gracefully instead of losing the
      // whole update.
      if (error && isMissingColumn(error.message)) {
        const { document_url, document_name, ...withoutDoc } = full;
        ({ error } = await run(withoutDoc));
        if (!error) {
          toast.message("Saved without the attached document.", {
            description: "Run supabase/schema_phase1_8.sql in your Supabase project to enable document attachments on updates.",
          });
        } else if (isMissingColumn(error.message)) {
          const { image_url, ...withoutImage } = withoutDoc;
          ({ error } = await run(withoutImage));
          if (!error) {
            toast.message("Saved without the image.", {
              description: "Run supabase/schema_phase1_7.sql in your Supabase project to enable media on updates.",
            });
          }
        }
      }
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(form.id ? "Update saved" : "Update posted");
      queryClient.invalidateQueries({ queryKey: ["status_updates"] });
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("status_updates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Update removed");
      queryClient.invalidateQueries({ queryKey: ["status_updates"] });
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
      <div className="space-y-2">
        <Label>What's new?</Label>
        <Textarea
          required
          rows={4}
          placeholder="e.g. Just wrapped up a new feature at Agni Systems — really enjoyed diving into BGP routing this week."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Link (optional — e.g. your LinkedIn post)</Label>
        <Input placeholder="https://linkedin.com/posts/..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
      </div>
      <ImageUploadField label="Photo or screenshot (optional)" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
      <FileUploadField
        label="Attach a document (PDF, Word, etc. — optional)"
        value={form.document_url}
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(url, originalName) => {
          setForm({ ...form, document_url: url, document_name: url ? originalName ?? form.document_name ?? "Document" : "" });
        }}
      />
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {form.id ? "Save changes" : "Post update"}
        </Button>
        {form.id && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (confirm("Delete this update?")) deleteMutation.mutate(form.id!);
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
