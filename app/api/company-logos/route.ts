import { NextResponse, type NextRequest } from "next/server"

import { resolveCompanyLogo } from "@/lib/company-logos"
import { NO_LOGO } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

const batchSize = 60
const concurrency = 8

/**
 * Finds logos for the signed-in user's applications that don't have one yet
 * and saves them. Optional body: { ids: string[] } to limit which applications.
 * Returns { logos: { [applicationId]: url | null }, remaining: number }.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims?.sub) return NextResponse.json({ error: "Sign in to use this feature." }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { ids?: unknown }
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string").slice(0, 500) : null

  // Row-level security limits this to the user's own applications
  let query = supabase.from("applications").select("id, company, source_url, company_url").is("logo", null)
  if (ids) query = query.in("id", ids)
  const { data: pending, error } = await query.limit(batchSize + 1)

  if (error) {
    console.error("Logo lookup failed to load applications:", error.message)
    return NextResponse.json({ error: "Couldn't load applications." }, { status: 500 })
  }

  const rows = (pending ?? []).slice(0, batchSize)
  const logos: Record<string, string | null> = {}
  const queue = [...rows]

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let row = queue.shift(); row; row = queue.shift()) {
        const logo = await resolveCompanyLogo({
          company: row.company,
          sourceUrl: row.source_url ?? undefined,
          companyUrl: row.company_url ?? undefined,
        })
        const { error: updateError } = await supabase.from("applications").update({ logo }).eq("id", row.id).is("logo", null)
        if (updateError) console.error("Saving logo failed:", updateError.message)
        logos[row.id] = logo === NO_LOGO ? null : logo
      }
    }),
  )

  return NextResponse.json({ logos, remaining: Math.max(0, (pending ?? []).length - rows.length) })
}
