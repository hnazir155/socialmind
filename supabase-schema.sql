-- EXISTING TABLES (preserved)
create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  topic text,
  format text,
  platform text,
  status text default 'draft',
  content jsonb,
  hook text,
  caption text,
  hashtags text,
  created_at timestamptz default now()
);

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  platform text unique,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  channel_id text,
  channel_name text,
  created_at timestamptz default now()
);

create table if not exists brand_dna (
  id uuid primary key default gen_random_uuid(),
  key text unique,
  value text,
  updated_at timestamptz default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid,
  rating int,
  note text,
  created_at timestamptz default now()
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  name text,
  enabled boolean default true,
  trigger jsonb,
  conditions jsonb,
  actions jsonb,
  last_run timestamptz,
  run_count int default 0,
  success_count int default 0,
  created_at timestamptz default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid,
  rule_name text,
  action text,
  result text,
  detail text,
  timestamp timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- NEW GROWTH TABLES
create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  -- Identity
  name text not null,
  website text,
  country text,
  city text,
  industry text,
  description text,
  -- Contact
  email text,
  phone text,
  linkedin_url text,
  instagram_url text,
  whatsapp text,
  contact_name text,
  contact_role text,
  -- Source
  scout_source text,   -- google_places | shopify_store | manual | web_search
  source_query text,   -- the search query that found this
  place_id text,       -- Google Places ID if applicable
  -- Qualification
  qualification_score int default 0,   -- 1-10
  icp_fit text default 'unscored',    -- hot | warm | cold | skip | unscored
  score_reason text,                   -- why this score
  pain_signals jsonb,                  -- array of detected pain points
  enrichment jsonb,                    -- full enrichment data
  -- Pipeline
  stage text default 'discovered',     -- discovered | qualified | contacted | responded | meeting | won | lost
  lost_reason text,
  -- Timestamps
  discovered_at timestamptz default now(),
  enriched_at timestamptz,
  qualified_at timestamptz,
  last_touched_at timestamptz,
  -- Notes
  notes text,
  tags text[]
);

create table if not exists outreach_messages (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade,
  channel text,        -- email | linkedin | whatsapp | instagram_dm
  subject text,        -- for email
  body text not null,
  status text default 'pending_approval',  -- pending_approval | approved | sent | replied | bounced | opted_out
  variant text,        -- A | B | C
  sent_at timestamptz,
  replied_at timestamptz,
  thread_id text,
  created_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade,
  channel text,
  messages jsonb default '[]',   -- [{role, content, timestamp}]
  status text default 'active',  -- active | closed | escalated
  next_step text,
  urgency text default 'normal', -- normal | high | urgent
  last_message_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists scout_missions (
  id uuid primary key default gen_random_uuid(),
  query text not null,          -- e.g. "Shopify beauty stores in Dubai"
  market text,                  -- UAE | PK | UK | US | KSA
  industry text,
  status text default 'pending', -- pending | running | done | failed
  prospects_found int default 0,
  hot_leads int default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);
