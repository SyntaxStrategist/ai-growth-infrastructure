-- Create intent_translations table for caching AI translations
create table if not exists public.intent_translations (
  id uuid primary key default gen_random_uuid(),
  original text not null,
  translated text not null,
  source_lang text not null,
  target_lang text not null,
  created_at timestamptz default now()
);

-- Create index for faster lookups
create index if not exists idx_intent_translations_lookup 
on public.intent_translations (original, target_lang);

-- Add RLS policies
alter table public.intent_translations enable row level security;

-- Allow read access for authenticated users
create policy "Allow read access for authenticated users" on public.intent_translations
  for select using (auth.role() = 'authenticated');

-- Allow insert access for authenticated users
create policy "Allow insert access for authenticated users" on public.intent_translations
  for insert with check (auth.role() = 'authenticated');
