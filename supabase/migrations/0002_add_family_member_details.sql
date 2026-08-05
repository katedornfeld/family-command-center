-- Family Command Center — Add role & birth_date to family_members
--
-- Additive, backward-compatible change: both new columns are nullable, so
-- existing rows and app code that doesn't know about them are unaffected.
-- Run this once in the Supabase SQL Editor, after 0001_create_core_schema.sql.
-- Safe to re-run (IF NOT EXISTS).

alter table family_members
  add column if not exists role text,
  add column if not exists birth_date date;
