-- Phase 3 Schema Updates

-- 1. Create Events Table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  date date not null,
  type text not null check (type in ('meeting', 'function', 'birthday', 'other')),
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for events
alter table public.events enable row level security;

-- Policies for events
create policy "Users can view their own events" 
  on public.events for select 
  using (auth.uid() = user_id);

create policy "Users can create their own events" 
  on public.events for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own events" 
  on public.events for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own events" 
  on public.events for delete 
  using (auth.uid() = user_id);


-- 2. Create Categories Table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('expense', 'income', 'habit', 'task_group', 'gallery_tag')),
  color text default '#6b7280',
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name, type) -- Prevent duplicate category names per type for a user
);

-- Enable RLS for categories
alter table public.categories enable row level security;

-- Policies for categories
create policy "Users can view their own categories" 
  on public.categories for select 
  using (auth.uid() = user_id);

create policy "Users can create their own categories" 
  on public.categories for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own categories" 
  on public.categories for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own categories" 
  on public.categories for delete 
  using (auth.uid() = user_id);

-- Optional: If you want to seed default categories for existing users, you might want a function, 
-- but the app handles it via `initializeDefaultCategories` in `categories.ts`.
