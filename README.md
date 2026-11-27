# Pursuit — job search dashboard

Next.js 16 + Supabase (Postgres, Auth, Storage). Each user signs up with email and password and only ever sees their own data. Row-level security enforces that in the database itself.

## One-time setup

### 1. Supabase project
Create one at [supabase.com](https://supabase.com/dashboard) or through Vercel → your project → **Storage** → Supabase.

### 2. Create the database tables
Supabase → **SQL Editor** → **New query** → paste the contents of
[`supabase/migrations/20261127000000_initial_schema.sql`](supabase/migrations/20261127000000_initial_schema.sql) → **Run**.

This creates the `profiles`, `applications`, `application_status_events` and `interview_practice` tables, their security policies, and a private `resumes` storage bucket.

### 3. Auth settings
Supabase → **Authentication** → **URL Configuration**:
- **Site URL**: your production URL, e.g. `https://your-app.vercel.app`
- **Redirect URLs**: add `https://your-app.vercel.app/**` and `http://localhost:3000/**`

Email confirmation is on by default, which is what you want for launch. Supabase's built-in email sender is rate-limited to a few emails an hour. Before launch, set up custom SMTP under **Authentication → Emails → SMTP Settings** (Resend, Postmark, etc.).

### 4. Environment variables
On **Vercel**, connecting Supabase through the Storage tab sets these automatically. Check under **Settings → Environment Variables**.

Locally: `cp .env.example .env.local` and fill in the values from Supabase → **Project Settings → API**.

| Variable | Where it's from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) | anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` *(optional)* | Production URL, used in email links. Defaults to the request's host. |

Never put the `service_role` / secret key in this app. It isn't needed.

## Run locally
```bash
pnpm install
pnpm dev
```
Open http://localhost:3000, create an account, and confirm it from your email.

To load test data into your account, see [`supabase/sample-data.sql`](supabase/sample-data.sql).

## How the data flows
- `app/(app)/layout.tsx` loads the signed-in user's data on the server and passes it to the providers.
- `components/applications-provider.tsx` and `components/job-profile-provider.tsx` update the screen immediately, save to Supabase, and roll back with a toast if the save fails.
- `lib/dashboard-metrics.ts` calculates the KPIs, the weekly activity chart and next steps from real records. Status changes are logged by a database trigger, so "responses received" uses the date a status actually changed.
- `proxy.ts` refreshes the session cookie and sends signed-out visitors to `/login`. API routes return 401.

## Staging on Vercel

Staging is a Vercel **preview** deployment of the `staging` branch, with a fixed address. It's protected by Vercel login by default, so only you can open it.

1. **Vercel project:** in Vercel, open the project linked to this GitHub repo, or create one with **Add New → Project → Import** `job-tracking-dashboard-design`. Leave the production branch as `main`.
2. **Fixed staging address:** under **Settings → Domains**, add `pursuit-staging.vercel.app` (or any free `*.vercel.app` name) and set **Git branch** to `staging`.
3. **Environment variables:** under **Settings → Environment Variables**, add these for the **Preview** environment only:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
   | `SUPABASE_SECRET_KEY` | Supabase secret key (mark it **Sensitive**) |
   | `CRON_SECRET` | Same value as in `.env.local` |
   | `NEXT_PUBLIC_SITE_URL` | `https://pursuit-staging.vercel.app` |
   | `ANTHROPIC_API_KEY` | Claude API key, used for resume tailoring (mark it **Sensitive**) |

4. **Supabase auth:** under **Authentication → URL Configuration → Redirect URLs**, add `https://pursuit-staging.vercel.app/**`.
5. **AI features:** under the Vercel team's **AI Gateway** tab, enable it. Deployments authenticate automatically, with no key needed.
6. **Deploy:** push the `staging` branch. Every push redeploys staging.

Notes:
- **Shared database:** staging uses the same Supabase project as local development, so data is shared. Create a separate Supabase project for production when you launch.
- **Job sync:** Vercel Cron only runs on **production** deployments. On staging, Canvas jobs come from the shared database; refresh them by running the sync locally:
  `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-jobs`
