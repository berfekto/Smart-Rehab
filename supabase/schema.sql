-- Smart Rehab OS — مخطط قاعدة بيانات Supabase الجاهز للربط المباشر
-- يتطابق مع بنية الحالة في src/store/AppContext.jsx و src/lib/storage.js

create table if not exists public.custom_injuries (
  id text primary key,
  name text not null,
  en text,
  category text not null,
  region text not null,
  management text[] default '{conservative}',
  neuro boolean default false,
  summary text,
  pearls jsonb default '[]'::jsonb,
  red_flags jsonb default '[]'::jsonb,
  rom jsonb default '{}'::jsonb,
  phases jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.patients (
  id text primary key,
  name text not null,
  age int,
  weight numeric,
  height numeric,
  gender text,
  phone text,
  sport text,
  activity_level text,
  region text not null,
  side text,
  tissue text not null,
  injury_id text not null,
  diagnosis text not null,
  status text not null check (status in ('preop', 'postop', 'conservative')),
  injury_date date,
  surgery_date date,
  rehab_start_date date,
  current_phase int default 1,
  phase_start_date date,
  discharged boolean default false,
  criteria jsonb default '{}'::jsonb,
  protocol_overrides jsonb default '{}'::jsonb,
  phase_history jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.rehab_sessions (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  session_date date not null,
  phase int not null,
  light text not null check (light in ('green', 'yellow', 'red')),
  reasons jsonb default '[]'::jsonb,
  pain numeric not null,
  effusion int not null,
  nerve int default 0,
  rom numeric,
  hydro boolean default false,
  exercises jsonb not null default '[]'::jsonb,
  completion int default 100,
  notes text,
  created_at timestamptz default now()
);
