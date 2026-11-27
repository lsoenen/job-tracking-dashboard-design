import "server-only"

import { createClient } from "@supabase/supabase-js"

/**
 * Full-access client for trusted server jobs (the daily job sync).
 * Never import this from a component: the secret key bypasses row-level security.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Missing SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY). See .env.example.")
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
