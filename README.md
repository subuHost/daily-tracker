# Daily Tracker

A comprehensive personal life management application built with Next.js 14, Supabase, and shadcn/ui.

## Features

- 📊 **Dashboard** - Overview widgets for budget, tasks, expenses, habits, and net worth
- 💰 **Finance Management** - Track expenses, income, budgets, debts, bills, and investments
- 🛒 **Shopping List** - Wishlist with priority and links
- ✅ **Task Management** - Todo lists with projects and priorities
- 📔 **Daily Journal** - Record thoughts, learnings, and workouts
- 🎯 **Habit Tracker** - Track habits with streaks and heatmaps
- 📅 **Calendar** - View all events in one place
- 👥 **Contacts** - Manage contacts with birthday reminders
- 🖼️ **Gallery** - Upload and organize documents and images
- 📈 **Reports** - Analytics with charts and CSV export
- ⚙️ **Settings** - Customize categories, themes, and more

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- A Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd daily-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Go to Project Settings > API to get your credentials

4. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Set up the database**
   - Go to Supabase SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL to create all tables and policies

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth pages (login, signup, reset)
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── finance/      # Finance section
│   │   ├── shopping/     # Shopping/wishlist
│   │   ├── tasks/        # Task management
│   │   ├── journal/      # Daily journal
│   │   ├── habits/       # Habit tracker
│   │   ├── calendar/     # Calendar view
│   │   ├── contacts/     # Contacts
│   │   ├── gallery/      # File gallery
│   │   ├── reports/      # Analytics
│   │   └── settings/     # Settings
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Root page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard widgets
│   └── providers/        # Context providers
├── lib/
│   ├── supabase/         # Supabase client
│   └── utils.ts          # Utility functions
└── middleware.ts         # Auth middleware
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Database Schema

The app uses the following main tables:

- `categories` - User-defined categories
- `transactions` - Expenses and income
- `budgets` - Monthly/yearly budgets
- `debts` - Lending and borrowing
- `bills` - Recurring bills
- `investments` - Stock/crypto portfolio
- `shopping_items` - Wishlist items
- `tasks` - Task management
- `daily_entries` - Journal entries
- `habits` - Habit definitions
- `habit_logs` - Daily habit logs
- `contacts` - Contact management
- `gallery_items` - Uploaded files

All tables have Row Level Security (RLS) enabled so users can only access their own data.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables
4. Deploy!

## License

MIT
