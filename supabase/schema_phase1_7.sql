-- Phase 1.7 — media on "Recent updates" posts.
-- Run this once in the Supabase SQL editor (Project → SQL Editor) so the
-- image upload field in "Post update" / "Edit update" persists correctly.
-- Safe to re-run: `add column if not exists` is a no-op if already applied.

alter table public.status_updates add column if not exists image_url text;
