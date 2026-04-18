-- =============================================================
-- SocialMind - Supabase Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com
-- =============================================================

-- DRAFTS: approval queue + scheduled + posted content
create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  topic text,
  format text,                  -- veo3 | nano_banana | reel | short | tiktok_hook | carousel
  platform text,                -- facebook | instagram | tiktok | youtube
  status text default 'draft',  -- draft | scheduled | posted | rejected
  content jsonb,                -- the full agent output
  scheduled_for timestamptz,
  posted_at timestamptz,
  platform_post_id text,
  media_url text,
  created_at timestamptz default now()
);

-- CONNECTIONS: OAuth tokens for each platform (encrypted)
create table if not exists connections (
  platform text primary key,    -- one row per platform
  handle text,
  encrypted_token text not null,
  encrypted_refresh text,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- BRAND_DNA: training/voice settings
create table if not exists brand_dna (
  id uuid primary key default gen_random_uuid(),
  niche text,
  audience text,
  tones text[],
  always_include text[],
  never_use text[],
  voice_examples text[],
  updated_at timestamptz default now()
);

-- FEEDBACK: training signals from approve/reject decisions
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  agent text,                   -- which agent
  draft_id uuid references drafts(id),
  decision text,                -- approved | rejected | edited
  reason text,                  -- the user's one-liner
  created_at timestamptz default now()
);

-- AUTOMATIONS: workflow definitions
create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  name text,
  template_id text,
  config jsonb,                 -- trigger + conditions + actions
  enabled boolean default true,
  last_run timestamptz,
  run_count int default 0,
  success_count int default 0,
  created_at timestamptz default now()
);
