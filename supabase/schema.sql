-- Courses table
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  source_type text not null check (source_type in ('pdf', 'article', 'video')),
  source_url text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  created_at timestamptz default now()
);

-- Chapters table
create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade not null,
  title text not null,
  summary text not null,
  audio_url text,
  order_index int not null,
  created_at timestamptz default now()
);

-- Questions table
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references chapters(id) on delete cascade not null,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table courses enable row level security;
alter table chapters enable row level security;
alter table questions enable row level security;

-- RLS Policies
create policy "Users see own courses" on courses for select using (auth.uid() = user_id);
create policy "Users create own courses" on courses for insert with check (auth.uid() = user_id);
create policy "Users delete own courses" on courses for delete using (auth.uid() = user_id);
create policy "Users see own chapters" on chapters for select using (
  course_id in (select id from courses where user_id = auth.uid())
);
create policy "Users see own questions" on questions for select using (
  chapter_id in (select id from chapters where course_id in (select id from courses where user_id = auth.uid()))
);

-- Storage bucket for audio files
insert into storage.buckets (id, name, public) values ('audio', 'audio', true)
on conflict do nothing;

create policy "Anyone can read audio" on storage.objects for select using (bucket_id = 'audio');
create policy "Authenticated users upload audio" on storage.objects for insert with check (bucket_id = 'audio' and auth.role() = 'authenticated');
