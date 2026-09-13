# Product Control Center — Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings → API

## 2. Run the Database Migrations

In the Supabase Dashboard → SQL Editor, run these files **in order**:

1. `supabase/migrations/001_initial_schema.sql` — Full schema, RLS, triggers
2. `supabase/migrations/002_seed_data.sql` — Role seed data (DEV, MANAGER, WORKER)

## 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. (Optional) Enable Google OAuth

In Supabase Dashboard → Authentication → Providers → Google:
- Enable Google provider
- Add your Google OAuth credentials

## 5. Set Your First User as DEV

After registering the first user via the app, promote them to DEV role:

```sql
-- Run in Supabase SQL Editor
UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE name = 'DEV')
WHERE email = 'your-email@example.com';
```

## 6. Start the Dev Server

```bash
npm run dev
```

Open http://localhost:3000 — sign up and start managing products!

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Custom Aqua theme |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | PostgreSQL via Supabase |
| Realtime | Supabase Realtime (postgres_changes) |
| Security | Row Level Security (RLS) on all tables |

## Roles & Permissions

| Permission | DEV | MANAGER | WORKER |
|-----------|-----|---------|--------|
| Create/Edit/Delete Products | ✓ / ✓ / ✓ | ✓ / ✓ / ✗ | ✗ |
| Create/Edit/Delete Versions | ✓ / ✓ / ✓ | ✓ / ✓ / ✗ | ✗ |
| Log Updates | ✓ | ✓ | ✓ (assigned only) |
| Manage Users & Roles | ✓ | ✗ | ✗ |
| Manage Assignments | ✓ | ✓ | ✗ |
| View Audit Logs | All | Own + assigned | Own only |
| Admin Panel | ✓ | ✓ | ✗ |
