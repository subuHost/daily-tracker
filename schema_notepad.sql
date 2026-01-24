-- Notes Table for Short Notepad
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for notes
alter table public.notes enable row level security;

-- Policies for notes
create policy "Users can view their own notes" 
  on public.notes for select 
  using (auth.uid() = user_id);

create policy "Users can create their own notes" 
  on public.notes for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own notes" 
  on public.notes for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own notes" 
  on public.notes for delete 
  using (auth.uid() = user_id);
